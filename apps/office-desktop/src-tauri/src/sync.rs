use crate::credentials::read_credential;
use reqwest::{redirect::Policy, Client, StatusCode, Url};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::{sqlite::SqliteRow, Row};
use std::{
    collections::HashSet,
    sync::atomic::{AtomicBool, Ordering},
    time::Duration,
};
use tauri::{AppHandle, State};
use tauri_plugin_sql::{DbInstances, DbPool};
use uuid::Uuid;

const OFFICE_DATABASE_URL: &str = "sqlite:abdullah-office.db";
const MAX_SYNC_OPERATIONS: usize = 25;
const MAX_SYNC_REQUEST_BYTES: usize = 256 * 1024;
const MAX_SYNC_RESPONSE_BYTES: usize = 512 * 1024;

#[derive(Default)]
pub(crate) struct SyncGuard(AtomicBool);

struct SyncLease<'a>(&'a AtomicBool);

impl Drop for SyncLease<'_> {
    fn drop(&mut self) {
        self.0.store(false, Ordering::Release);
    }
}

impl SyncGuard {
    fn acquire(&self) -> Result<SyncLease<'_>, String> {
        self.0
            .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
            .map_err(|_| "A desktop synchronization is already running.".to_owned())?;
        Ok(SyncLease(&self.0))
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SyncRequest<'a> {
    protocol_version: u8,
    operations: &'a [Value],
}

#[derive(Clone)]
struct OperationIdentity {
    client_operation_id: String,
    idempotency_key: String,
    aggregate_type: String,
    aggregate_id: String,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SyncErrorDetail {
    code: String,
    message: String,
    retryable: bool,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SyncResult {
    client_operation_id: String,
    idempotency_key: String,
    aggregate_type: String,
    aggregate_id: String,
    status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    server_record_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    server_version: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<SyncErrorDetail>,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SyncResponse {
    protocol_version: u8,
    server_time: String,
    results: Vec<SyncResult>,
}

fn operation_identity(value: &Value) -> Result<OperationIdentity, String> {
    let object = value
        .as_object()
        .ok_or_else(|| "Each sync operation must be a JSON object.".to_owned())?;
    if object.get("schemaVersion").and_then(Value::as_u64) != Some(1) {
        return Err("A queued operation uses an unsupported protocol version.".into());
    }
    let string = |name: &str| {
        object
            .get(name)
            .and_then(Value::as_str)
            .map(str::to_owned)
            .ok_or_else(|| format!("The queued operation is missing {name}."))
    };
    let identity = OperationIdentity {
        client_operation_id: string("clientOperationId")?,
        idempotency_key: string("idempotencyKey")?,
        aggregate_type: string("aggregateType")?,
        aggregate_id: string("aggregateId")?,
    };
    Uuid::parse_str(&identity.client_operation_id)
        .map_err(|_| "The client operation ID is invalid.".to_owned())?;
    Uuid::parse_str(&identity.idempotency_key)
        .map_err(|_| "The idempotency key is invalid.".to_owned())?;
    Uuid::parse_str(&identity.aggregate_id)
        .map_err(|_| "The aggregate ID is invalid.".to_owned())?;
    if !matches!(
        identity.aggregate_type.as_str(),
        "lead" | "invoice_draft" | "notice_draft"
    ) {
        return Err(
            "This record type remains local because the server does not safely accept it yet."
                .into(),
        );
    }
    if object.get("command").and_then(Value::as_str) != Some("create") {
        return Err("Only protected server draft creation is enabled in desktop sync v1.".into());
    }
    if !matches!(
        object.get("state").and_then(Value::as_str),
        Some("queued" | "syncing")
    ) {
        return Err("Only queued desktop operations may be synchronized.".into());
    }
    Ok(identity)
}

fn validate_request(operations: &[Value]) -> Result<Vec<OperationIdentity>, String> {
    if operations.is_empty() {
        return Err("There are no eligible queued operations to synchronize.".into());
    }
    if operations.len() > MAX_SYNC_OPERATIONS {
        return Err(format!(
            "Synchronize at most {MAX_SYNC_OPERATIONS} operations per batch."
        ));
    }
    let encoded = serde_json::to_vec(&SyncRequest {
        protocol_version: 1,
        operations,
    })
    .map_err(|error| format!("The sync batch could not be encoded: {error}"))?;
    if encoded.len() > MAX_SYNC_REQUEST_BYTES {
        return Err("The sync batch exceeds the 256 KiB safety limit.".into());
    }
    let identities = operations
        .iter()
        .map(operation_identity)
        .collect::<Result<Vec<_>, _>>()?;
    let unique = identities
        .iter()
        .map(|value| value.client_operation_id.as_str())
        .collect::<HashSet<_>>();
    if unique.len() != identities.len() {
        return Err("The sync batch contains a duplicate client operation ID.".into());
    }
    Ok(identities)
}

fn required_string(row: &SqliteRow, column: &str) -> Result<String, String> {
    row.try_get(column)
        .map_err(|_| format!("The local outbox contains an invalid {column} value."))
}

fn optional_string(row: &SqliteRow, column: &str) -> Result<Option<String>, String> {
    row.try_get(column)
        .map_err(|_| format!("The local outbox contains an invalid {column} value."))
}

fn operation_from_row(row: &SqliteRow) -> Result<Value, String> {
    let payload_json = required_string(row, "payload_json")?;
    let payload: Value = serde_json::from_str(&payload_json)
        .map_err(|_| "A queued operation contains damaged payload data.".to_owned())?;
    let last_failure: Option<Value> = optional_string(row, "last_failure_json")?
        .map(|value| serde_json::from_str(&value))
        .transpose()
        .map_err(|_| "A queued operation contains damaged failure data.".to_owned())?;

    Ok(json!({
        "schemaVersion": row.try_get::<i64, _>("schema_version").map_err(|_| "A queued operation has an invalid schema version.")?,
        "clientOperationId": required_string(row, "client_operation_id")?,
        "idempotencyKey": required_string(row, "idempotency_key")?,
        "draftId": required_string(row, "draft_id")?,
        "draftLocalRevision": row.try_get::<i64, _>("draft_local_revision").map_err(|_| "A queued operation has an invalid draft revision.")?,
        "aggregateType": required_string(row, "aggregate_type")?,
        "aggregateId": required_string(row, "aggregate_id")?,
        "command": required_string(row, "command")?,
        "payload": payload,
        "expectedServerVersion": row.try_get::<Option<i64>, _>("expected_server_version").map_err(|_| "A queued operation has an invalid expected server version.")?,
        "state": required_string(row, "state")?,
        "attemptCount": row.try_get::<i64, _>("attempt_count").map_err(|_| "A queued operation has an invalid attempt count.")?,
        "nextAttemptAt": optional_string(row, "next_attempt_at")?,
        "leaseOwner": optional_string(row, "lease_owner")?,
        "leaseExpiresAt": optional_string(row, "lease_expires_at")?,
        "lastFailure": last_failure,
        "syncedAt": optional_string(row, "synced_at")?,
        "createdAt": required_string(row, "created_at")?,
        "updatedAt": required_string(row, "updated_at")?,
    }))
}

async fn load_canonical_sync_batch(db_instances: &DbInstances) -> Result<Vec<Value>, String> {
    let pool = {
        let instances = db_instances.0.read().await;
        match instances.get(OFFICE_DATABASE_URL) {
            Some(DbPool::Sqlite(pool)) => pool.clone(),
            _ => return Err("The local SQLite workspace is not ready.".into()),
        }
    };
    sqlx::query(
        r#"UPDATE office_sync_operations
              SET state = 'queued', next_attempt_at = NULL, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
            WHERE state = 'retry_wait'
              AND next_attempt_at IS NOT NULL
              AND next_attempt_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')"#,
    )
    .execute(&pool)
    .await
    .map_err(|error| format!("Due retry operations could not be released: {error}"))?;
    let rows = sqlx::query(
        r#"SELECT schema_version, client_operation_id, idempotency_key, draft_id,
                  draft_local_revision, aggregate_type, aggregate_id, command, payload_json,
                  expected_server_version, state, attempt_count, next_attempt_at, lease_owner,
                  lease_expires_at, last_failure_json, synced_at, created_at, updated_at
             FROM office_sync_operations
            WHERE state = 'queued'
              AND command = 'create'
              AND aggregate_type IN ('lead', 'invoice_draft', 'notice_draft')
            ORDER BY created_at ASC
            LIMIT ?"#,
    )
    .bind(i64::try_from(MAX_SYNC_OPERATIONS).expect("sync limit fits in i64"))
    .fetch_all(&pool)
    .await
    .map_err(|error| format!("The local outbox could not be read for sync: {error}"))?;

    rows.iter().map(operation_from_row).collect()
}

fn retry_delay_seconds(attempt_count: i64, operation_id: &str) -> u64 {
    let exponent = u32::try_from(attempt_count.clamp(0, 6)).unwrap_or(6);
    let base = 15_u64.saturating_mul(2_u64.saturating_pow(exponent));
    let jitter = operation_id
        .bytes()
        .fold(0_u64, |sum, byte| sum.wrapping_add(u64::from(byte)))
        % 11;
    base.saturating_add(jitter).min(900)
}

async fn schedule_retry_batch(
    db_instances: &DbInstances,
    identities: &[OperationIdentity],
    code: &str,
    message: &str,
) -> Result<(), String> {
    let pool = {
        let instances = db_instances.0.read().await;
        match instances.get(OFFICE_DATABASE_URL) {
            Some(DbPool::Sqlite(pool)) => pool.clone(),
            _ => return Err("The local SQLite workspace is not ready.".into()),
        }
    };
    let mut transaction = pool
        .begin()
        .await
        .map_err(|error| format!("The retry schedule transaction could not begin: {error}"))?;
    for identity in identities {
        let attempt_count = sqlx::query_scalar::<_, i64>(
            "SELECT attempt_count FROM office_sync_operations WHERE client_operation_id = ? LIMIT 1",
        )
        .bind(&identity.client_operation_id)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(|error| format!("The retry attempt count could not be read: {error}"))?
        .ok_or_else(|| "A retry operation disappeared from the local outbox.".to_owned())?;
        let modifier = format!(
            "+{} seconds",
            retry_delay_seconds(attempt_count, &identity.client_operation_id)
        );
        sqlx::query(
            r#"UPDATE office_sync_operations
                  SET state = 'retry_wait', attempt_count = MIN(attempt_count + 1, 100),
                      next_attempt_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?),
                      lease_owner = NULL, lease_expires_at = NULL,
                      last_failure_json = json_object(
                        'code', ?, 'message', ?, 'retryable', json('true'),
                        'occurredAt', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
                      ),
                      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
                WHERE client_operation_id = ? AND state IN ('queued', 'syncing', 'retry_wait')"#,
        )
        .bind(modifier)
        .bind(code)
        .bind(message)
        .bind(&identity.client_operation_id)
        .execute(&mut *transaction)
        .await
        .map_err(|error| format!("The retry operation could not be scheduled: {error}"))?;
    }
    transaction
        .commit()
        .await
        .map_err(|error| format!("The retry schedule could not be committed: {error}"))
}

async fn read_bounded_response(
    mut response: reqwest::Response,
) -> Result<(StatusCode, Vec<u8>), String> {
    if response
        .content_length()
        .is_some_and(|length| length > MAX_SYNC_RESPONSE_BYTES as u64)
    {
        return Err("The Office API response exceeded the desktop safety limit.".into());
    }
    let status = response.status();
    let mut body = Vec::with_capacity(
        response
            .content_length()
            .unwrap_or_default()
            .min(MAX_SYNC_RESPONSE_BYTES as u64) as usize,
    );
    while let Some(chunk) = response
        .chunk()
        .await
        .map_err(|_| "The Office API response could not be read.".to_owned())?
    {
        if body.len().saturating_add(chunk.len()) > MAX_SYNC_RESPONSE_BYTES {
            return Err("The Office API response exceeded the desktop safety limit.".into());
        }
        body.extend_from_slice(&chunk);
    }
    Ok((status, body))
}

fn validate_response(
    response: &SyncResponse,
    identities: &[OperationIdentity],
) -> Result<(), String> {
    if response.protocol_version != 1 {
        return Err("The Office API returned an unsupported protocol version.".into());
    }
    if response.results.len() != identities.len() {
        return Err("The Office API did not return one result for every operation.".into());
    }
    let expected = identities
        .iter()
        .map(|value| value.client_operation_id.as_str())
        .collect::<HashSet<_>>();
    let actual = response
        .results
        .iter()
        .map(|value| value.client_operation_id.as_str())
        .collect::<HashSet<_>>();
    if expected != actual || actual.len() != response.results.len() {
        return Err("The Office API returned mismatched or duplicate operation results.".into());
    }
    for result in &response.results {
        let identity = identities
            .iter()
            .find(|value| value.client_operation_id == result.client_operation_id)
            .ok_or_else(|| "The Office API returned an unknown operation result.".to_owned())?;
        if identity.idempotency_key != result.idempotency_key
            || identity.aggregate_type != result.aggregate_type
            || identity.aggregate_id != result.aggregate_id
            || !matches!(
                result.status.as_str(),
                "accepted" | "duplicate" | "conflict" | "permission_blocked" | "rejected"
            )
        {
            return Err(
                "The Office API returned a result that does not match the queued operation.".into(),
            );
        }
    }
    Ok(())
}

async fn apply_response(db_instances: &DbInstances, response: &SyncResponse) -> Result<(), String> {
    let pool = {
        let instances = db_instances.0.read().await;
        match instances.get(OFFICE_DATABASE_URL) {
            Some(DbPool::Sqlite(pool)) => pool.clone(),
            _ => return Err("The local SQLite workspace is not ready.".into()),
        }
    };
    let mut transaction = pool
        .begin()
        .await
        .map_err(|error| format!("The sync result transaction could not begin: {error}"))?;

    for result in &response.results {
        let existing = sqlx::query(
            "SELECT idempotency_key, aggregate_type, aggregate_id FROM office_sync_operations WHERE client_operation_id = ? LIMIT 1",
        )
        .bind(&result.client_operation_id)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(|error| format!("The queued operation could not be reconciled: {error}"))?
        .ok_or_else(|| "A synchronized operation is missing from the local outbox.".to_owned())?;
        if existing
            .try_get::<String, _>("idempotency_key")
            .ok()
            .as_deref()
            != Some(result.idempotency_key.as_str())
            || existing
                .try_get::<String, _>("aggregate_type")
                .ok()
                .as_deref()
                != Some(result.aggregate_type.as_str())
            || existing
                .try_get::<String, _>("aggregate_id")
                .ok()
                .as_deref()
                != Some(result.aggregate_id.as_str())
        {
            return Err("A server result failed local idempotency verification.".into());
        }

        let local_state = match result.status.as_str() {
            "accepted" | "duplicate" => "synced",
            "permission_blocked" => "permission_blocked",
            "conflict" | "rejected" => "conflict",
            _ => unreachable!("response status was validated"),
        };
        let error_json = result
            .error
            .as_ref()
            .map(serde_json::to_string)
            .transpose()
            .map_err(|error| format!("The server error detail could not be encoded: {error}"))?;
        let synced_at = matches!(result.status.as_str(), "accepted" | "duplicate")
            .then_some(response.server_time.as_str());
        sqlx::query(
            r#"UPDATE office_sync_operations
                  SET state = ?, attempt_count = MIN(attempt_count + 1, 100),
                      next_attempt_at = NULL, lease_owner = NULL, lease_expires_at = NULL,
                      last_failure_json = ?, synced_at = ?, updated_at = ?
                WHERE client_operation_id = ?"#,
        )
        .bind(local_state)
        .bind(&error_json)
        .bind(synced_at)
        .bind(&response.server_time)
        .bind(&result.client_operation_id)
        .execute(&mut *transaction)
        .await
        .map_err(|error| format!("The local outbox result could not be updated: {error}"))?;

        sqlx::query(
            r#"INSERT INTO office_sync_receipts (
                 client_operation_id, idempotency_key, aggregate_type, aggregate_id,
                 result_status, server_record_id, server_version, error_json, server_time, received_at
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(client_operation_id) DO UPDATE SET
                 result_status = excluded.result_status,
                 server_record_id = excluded.server_record_id,
                 server_version = excluded.server_version,
                 error_json = excluded.error_json,
                 server_time = excluded.server_time,
                 received_at = excluded.received_at"#,
        )
        .bind(&result.client_operation_id)
        .bind(&result.idempotency_key)
        .bind(&result.aggregate_type)
        .bind(&result.aggregate_id)
        .bind(&result.status)
        .bind(&result.server_record_id)
        .bind(result.server_version)
        .bind(&error_json)
        .bind(&response.server_time)
        .bind(&response.server_time)
        .execute(&mut *transaction)
        .await
        .map_err(|error| format!("The local sync receipt could not be stored: {error}"))?;

        if let Some(version) = result.server_version {
            sqlx::query(
                "UPDATE office_offline_drafts SET base_server_version = ?, updated_at = ? WHERE aggregate_type = ? AND aggregate_id = ?",
            )
            .bind(version)
            .bind(&response.server_time)
            .bind(&result.aggregate_type)
            .bind(&result.aggregate_id)
            .execute(&mut *transaction)
            .await
            .map_err(|error| format!("The synchronized draft version could not be recorded: {error}"))?;
        }
    }

    transaction
        .commit()
        .await
        .map_err(|error| format!("The sync result transaction could not be committed: {error}"))?;
    Ok(())
}

#[tauri::command]
pub(crate) async fn sync_office_operations(
    app: AppHandle,
    db_instances: State<'_, DbInstances>,
    guard: State<'_, SyncGuard>,
) -> Result<SyncResponse, String> {
    let _lease = guard.acquire()?;
    // The renderer selects no records and supplies no payload. Rust reads the
    // canonical, validated operation bodies directly from the durable outbox.
    let operations = load_canonical_sync_batch(&db_instances).await?;
    let identities = validate_request(&operations)?;
    let credential = read_credential(&app)?
        .ok_or_else(|| "Connect this Windows device before synchronizing.".to_owned())?;
    let endpoint = Url::parse(credential.api_origin())
        .and_then(|origin| origin.join("/api/office/v1/sync"))
        .map_err(|_| "The protected Office API address is invalid.".to_owned())?;
    let client = Client::builder()
        .https_only(!cfg!(debug_assertions))
        .redirect(Policy::none())
        .connect_timeout(Duration::from_secs(10))
        .timeout(Duration::from_secs(30))
        .user_agent("Abdullah-Properties-Office/0.1")
        .build()
        .map_err(|error| format!("The secure Office API client could not start: {error}"))?;
    let response = match client
        .post(endpoint)
        .bearer_auth(credential.token())
        .header("Accept", "application/json")
        .json(&SyncRequest {
            protocol_version: 1,
            operations: &operations,
        })
        .send()
        .await
    {
        Ok(response) => response,
        Err(_) => {
            let message = "The Office API could not be reached. Local records remain safely queued with a retry schedule.";
            schedule_retry_batch(&db_instances, &identities, "network_unavailable", message)
                .await?;
            return Err(message.into());
        }
    };
    let (status, bytes) = match read_bounded_response(response).await {
        Ok(value) => value,
        Err(error) if error.contains("could not be read") => {
            schedule_retry_batch(&db_instances, &identities, "response_interrupted", &error)
                .await?;
            return Err(error);
        }
        Err(error) => return Err(error),
    };
    if !status.is_success() {
        let message = match status {
            StatusCode::UNAUTHORIZED | StatusCode::FORBIDDEN => {
                "The device credential was rejected, expired, or revoked.".into()
            }
            StatusCode::TOO_MANY_REQUESTS => {
                "The Office API rate limit is active. Keep records queued and retry later.".into()
            }
            value if value.is_server_error() => {
                "The Office API is temporarily unavailable. Local records remain queued.".into()
            }
            value => format!("The Office API rejected the sync batch ({value})."),
        };
        if status == StatusCode::TOO_MANY_REQUESTS || status.is_server_error() {
            schedule_retry_batch(&db_instances, &identities, "server_retryable", &message).await?;
        }
        return Err(message);
    }
    let parsed: SyncResponse = serde_json::from_slice(&bytes)
        .map_err(|_| "The Office API returned an invalid response envelope.".to_owned())?;
    validate_response(&parsed, &identities)?;
    apply_response(&db_instances, &parsed).await?;
    Ok(parsed)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn operation(id: &str) -> Value {
        serde_json::json!({
            "schemaVersion": 1,
            "clientOperationId": id,
            "idempotencyKey": "21111111-1111-4111-8111-111111111111",
            "draftId": "31111111-1111-4111-8111-111111111111",
            "draftLocalRevision": 1,
            "aggregateType": "lead",
            "aggregateId": "41111111-1111-4111-8111-111111111111",
            "command": "create",
            "payload": { "kind": "lead" },
            "expectedServerVersion": null,
            "state": "queued",
            "attemptCount": 0,
            "nextAttemptAt": null,
            "leaseOwner": null,
            "leaseExpiresAt": null,
            "lastFailure": null,
            "syncedAt": null,
            "createdAt": "2026-07-15T12:00:00.000Z",
            "updatedAt": "2026-07-15T12:00:00.000Z"
        })
    }

    #[test]
    fn retry_backoff_is_bounded_and_jittered() {
        let first = retry_delay_seconds(0, "11111111-1111-4111-8111-111111111111");
        let later = retry_delay_seconds(5, "11111111-1111-4111-8111-111111111111");
        assert!((15..=25).contains(&first));
        assert!(later > first);
        assert_eq!(retry_delay_seconds(100, "x"), 900);
    }

    #[test]
    fn accepts_a_safe_version_one_draft_batch() {
        let identities = validate_request(&[operation("11111111-1111-4111-8111-111111111111")])
            .expect("safe lead should validate");
        assert_eq!(identities.len(), 1);
        assert_eq!(identities[0].aggregate_type, "lead");
    }

    #[test]
    fn rejects_financial_acknowledgements_from_desktop_sync() {
        let mut value = operation("11111111-1111-4111-8111-111111111111");
        value["aggregateType"] = Value::String("payment_acknowledgement".into());
        assert!(validate_request(&[value]).is_err());
    }
}

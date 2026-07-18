use serde::Deserialize;
use serde_json::Value;
use sqlx::Row;
use tauri::State;
use tauri_plugin_sql::{DbInstances, DbPool};
use uuid::Uuid;

const OFFICE_DATABASE_URL: &str = "sqlite:abdullah-office.db";
const SUPPORTED_AGGREGATES: [&str; 5] = [
    "contact",
    "lead",
    "invoice_draft",
    "payment_acknowledgement",
    "notice_draft",
];
const SUPPORTED_COMMANDS: [&str; 4] = ["create", "update", "submit", "archive"];

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct NativeOfflineCommit {
    expected_local_revision: i64,
    draft: NativeOfflineDraft,
    operation: NativeOfflineOperation,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct NativeOfflineDraft {
    schema_version: i64,
    draft_id: String,
    aggregate_type: String,
    aggregate_id: String,
    state: String,
    payload: Value,
    local_revision: i64,
    base_server_version: Option<i64>,
    last_saved_at: Option<String>,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct NativeOfflineOperation {
    schema_version: i64,
    client_operation_id: String,
    idempotency_key: String,
    draft_id: String,
    draft_local_revision: i64,
    aggregate_type: String,
    aggregate_id: String,
    command: String,
    payload: Value,
    expected_server_version: Option<i64>,
    state: String,
    attempt_count: i64,
    next_attempt_at: Option<String>,
    lease_owner: Option<String>,
    lease_expires_at: Option<String>,
    last_failure: Option<Value>,
    synced_at: Option<String>,
    created_at: String,
    updated_at: String,
}

fn validate_uuid(value: &str, label: &str) -> Result<(), String> {
    Uuid::parse_str(value)
        .map(|_| ())
        .map_err(|_| format!("{label} must be a valid UUID."))
}

fn validate_commit(value: &NativeOfflineCommit) -> Result<(), String> {
    let draft = &value.draft;
    let operation = &value.operation;

    if draft.schema_version != 1 || operation.schema_version != 1 {
        return Err("The local record uses an unsupported offline protocol version.".into());
    }
    if value.expected_local_revision < 0
        || draft.local_revision != value.expected_local_revision + 1
        || operation.draft_local_revision != draft.local_revision
    {
        return Err("The local revision contract is invalid.".into());
    }
    if !SUPPORTED_AGGREGATES.contains(&draft.aggregate_type.as_str())
        || operation.aggregate_type != draft.aggregate_type
        || operation.aggregate_id != draft.aggregate_id
    {
        return Err("The draft and queued operation describe different record types.".into());
    }
    if !matches!(draft.state.as_str(), "editing" | "local_saved") {
        return Err("The local draft lifecycle state is invalid.".into());
    }
    if !SUPPORTED_COMMANDS.contains(&operation.command.as_str()) {
        return Err("The queued operation command is invalid.".into());
    }
    if operation.state != "queued"
        || operation.attempt_count != 0
        || operation.next_attempt_at.is_some()
        || operation.lease_owner.is_some()
        || operation.lease_expires_at.is_some()
        || operation.last_failure.is_some()
        || operation.synced_at.is_some()
    {
        return Err("A new local operation must enter the durable queue in a clean state.".into());
    }
    if operation.draft_id != draft.draft_id
        || operation.payload != draft.payload
        || operation.expected_server_version != draft.base_server_version
    {
        return Err("The queued operation does not match its local draft.".into());
    }
    if !draft.payload.is_object() {
        return Err("The local record payload must be a JSON object.".into());
    }
    if draft.created_at.is_empty()
        || draft.updated_at.is_empty()
        || operation.created_at.is_empty()
        || operation.updated_at.is_empty()
    {
        return Err("The local record timestamps are required.".into());
    }

    validate_uuid(&draft.draft_id, "Draft ID")?;
    validate_uuid(&draft.aggregate_id, "Aggregate ID")?;
    validate_uuid(&operation.client_operation_id, "Client operation ID")?;
    validate_uuid(&operation.idempotency_key, "Idempotency key")?;
    Ok(())
}

fn database_error(context: &str, error: impl std::fmt::Display) -> String {
    format!("{context}: {error}")
}

async fn operation_is_duplicate(
    transaction: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    operation: &NativeOfflineOperation,
) -> Result<Option<bool>, String> {
    let row = sqlx::query(
        r#"SELECT client_operation_id, draft_id, draft_local_revision, aggregate_type,
                  aggregate_id, command, payload_json, expected_server_version
             FROM office_sync_operations
            WHERE idempotency_key = ?
            LIMIT 1"#,
    )
    .bind(&operation.idempotency_key)
    .fetch_optional(&mut **transaction)
    .await
    .map_err(|error| database_error("The idempotency ledger could not be checked", error))?;

    let Some(row) = row else {
        return Ok(None);
    };
    let payload_json: String = row.try_get("payload_json").map_err(|error| {
        database_error("The existing operation payload could not be read", error)
    })?;
    let payload: Value = serde_json::from_str(&payload_json)
        .map_err(|error| database_error("The existing operation payload is damaged", error))?;
    let expected_server_version: Option<i64> =
        row.try_get("expected_server_version").map_err(|error| {
            database_error("The existing operation version could not be read", error)
        })?;

    Ok(Some(
        row.try_get::<String, _>("client_operation_id")
            .ok()
            .as_deref()
            == Some(operation.client_operation_id.as_str())
            && row.try_get::<String, _>("draft_id").ok().as_deref()
                == Some(operation.draft_id.as_str())
            && row.try_get::<i64, _>("draft_local_revision").ok()
                == Some(operation.draft_local_revision)
            && row.try_get::<String, _>("aggregate_type").ok().as_deref()
                == Some(operation.aggregate_type.as_str())
            && row.try_get::<String, _>("aggregate_id").ok().as_deref()
                == Some(operation.aggregate_id.as_str())
            && row.try_get::<String, _>("command").ok().as_deref()
                == Some(operation.command.as_str())
            && payload == operation.payload
            && expected_server_version == operation.expected_server_version,
    ))
}

#[tauri::command]
pub(crate) async fn commit_offline_record(
    db_instances: State<'_, DbInstances>,
    value: NativeOfflineCommit,
) -> Result<&'static str, String> {
    validate_commit(&value)?;

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
        .map_err(|error| database_error("The local transaction could not begin", error))?;

    if let Some(is_duplicate) = operation_is_duplicate(&mut transaction, &value.operation).await? {
        if !is_duplicate {
            return Err(
                "An idempotency key already belongs to a different local operation.".into(),
            );
        }
        transaction
            .commit()
            .await
            .map_err(|error| database_error("The duplicate check could not be finalized", error))?;
        return Ok("duplicate");
    }

    let current_revision = sqlx::query_scalar::<_, i64>(
        "SELECT local_revision FROM office_offline_drafts WHERE draft_id = ? LIMIT 1",
    )
    .bind(&value.draft.draft_id)
    .fetch_optional(&mut *transaction)
    .await
    .map_err(|error| database_error("The current local revision could not be checked", error))?
    .unwrap_or(0);
    if current_revision != value.expected_local_revision {
        return Err(
            "The local record changed before it could be queued. Refresh and review it again."
                .into(),
        );
    }

    let draft = &value.draft;
    let draft_payload = serde_json::to_string(&draft.payload)
        .map_err(|error| database_error("The local record payload could not be encoded", error))?;
    let draft_write = sqlx::query(
        r#"INSERT INTO office_offline_drafts (
             schema_version, draft_id, aggregate_type, aggregate_id, state, payload_json,
             local_revision, base_server_version, last_saved_at, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(draft_id) DO UPDATE SET
             aggregate_type = excluded.aggregate_type,
             aggregate_id = excluded.aggregate_id,
             state = excluded.state,
             payload_json = excluded.payload_json,
             local_revision = excluded.local_revision,
             base_server_version = excluded.base_server_version,
             last_saved_at = excluded.last_saved_at,
             updated_at = excluded.updated_at
           WHERE office_offline_drafts.local_revision = ?"#,
    )
    .bind(draft.schema_version)
    .bind(&draft.draft_id)
    .bind(&draft.aggregate_type)
    .bind(&draft.aggregate_id)
    .bind(&draft.state)
    .bind(draft_payload)
    .bind(draft.local_revision)
    .bind(draft.base_server_version)
    .bind(&draft.last_saved_at)
    .bind(&draft.created_at)
    .bind(&draft.updated_at)
    .bind(value.expected_local_revision)
    .execute(&mut *transaction)
    .await
    .map_err(|error| database_error("The local draft could not be written", error))?;
    if draft_write.rows_affected() != 1 {
        return Err("The local record could not be committed at the expected revision.".into());
    }

    let operation = &value.operation;
    let operation_payload = serde_json::to_string(&operation.payload)
        .map_err(|error| database_error("The queued payload could not be encoded", error))?;
    sqlx::query(
        r#"INSERT INTO office_sync_operations (
             schema_version, client_operation_id, idempotency_key, draft_id,
             draft_local_revision, aggregate_type, aggregate_id, command, payload_json,
             expected_server_version, state, attempt_count, next_attempt_at, lease_owner,
             lease_expires_at, last_failure_json, synced_at, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
    )
    .bind(operation.schema_version)
    .bind(&operation.client_operation_id)
    .bind(&operation.idempotency_key)
    .bind(&operation.draft_id)
    .bind(operation.draft_local_revision)
    .bind(&operation.aggregate_type)
    .bind(&operation.aggregate_id)
    .bind(&operation.command)
    .bind(operation_payload)
    .bind(operation.expected_server_version)
    .bind(&operation.state)
    .bind(operation.attempt_count)
    .bind(&operation.next_attempt_at)
    .bind(&operation.lease_owner)
    .bind(&operation.lease_expires_at)
    .bind(
        operation
            .last_failure
            .as_ref()
            .map(serde_json::to_string)
            .transpose()
            .map_err(|error| database_error("The failure detail could not be encoded", error))?,
    )
    .bind(&operation.synced_at)
    .bind(&operation.created_at)
    .bind(&operation.updated_at)
    .execute(&mut *transaction)
    .await
    .map_err(|error| database_error("The durable outbox operation could not be written", error))?;

    let event_detail = serde_json::json!({ "aggregateType": operation.aggregate_type });
    sqlx::query(
        "INSERT INTO office_sync_events (client_operation_id, event_type, detail_json, created_at) VALUES (?, 'queued', ?, ?)",
    )
    .bind(&operation.client_operation_id)
    .bind(event_detail.to_string())
    .bind(&operation.created_at)
    .execute(&mut *transaction)
    .await
    .map_err(|error| database_error("The local sync audit event could not be written", error))?;

    transaction
        .commit()
        .await
        .map_err(|error| database_error("The local transaction could not be committed", error))?;
    Ok("committed")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_commit() -> NativeOfflineCommit {
        let payload = serde_json::json!({ "kind": "lead", "customerName": "Demo" });
        NativeOfflineCommit {
            expected_local_revision: 0,
            draft: NativeOfflineDraft {
                schema_version: 1,
                draft_id: "11111111-1111-4111-8111-111111111111".into(),
                aggregate_type: "lead".into(),
                aggregate_id: "21111111-1111-4111-8111-111111111111".into(),
                state: "local_saved".into(),
                payload: payload.clone(),
                local_revision: 1,
                base_server_version: None,
                last_saved_at: Some("2026-07-15T12:00:00.000Z".into()),
                created_at: "2026-07-15T12:00:00.000Z".into(),
                updated_at: "2026-07-15T12:00:00.000Z".into(),
            },
            operation: NativeOfflineOperation {
                schema_version: 1,
                client_operation_id: "31111111-1111-4111-8111-111111111111".into(),
                idempotency_key: "41111111-1111-4111-8111-111111111111".into(),
                draft_id: "11111111-1111-4111-8111-111111111111".into(),
                draft_local_revision: 1,
                aggregate_type: "lead".into(),
                aggregate_id: "21111111-1111-4111-8111-111111111111".into(),
                command: "create".into(),
                payload,
                expected_server_version: None,
                state: "queued".into(),
                attempt_count: 0,
                next_attempt_at: None,
                lease_owner: None,
                lease_expires_at: None,
                last_failure: None,
                synced_at: None,
                created_at: "2026-07-15T12:00:00.000Z".into(),
                updated_at: "2026-07-15T12:00:00.000Z".into(),
            },
        }
    }

    #[test]
    fn accepts_a_correlated_version_one_commit() {
        assert_eq!(validate_commit(&sample_commit()), Ok(()));
    }

    #[test]
    fn rejects_a_mismatched_operation_payload() {
        let mut value = sample_commit();
        value.operation.payload = serde_json::json!({ "kind": "notice_draft" });
        assert_eq!(
            validate_commit(&value),
            Err("The queued operation does not match its local draft.".into())
        );
    }
}

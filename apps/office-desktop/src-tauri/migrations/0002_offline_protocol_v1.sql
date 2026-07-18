PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS office_offline_drafts (
  schema_version INTEGER NOT NULL CHECK (schema_version = 1),
  draft_id TEXT PRIMARY KEY NOT NULL,
  aggregate_type TEXT NOT NULL CHECK (aggregate_type IN (
    'contact', 'lead', 'invoice_draft', 'payment_acknowledgement', 'notice_draft'
  )),
  aggregate_id TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('editing', 'local_saved')),
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  local_revision INTEGER NOT NULL CHECK (local_revision >= 0),
  base_server_version INTEGER CHECK (base_server_version IS NULL OR base_server_version >= 0),
  last_saved_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (aggregate_type, aggregate_id)
);

CREATE TABLE IF NOT EXISTS office_sync_operations (
  schema_version INTEGER NOT NULL CHECK (schema_version = 1),
  client_operation_id TEXT PRIMARY KEY NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  draft_id TEXT NOT NULL,
  draft_local_revision INTEGER NOT NULL CHECK (draft_local_revision > 0),
  aggregate_type TEXT NOT NULL CHECK (aggregate_type IN (
    'contact', 'lead', 'invoice_draft', 'payment_acknowledgement', 'notice_draft'
  )),
  aggregate_id TEXT NOT NULL,
  command TEXT NOT NULL CHECK (command IN ('create', 'update', 'submit', 'archive')),
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  expected_server_version INTEGER CHECK (
    expected_server_version IS NULL OR expected_server_version >= 0
  ),
  state TEXT NOT NULL CHECK (state IN (
    'queued', 'syncing', 'synced', 'retry_wait', 'conflict', 'permission_blocked'
  )),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 100),
  next_attempt_at TEXT,
  lease_owner TEXT,
  lease_expires_at TEXT,
  last_failure_json TEXT CHECK (
    last_failure_json IS NULL OR json_valid(last_failure_json)
  ),
  synced_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (draft_id) REFERENCES office_offline_drafts(draft_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS office_form_autosaves (
  record_kind TEXT PRIMARY KEY NOT NULL CHECK (record_kind IN (
    'lead', 'invoice_draft', 'payment_acknowledgement', 'notice_draft'
  )),
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS office_sync_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_operation_id TEXT,
  event_type TEXT NOT NULL,
  detail_json TEXT CHECK (detail_json IS NULL OR json_valid(detail_json)),
  created_at TEXT NOT NULL,
  FOREIGN KEY (client_operation_id)
    REFERENCES office_sync_operations(client_operation_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS office_offline_drafts_kind_updated_idx
  ON office_offline_drafts(aggregate_type, updated_at DESC);

CREATE INDEX IF NOT EXISTS office_sync_operations_claim_idx
  ON office_sync_operations(state, next_attempt_at, lease_expires_at, created_at);

CREATE INDEX IF NOT EXISTS office_sync_operations_aggregate_idx
  ON office_sync_operations(aggregate_type, aggregate_id, created_at DESC);

CREATE INDEX IF NOT EXISTS office_sync_events_operation_idx
  ON office_sync_events(client_operation_id, created_at DESC);

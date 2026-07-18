CREATE TABLE IF NOT EXISTS office_sync_receipts (
  client_operation_id TEXT PRIMARY KEY NOT NULL,
  idempotency_key TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  result_status TEXT NOT NULL CHECK (result_status IN (
    'accepted', 'duplicate', 'conflict', 'permission_blocked', 'rejected'
  )),
  server_record_id TEXT,
  server_version INTEGER CHECK (server_version IS NULL OR server_version >= 0),
  error_json TEXT CHECK (error_json IS NULL OR json_valid(error_json)),
  server_time TEXT NOT NULL,
  received_at TEXT NOT NULL,
  FOREIGN KEY (client_operation_id)
    REFERENCES office_sync_operations(client_operation_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS office_sync_receipts_status_time_idx
  ON office_sync_receipts(result_status, received_at DESC);

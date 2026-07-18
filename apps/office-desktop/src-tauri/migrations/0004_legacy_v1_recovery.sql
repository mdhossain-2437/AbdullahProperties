PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS office_legacy_v1_drafts (
  legacy_draft_id TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL,
  legacy_status TEXT NOT NULL,
  local_revision INTEGER NOT NULL,
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  recovery_state TEXT NOT NULL DEFAULT 'requires_review'
    CHECK (recovery_state IN ('requires_review', 'recovered', 'dismissed')),
  recovered_at TEXT
);

CREATE TABLE IF NOT EXISTS office_legacy_v1_outbox (
  legacy_operation_id TEXT PRIMARY KEY NOT NULL,
  legacy_draft_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  command_type TEXT NOT NULL,
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  legacy_state TEXT NOT NULL,
  attempt_count INTEGER NOT NULL,
  next_attempt_at TEXT,
  last_error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (legacy_draft_id)
    REFERENCES office_legacy_v1_drafts(legacy_draft_id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO office_legacy_v1_drafts
  (legacy_draft_id, entity_type, legacy_status, local_revision, payload_json,
   created_at, updated_at, recovery_state, recovered_at)
SELECT id, entity_type, status, local_revision, payload_json,
       created_at, updated_at, 'requires_review', NULL
FROM local_drafts;

INSERT OR IGNORE INTO office_legacy_v1_outbox
  (legacy_operation_id, legacy_draft_id, idempotency_key, command_type, payload_json,
   legacy_state, attempt_count, next_attempt_at, last_error_code, created_at, updated_at)
SELECT id, draft_id, idempotency_key, command_type, payload_json,
       state, attempt_count, next_attempt_at, last_error_code, created_at, updated_at
FROM sync_outbox
WHERE EXISTS (
  SELECT 1 FROM office_legacy_v1_drafts legacy
  WHERE legacy.legacy_draft_id = sync_outbox.draft_id
);

CREATE INDEX IF NOT EXISTS office_legacy_v1_drafts_recovery_idx
  ON office_legacy_v1_drafts(recovery_state, updated_at DESC);

CREATE INDEX IF NOT EXISTS office_legacy_v1_outbox_draft_idx
  ON office_legacy_v1_outbox(legacy_draft_id, created_at DESC);

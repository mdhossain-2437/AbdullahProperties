PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS local_drafts (
  id TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'invoice', 'payment', 'notice')),
  status TEXT NOT NULL CHECK (status IN ('local_draft', 'queued', 'syncing', 'synced', 'conflict', 'failed')),
  local_revision INTEGER NOT NULL DEFAULT 1 CHECK (local_revision > 0),
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_outbox (
  id TEXT PRIMARY KEY NOT NULL,
  draft_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  command_type TEXT NOT NULL,
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  state TEXT NOT NULL CHECK (state IN ('pending', 'in_flight', 'acknowledged', 'dead_letter')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at TEXT,
  lease_until TEXT,
  last_error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (draft_id) REFERENCES local_drafts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sync_conflicts (
  id TEXT PRIMARY KEY NOT NULL,
  draft_id TEXT NOT NULL,
  local_revision INTEGER NOT NULL,
  server_revision INTEGER,
  local_payload_json TEXT NOT NULL CHECK (json_valid(local_payload_json)),
  server_payload_json TEXT CHECK (server_payload_json IS NULL OR json_valid(server_payload_json)),
  resolution TEXT NOT NULL DEFAULT 'unresolved' CHECK (resolution IN ('unresolved', 'keep_local', 'accept_server', 'merged')),
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY (draft_id) REFERENCES local_drafts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS local_drafts_status_updated_idx
  ON local_drafts(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS sync_outbox_claim_idx
  ON sync_outbox(state, next_attempt_at, lease_until, created_at);

CREATE INDEX IF NOT EXISTS sync_conflicts_draft_resolution_idx
  ON sync_conflicts(draft_id, resolution, created_at DESC);

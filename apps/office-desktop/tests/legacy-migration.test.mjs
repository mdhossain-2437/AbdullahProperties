import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

async function migration(name) {
  return readFile(new URL(`../src-tauri/migrations/${name}`, import.meta.url), "utf8");
}

test("a populated v1 database remains visible in the explicit recovery queue", async () => {
  const database = new DatabaseSync(":memory:");
  try {
    database.exec(await migration("0001_offline_office_core.sql"));
    database.prepare(
      `INSERT INTO local_drafts
        (id, entity_type, status, local_revision, payload_json, created_at, updated_at)
       VALUES (?, 'invoice', 'queued', 3, ?, ?, ?)`,
    ).run(
      "11111111-1111-4111-8111-111111111111",
      JSON.stringify({ customerName: "Preserved customer", amount: "125000" }),
      "2026-07-01T10:00:00.000Z",
      "2026-07-02T10:00:00.000Z",
    );
    database.prepare(
      `INSERT INTO sync_outbox
        (id, draft_id, idempotency_key, command_type, payload_json, state,
         attempt_count, next_attempt_at, lease_until, last_error_code, created_at, updated_at)
       VALUES (?, ?, ?, 'create', ?, 'pending', 1, NULL, NULL, NULL, ?, ?)`,
    ).run(
      "22222222-2222-4222-8222-222222222222",
      "11111111-1111-4111-8111-111111111111",
      "33333333-3333-4333-8333-333333333333",
      JSON.stringify({ customerName: "Preserved customer", amount: "125000" }),
      "2026-07-01T10:00:00.000Z",
      "2026-07-02T10:00:00.000Z",
    );

    database.exec(await migration("0002_offline_protocol_v1.sql"));
    database.exec(await migration("0003_device_sync_receipts.sql"));
    const recoveryMigration = await migration("0004_legacy_v1_recovery.sql");
    database.exec(recoveryMigration);
    database.exec(recoveryMigration);

    const draft = database.prepare(
      "SELECT legacy_draft_id, entity_type, local_revision, recovery_state, payload_json FROM office_legacy_v1_drafts",
    ).get();
    assert.equal(draft.legacy_draft_id, "11111111-1111-4111-8111-111111111111");
    assert.equal(draft.entity_type, "invoice");
    assert.equal(draft.local_revision, 3);
    assert.equal(draft.recovery_state, "requires_review");
    assert.equal(JSON.parse(draft.payload_json).customerName, "Preserved customer");

    const outboxCount = database.prepare("SELECT COUNT(*) AS count FROM office_legacy_v1_outbox").get();
    assert.equal(outboxCount.count, 1);
  } finally {
    database.close();
  }
});

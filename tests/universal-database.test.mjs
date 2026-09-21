import assert from "node:assert/strict";
import test from "node:test";
import { getD1, getOptionalD1, getDb, isDatabaseAvailable } from "../db/index.ts";

test("Universal database initializes and exposes D1-compatible interface in Node.js", async () => {
  const isAvailable = await isDatabaseAvailable();
  assert.equal(isAvailable, true, "Database must be reported as available");

  const d1 = await getOptionalD1();
  assert.ok(d1, "getOptionalD1() must return a valid database instance");

  const activeD1 = await getD1();
  assert.ok(activeD1, "getD1() must return an active database instance");

  // Verify all 35 schema tables are created by automated migrations
  const tablesResult = await activeD1
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all();

  assert.ok(tablesResult.results.length >= 35, `Expected >= 35 tables, found ${tablesResult.results.length}`);
  const tableNames = new Set(tablesResult.results.map((r) => r.name));

  // Verify core CMS tables
  assert.ok(tableNames.has("audit_events"), "CMS audit_events table must exist");
  assert.ok(tableNames.has("content_entries"), "CMS content_entries table must exist");
  assert.ok(tableNames.has("content_revisions"), "CMS content_revisions table must exist");

  // Verify core Office OS tables
  assert.ok(tableNames.has("office_members"), "Office members table must exist");
  assert.ok(tableNames.has("office_contacts"), "Office contacts table must exist");
  assert.ok(tableNames.has("office_leads"), "Office leads table must exist");
  assert.ok(tableNames.has("office_land_parcels"), "Office land parcels table must exist");
  assert.ok(tableNames.has("office_projects"), "Office projects table must exist");
  assert.ok(tableNames.has("office_invoices"), "Office invoices table must exist");
  assert.ok(tableNames.has("office_payments"), "Office payments table must exist");
  assert.ok(tableNames.has("office_payroll_runs"), "Office payroll runs table must exist");

  // Verify D1 operations: prepare, bind, first, all, run, raw
  const member = await activeD1
    .prepare("SELECT id, email, role, status FROM office_members LIMIT 1")
    .first();

  assert.ok(member, "Initial owner member must be seeded");
  assert.equal(member.role, "owner");
  assert.equal(member.status, "active");

  // Verify raw method returns array of values
  const rawRows = await activeD1
    .prepare("SELECT id, role FROM office_members WHERE id = ?")
    .bind(member.id)
    .raw();

  assert.ok(Array.isArray(rawRows), "raw() must return an array");
  assert.ok(rawRows.length >= 1, "raw() must contain at least 1 row");
  assert.equal(rawRows[0][1], "owner");

  // Verify batch execution in a transaction
  const batchResults = await activeD1.batch([
    activeD1.prepare("SELECT count(*) as total FROM content_entries"),
    activeD1.prepare("SELECT count(*) as total FROM office_members"),
  ]);

  assert.equal(batchResults.length, 2, "batch() must return results for each statement");
  assert.equal(batchResults[0].success, true);
  assert.equal(batchResults[1].success, true);

  // Verify Drizzle ORM instance
  const db = await getDb();
  assert.ok(db, "getDb() must return a functional Drizzle instance");
});

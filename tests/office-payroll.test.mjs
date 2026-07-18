import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { hasOfficePermission } from "../features/office/permissions.ts";
import {
  calculatePayroll,
  officePayrollRunInputSchema,
  validatePayrollMakerChecker,
  validatePayrollRunTransition,
} from "../features/office/payroll/types.ts";

function component(overrides = {}) {
  return {
    name: "Configured component",
    kind: "allowance",
    calculationType: "fixed_minor",
    value: 0,
    status: "active",
    ...overrides,
  };
}

test("calculates fixed and base-percentage components with minor-unit half-up rounding", () => {
  const calculation = calculatePayroll({
    baseSalaryMinor: 3_000_001,
    components: [
      component({ name: "Transport", value: 200_000 }),
      component({
        name: "Performance",
        calculationType: "basis_points_of_base",
        value: 750,
      }),
      component({ name: "Advance recovery", kind: "deduction", value: 125_000 }),
      component({ name: "Inactive legacy value", value: 999_999, status: "inactive" }),
    ],
  });

  assert.deepEqual(
    {
      base: calculation.baseSalaryMinor,
      allowance: calculation.allowanceMinor,
      deduction: calculation.deductionMinor,
      gross: calculation.grossMinor,
      net: calculation.netMinor,
      componentCount: calculation.components.length,
    },
    {
      base: 3_000_001,
      allowance: 425_000,
      deduction: 125_000,
      gross: 3_425_001,
      net: 3_300_001,
      componentCount: 3,
    },
  );
});

test("rejects deductions above gross pay and unsafe payroll totals", () => {
  assert.throws(
    () => calculatePayroll({
      baseSalaryMinor: 100,
      components: [component({ name: "Invalid deduction", kind: "deduction", value: 101 })],
    }),
    /cannot exceed gross contractual pay/,
  );
  assert.throws(
    () => calculatePayroll({
      baseSalaryMinor: Number.MAX_SAFE_INTEGER,
      components: [component({ name: "Overflow", value: 1 })],
    }),
    /safe integer range/,
  );
  assert.throws(
    () => calculatePayroll({
      baseSalaryMinor: 100,
      components: [component({ calculationType: "basis_points_of_base", value: 10_001 })],
    }),
    /cannot exceed 100%/,
  );
});

test("accepts only real, complete calendar-month payroll periods", () => {
  assert.equal(officePayrollRunInputSchema.safeParse({
    periodStart: "2026-07-01",
    periodEnd: "2026-07-31",
    currency: "bdt",
    note: null,
  }).success, true);
  assert.equal(officePayrollRunInputSchema.safeParse({
    periodStart: "2026-07-15",
    periodEnd: "2026-07-31",
    currency: "BDT",
    note: null,
  }).success, false);
  assert.equal(officePayrollRunInputSchema.safeParse({
    periodStart: "2026-02-01",
    periodEnd: "2026-02-31",
    currency: "BDT",
    note: null,
  }).success, false);
});

test("enforces payroll state transitions and maker-checker separation", () => {
  assert.equal(validatePayrollRunTransition("draft", "pending_approval"), null);
  assert.match(validatePayrollRunTransition("draft", "posted") ?? "", /cannot move/);
  assert.equal(validatePayrollRunTransition("pending_approval", "approved"), null);
  assert.equal(validatePayrollRunTransition("approved", "posted"), null);
  assert.match(validatePayrollRunTransition("posted", "cancelled") ?? "", /cannot move/);
  assert.match(validatePayrollMakerChecker("member-1", "member-1") ?? "", /cannot approve/);
  assert.equal(validatePayrollMakerChecker("member-1", "member-2"), null);
});

test("keeps sensitive payroll permissions least-privilege", () => {
  assert.equal(hasOfficePermission("owner", "payroll.post"), true);
  assert.equal(hasOfficePermission("admin", "payroll.post"), true);
  assert.equal(hasOfficePermission("manager", "payroll.approve"), true);
  assert.equal(hasOfficePermission("manager", "payroll.write"), false);
  assert.equal(hasOfficePermission("accounts", "payroll.write"), true);
  assert.equal(hasOfficePermission("accounts", "payroll.approve"), false);
  assert.equal(hasOfficePermission("projects", "payroll.read"), false);
  assert.equal(hasOfficePermission("viewer", "payroll.read"), false);
});

test("applies the additive payroll migration with referential and financial checks", async () => {
  const [baseline, office, payroll] = await Promise.all([
    readFile(new URL("../drizzle/0000_many_living_tribunal.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0001_glamorous_kid_colt.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0005_payroll_control_plane.sql", import.meta.url), "utf8"),
  ]);
  const database = new DatabaseSync(":memory:");
  try {
    database.exec("PRAGMA foreign_keys = ON;");
    database.exec(baseline);
    database.exec(office);
    database.exec(payroll);
    const tables = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name);
    for (const table of [
      "office_employees",
      "office_compensation_profiles",
      "office_compensation_components",
      "office_payroll_runs",
      "office_payroll_entries",
    ]) assert.equal(tables.includes(table), true, `${table} should exist`);

    database.prepare(
      `INSERT INTO office_members
        (id, email, normalized_email, display_name, role, status, invited_by_member_id,
         last_seen_at, version, created_at, updated_at, archived_at)
       VALUES (?, ?, ?, ?, 'accounts', 'active', NULL, NULL, 1, ?, ?, NULL)`,
    ).run("11111111-1111-4111-8111-111111111111", "accounts@example.com", "accounts@example.com", "Accounts", "2026-07-17T00:00:00.000Z", "2026-07-17T00:00:00.000Z");
    database.prepare(
      `INSERT INTO office_employees
        (id, employee_code, member_id, display_name, designation, department, employment_type,
         status, join_date, separation_date, created_by_member_id, version, created_at, updated_at)
       VALUES (?, 'AP-001', NULL, 'Employee', 'Consultant', 'Sales', 'permanent', 'active',
         '2026-07-01', NULL, ?, 1, ?, ?)`,
    ).run("22222222-2222-4222-8222-222222222222", "11111111-1111-4111-8111-111111111111", "2026-07-17T00:00:00.000Z", "2026-07-17T00:00:00.000Z");
    database.prepare(
      `INSERT INTO office_compensation_profiles
        (id, employee_id, status, effective_from, base_salary_minor, currency, pay_frequency,
         created_by_member_id, version, created_at, updated_at)
       VALUES (?, ?, 'active', '2026-07-01', 3000000, 'BDT', 'monthly', ?, 1, ?, ?)`,
    ).run("33333333-3333-4333-8333-333333333333", "22222222-2222-4222-8222-222222222222", "11111111-1111-4111-8111-111111111111", "2026-07-17T00:00:00.000Z", "2026-07-17T00:00:00.000Z");

    assert.throws(() => database.prepare(
      `INSERT INTO office_compensation_profiles
        (id, employee_id, status, effective_from, base_salary_minor, currency, pay_frequency,
         created_by_member_id, version, created_at, updated_at)
       VALUES (?, ?, 'active', '2026-08-01', 3200000, 'BDT', 'monthly', ?, 1, ?, ?)`,
    ).run("44444444-4444-4444-8444-444444444444", "22222222-2222-4222-8222-222222222222", "11111111-1111-4111-8111-111111111111", "2026-07-17T00:00:00.000Z", "2026-07-17T00:00:00.000Z"), /UNIQUE constraint/);
    assert.throws(() => database.prepare(
      `INSERT INTO office_compensation_components
        (id, profile_id, name, kind, calculation_type, value, status, version, created_at, updated_at)
       VALUES (?, ?, 'Invalid rate', 'deduction', 'basis_points_of_base', 10001, 'active', 1, ?, ?)`,
    ).run("55555555-5555-4555-8555-555555555555", "33333333-3333-4333-8333-333333333333", "2026-07-17T00:00:00.000Z", "2026-07-17T00:00:00.000Z"), /CHECK constraint/);
    assert.equal(database.prepare("PRAGMA foreign_key_check").all().length, 0);
  } finally {
    database.close();
  }
});

test("wires payroll actions to server permissions, audit, and explicit UI states", async () => {
  const [repository, actions, page, loading, error] = await Promise.all([
    readFile(new URL("../features/office/payroll/repository.ts", import.meta.url), "utf8"),
    readFile(new URL("../features/office/payroll/actions.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/(office)/office/payroll/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/(office)/office/payroll/loading.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/(office)/office/payroll/error.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(repository, /prepareOfficeAuditInsert/);
  assert.match(repository, /payroll\.employee_created/);
  assert.match(repository, /payroll\.run_created/);
  assert.match(repository, /status = \?[^]*version = \?/);
  assert.match(actions, /authorize\("payroll\.write"\)/);
  assert.match(actions, /"payroll\.approve"/);
  assert.match(actions, /"payroll\.post"/);
  assert.match(page, /Statutory rules are configuration, not assumptions/);
  assert.match(page, /OfficeEmptyState/);
  assert.match(loading, /aria-busy="true"/);
  assert.match(error, /role="alert"/);
});

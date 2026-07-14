import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import {
  hasOfficePermission,
  officePermissionValues,
  officePermissions,
} from "../features/office/permissions.ts";
import {
  addMinorUnits,
  calculateInvoiceTotals,
  formatMinorUnits,
  parseMoneyToMinorUnits,
  parseOfficeInvoiceDraft,
  validateExpenseApproval,
  validateInvoiceRecordMutation,
  validateOfficeInvoiceTransition,
  validateOfficeLeadTransition,
  validatePaymentAllocation,
} from "../features/office/types.ts";

const contactId = "11111111-1111-4111-8111-111111111111";

function invoiceDraft(overrides = {}) {
  return {
    contactId,
    projectId: null,
    issueDate: "2026-07-14",
    dueDate: "2026-07-28",
    currency: "BDT",
    customer: {
      name: "Example Customer",
      address: "Joypurhat Sadar, Joypurhat",
    },
    company: {
      name: "Abdullah Properties",
      address: "Joypurhat Sadar, Joypurhat",
    },
    terms: "Payment is due within fourteen days.",
    notes: null,
    items: [
      {
        description: "Design and consultation",
        quantityMillis: 2_500,
        unitPriceMinor: 10_000,
        discountMinor: 1_000,
        taxRateBps: 750,
      },
      {
        description: "Site visit",
        quantityMillis: 1_000,
        unitPriceMinor: 5_000,
        discountMinor: 0,
        taxRateBps: 0,
      },
    ],
    ...overrides,
  };
}

test("exposes a complete, role-keyed permission matrix", () => {
  assert.deepEqual(officePermissions.owner, officePermissionValues);
  assert.deepEqual(officePermissions.admin, officePermissionValues);
  assert.equal(hasOfficePermission("manager", "expenses.approve"), true);
  assert.equal(hasOfficePermission("sales", "finance.post"), false);
  assert.equal(hasOfficePermission("sales", "payments.post"), false);
  assert.equal(hasOfficePermission("accounts", "finance.write"), true);
  assert.equal(hasOfficePermission("accounts", "finance.post"), false);
  assert.equal(hasOfficePermission("viewer", "documents.read"), true);
  assert.equal(hasOfficePermission("viewer", "documents.write"), false);
});

test("strictly parses invoice input and rejects client-owned totals", () => {
  const parsed = parseOfficeInvoiceDraft(invoiceDraft());
  assert.equal(parsed.success, true);

  const withForgedTotal = parseOfficeInvoiceDraft({
    ...invoiceDraft(),
    totalMinor: 1,
  });
  assert.equal(withForgedTotal.success, false);

  const badDates = parseOfficeInvoiceDraft(
    invoiceDraft({ issueDate: "2026-07-14", dueDate: "2026-07-13" }),
  );
  assert.equal(badDates.success, false);

  const negativeMoney = parseOfficeInvoiceDraft(
    invoiceDraft({
      items: [{ description: "Invalid item", quantityMillis: 1_000, unitPriceMinor: -1 }],
    }),
  );
  assert.equal(negativeMoney.success, false);
});

test("parses and formats money without floating-point input", () => {
  assert.equal(parseMoneyToMinorUnits("0"), 0);
  assert.equal(parseMoneyToMinorUnits("12.3"), 1_230);
  assert.equal(parseMoneyToMinorUnits("999.99"), 99_999);
  assert.equal(formatMinorUnits(99_999), "999.99");
  assert.equal(addMinorUnits([1, 2, 3]), 6);
  assert.throws(() => parseMoneyToMinorUnits("1.005"), /no more than two/);
  assert.throws(() => parseMoneyToMinorUnits("1,000.00"), /non-negative decimal/);
  assert.throws(() => parseMoneyToMinorUnits("-1.00"), /non-negative decimal/);
});

test("recomputes line and invoice totals on the server with half-up rounding", () => {
  const calculated = calculateInvoiceTotals(invoiceDraft());
  assert.deepEqual(
    {
      subtotalMinor: calculated.subtotalMinor,
      discountMinor: calculated.discountMinor,
      taxMinor: calculated.taxMinor,
      totalMinor: calculated.totalMinor,
    },
    {
      subtotalMinor: 30_000,
      discountMinor: 1_000,
      taxMinor: 1_800,
      totalMinor: 30_800,
    },
  );
  assert.equal(calculated.lines[0].totalMinor, 25_800);

  const rounded = calculateInvoiceTotals(
    invoiceDraft({
      items: [{ description: "Half-paisa boundary", quantityMillis: 500, unitPriceMinor: 1 }],
    }),
  );
  assert.equal(rounded.totalMinor, 1);
  assert.throws(
    () =>
      calculateInvoiceTotals(
        invoiceDraft({
          items: [
            {
              description: "Invalid discount",
              quantityMillis: 1_000,
              unitPriceMinor: 100,
              discountMinor: 101,
            },
          ],
        }),
      ),
    /discount cannot exceed/,
  );
});

test("enforces lead, invoice, posting, and expense workflow invariants", () => {
  assert.equal(validateOfficeLeadTransition("new", "qualified"), null);
  assert.match(validateOfficeLeadTransition("new", "won")?.message ?? "", /cannot move directly/);
  assert.equal(validateOfficeInvoiceTransition("draft", "pending_approval"), null);
  assert.match(
    validateOfficeInvoiceTransition("draft", "issued")?.message ?? "",
    /cannot move directly/,
  );
  assert.equal(validateInvoiceRecordMutation("draft", "edit"), null);
  assert.match(
    validateInvoiceRecordMutation("issued", "edit")?.message ?? "",
    /approved adjustment workflow/,
  );
  assert.match(validateExpenseApproval("member-1", "member-1")?.message ?? "", /cannot approve/);
  assert.equal(validateExpenseApproval("member-1", "member-2"), null);
});

test("prevents over-allocation and cross-currency allocation", () => {
  const base = {
    amountMinor: 5_000,
    invoiceOutstandingMinor: 10_000,
    paymentAvailableMinor: 8_000,
    invoiceCurrency: "BDT",
    paymentCurrency: "BDT",
  };
  assert.equal(validatePaymentAllocation(base), null);
  assert.equal(
    validatePaymentAllocation({ ...base, amountMinor: 10_001 })?.code,
    "allocation_exceeds_invoice",
  );
  assert.equal(
    validatePaymentAllocation({ ...base, amountMinor: 8_001, invoiceOutstandingMinor: 20_000 })?.code,
    "allocation_exceeds_payment",
  );
  assert.equal(
    validatePaymentAllocation({ ...base, paymentCurrency: "USD" })?.code,
    "currency_mismatch",
  );
});

test("applies the additive office migration without changing the CMS baseline", async () => {
  const [baseline, officeMigration] = await Promise.all([
    readFile(new URL("../drizzle/0000_many_living_tribunal.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0001_glamorous_kid_colt.sql", import.meta.url), "utf8"),
  ]);
  const database = new DatabaseSync(":memory:");

  try {
    database.exec("PRAGMA foreign_keys = ON;");
    database.exec(baseline);
    database.exec(officeMigration);

    const tableRows = database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all();
    const tableNames = tableRows.map((row) => row.name);
    assert.equal(tableNames.includes("content_entries"), true);
    assert.equal(tableNames.includes("office_members"), true);
    assert.equal(tableNames.includes("office_invoices"), true);
    assert.equal(tableNames.includes("office_payment_allocations"), true);
    assert.equal(tableNames.includes("office_audit_events"), true);
    assert.equal(database.prepare("PRAGMA foreign_key_check").all().length, 0);
  } finally {
    database.close();
  }
});

test("limits CMS-owner bootstrap fallback to recognized office-store setup failures", async () => {
  const authSource = await readFile(new URL("../features/office/auth.ts", import.meta.url), "utf8");
  assert.match(authSource, /The CMS database is unavailable in this runtime/);
  assert.match(authSource, /no such table:\\s\*office_members/);
  assert.match(authSource, /if \(isOfficeMembershipStoreUnavailable\(error\)\) return null/);
  assert.match(authSource, /throw error/);
});

test("issues draft invoices through one guarded sequence, posting, and audit batch", async () => {
  const repositorySource = await readFile(
    new URL("../features/office/repository.ts", import.meta.url),
    "utf8",
  );
  const start = repositorySource.indexOf("export async function issueOfficeInvoice");
  const end = repositorySource.indexOf("export function formatOfficeDocumentNumber", start);
  assert.ok(start >= 0 && end > start, "issueOfficeInvoice source boundary should exist");
  const issueSource = repositorySource.slice(start, end);

  assert.match(issueSource, /input:\s*IssueOfficeInvoiceInput/);
  assert.match(issueSource, /Only a draft invoice can be issued/);
  assert.match(issueSource, /database\.batch\(\[/);
  assert.match(issueSource, /OFFICE_SEQUENCE_UPSERT_SQL/);
  assert.match(issueSource, /status = 'issued'/);
  assert.match(issueSource, /status = 'draft' AND version = \?/);
  assert.match(issueSource, /number IS NULL AND sequence_value IS NULL/);
  assert.match(issueSource, /office_audit_events/);
  assert.match(issueSource, /json_object\(/);
  assert.match(issueSource, /NOT NULL constraint failed/);
  assert.doesNotMatch(issueSource, /allocateOfficeDocumentSequence\(/);
});

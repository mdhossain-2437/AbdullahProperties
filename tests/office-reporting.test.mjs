import assert from "node:assert/strict";
import test from "node:test";
import { buildOfficeOperationalReport, OFFICE_OPERATIONAL_REPORT_LIMIT } from "../features/office/reporting.ts";

test("builds bounded operational signals without treating drafts as posted money", () => {
  const report = buildOfficeOperationalReport({
    asOf: "2026-07-14T12:00:00.000Z",
    leads: [
      { stage: "proposal", estimatedValueMinor: 100_000 },
      { stage: "won", estimatedValueMinor: 500_000 },
    ],
    landParcels: [
      { stage: "due_diligence", reviewStatus: "needs_information" },
      { stage: "closed", reviewStatus: "reviewed" },
    ],
    projects: [
      { status: "delivery", riskLevel: "critical", progressBps: 4_000 },
      { status: "design", riskLevel: "medium", progressBps: 2_000 },
    ],
    tasks: [
      { status: "open", dueAt: "2026-07-13T12:00:00.000Z" },
      { status: "done", dueAt: "2026-07-12T12:00:00.000Z" },
    ],
    invoices: [
      { status: "issued", balanceMinor: 75_000 },
      { status: "draft", balanceMinor: 25_000 },
      { status: "overdue", balanceMinor: 10_000 },
    ],
    payments: [
      { status: "posted", amountMinor: 20_000 },
      { status: "draft", amountMinor: 90_000 },
    ],
    expenses: [
      { status: "submitted", amountMinor: 8_000 },
      { status: "draft", amountMinor: 3_000 },
    ],
  });

  assert.equal(report.relationships.activeLeads, 1);
  assert.equal(report.relationships.estimatedPipelineMinor, 100_000);
  assert.equal(report.land.needsInformation, 1);
  assert.equal(report.delivery.averageProgressBps, 3_000);
  assert.equal(report.delivery.overdueTasks, 1);
  assert.equal(report.finance.outstandingInvoiceMinor, 85_000);
  assert.equal(report.finance.postedPaymentMinor, 20_000);
  assert.equal(report.finance.submittedExpenseMinor, 8_000);
  assert.equal(report.sample.mayBeTruncated, false);
  assert.equal(OFFICE_OPERATIONAL_REPORT_LIMIT, 200);
});

test("rejects an invalid report as-of timestamp", () => {
  assert.throws(() => buildOfficeOperationalReport({
    asOf: "invalid",
    leads: [], landParcels: [], projects: [], tasks: [], invoices: [], payments: [], expenses: [],
  }), /valid as-of timestamp/);
});

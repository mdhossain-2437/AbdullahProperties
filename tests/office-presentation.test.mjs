import assert from "node:assert/strict";
import test from "node:test";
import {
  formatOfficeDate,
  formatOfficeDateTime,
  formatOfficeMoney,
  formatOfficePercent,
  getOfficeLocalDate,
  addOfficeLocalDays,
  humanizeOfficeValue,
} from "../features/office/presentation.ts";

test("formats office money from safe integer minor units", () => {
  assert.match(formatOfficeMoney(125_050, "BDT"), /1,250\.50/);
  assert.match(formatOfficeMoney(9_999, "USD"), /USD|US\$/);
  assert.throws(() => formatOfficeMoney(1.5), /safe integer/);
});

test("formats dates in the Dhaka operating timezone and handles absent values", () => {
  assert.match(formatOfficeDate("2026-07-14"), /(?:14 Jul|Jul 14),? 2026/);
  assert.match(formatOfficeDateTime("2026-07-14T10:00:00.000Z"), /(?:14 Jul|Jul 14),? 2026/);
  assert.equal(formatOfficeDate(null), "Not scheduled");
  assert.equal(formatOfficeDate("not-a-date"), "Invalid date");
});

test("formats bounded percentages and office vocabulary", () => {
  assert.equal(formatOfficePercent(7_50), "7.5%");
  assert.equal(humanizeOfficeValue("pending_approval"), "Pending Approval");
  assert.throws(() => formatOfficePercent(10_001), /basis points/);
});

test("derives deterministic Dhaka operating dates", () => {
  assert.equal(getOfficeLocalDate(new Date("2026-07-14T20:30:00.000Z")), "2026-07-15");
  assert.equal(addOfficeLocalDays("2026-07-15", 14), "2026-07-29");
  assert.throws(() => addOfficeLocalDays("15-07-2026", 1), /local ISO date/);
});

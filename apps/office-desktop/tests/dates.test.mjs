import assert from "node:assert/strict";
import test from "node:test";
import { addDhakaCalendarDays, getDhakaCalendarDate } from "../src/offline/dates.ts";

test("uses the Dhaka business date around the UTC day boundary", () => {
  assert.equal(getDhakaCalendarDate(new Date("2026-07-16T19:30:00.000Z")), "2026-07-17");
  assert.equal(getDhakaCalendarDate(new Date("2026-07-16T17:59:59.000Z")), "2026-07-16");
});

test("adds whole Dhaka calendar days without UTC midnight drift", () => {
  const instant = new Date("2026-12-31T19:15:00.000Z");
  assert.equal(addDhakaCalendarDays(0, instant), "2027-01-01");
  assert.equal(addDhakaCalendarDays(30, instant), "2027-01-31");
  assert.throws(() => addDhakaCalendarDays(0.5, instant), /whole number/);
});

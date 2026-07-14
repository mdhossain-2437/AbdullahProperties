import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPlannerOutcome,
  formatPlannerSummary,
  plannerSchema,
} from "../features/public-experience/planner.ts";

const validPlan = {
  journey: "landowner",
  propertyUse: "land-development",
  locationContext: "Joypurhat",
  timeline: "exploring",
  budgetReadiness: "under-review",
  priorities: ["documentation", "whole-cost", "timeline"],
  notes: "Prepare the ownership and responsibility questions for a first discussion.",
};

test("planner schema accepts a focused, non-sensitive planning context", () => {
  const result = plannerSchema.safeParse(validPlan);

  assert.equal(result.success, true);
  assert.equal(result.data.locationContext, "Joypurhat");
});

test("planner schema requires two priorities and caps the selection at four", () => {
  const tooFew = plannerSchema.safeParse({ ...validPlan, priorities: ["documentation"] });
  const tooMany = plannerSchema.safeParse({
    ...validPlan,
    priorities: ["location", "documentation", "whole-cost", "timeline", "handover"],
  });

  assert.equal(tooFew.success, false);
  assert.equal(tooMany.success, false);
});

test("planner outcome remains advisory and explicitly records local preparation", () => {
  const values = plannerSchema.parse(validPlan);
  const outcome = buildPlannerOutcome(values);

  assert.match(outcome.title, /Landowner/);
  assert.ok(outcome.actions.length >= 3);
  assert.ok(outcome.actions.length <= 6);
  assert.match(outcome.preparedEnquiry, /has not been transmitted/i);
  assert.match(outcome.preparedEnquiry, /requires direct evidence/i);
  assert.doesNotMatch(outcome.preparedEnquiry, /guarantee|approved project|available now/i);
});

test("summary formatter records an empty optional note without inventing context", () => {
  const values = plannerSchema.parse({ ...validPlan, notes: "" });
  const summary = formatPlannerSummary(values, ["Request the relevant evidence."]);

  assert.match(summary, /No additional context added/);
  assert.match(summary, /Request the relevant evidence/);
});


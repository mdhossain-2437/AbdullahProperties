import { z } from "zod";

export const plannerJourneyValues = ["buyer", "landowner", "project-client"] as const;
export const plannerUseValues = ["home", "commercial", "mixed-use", "land-development", "not-sure"] as const;
export const plannerTimelineValues = ["exploring", "within-six-months", "later", "not-sure"] as const;
export const plannerBudgetValues = ["not-framed", "under-review", "range-ready", "requires-guidance"] as const;
export const plannerPriorityValues = [
  "location",
  "documentation",
  "whole-cost",
  "timeline",
  "design-fit",
  "handover",
] as const;

export const plannerSchema = z.object({
  journey: z.enum(plannerJourneyValues, { error: "Choose the conversation you want to prepare." }),
  propertyUse: z.enum(plannerUseValues, { error: "Choose the closest intended use." }),
  locationContext: z
    .string()
    .trim()
    .min(2, "Add a location, area, or a short location note.")
    .max(120, "Keep the location note under 120 characters."),
  timeline: z.enum(plannerTimelineValues, { error: "Choose the closest decision timeline." }),
  budgetReadiness: z.enum(plannerBudgetValues, { error: "Choose how far the budget conversation has progressed." }),
  priorities: z
    .array(z.enum(plannerPriorityValues))
    .min(2, "Choose at least two priorities.")
    .max(4, "Choose no more than four priorities so the discussion stays focused."),
  notes: z.string().trim().max(600, "Keep additional context under 600 characters."),
});

export type PlannerValues = z.infer<typeof plannerSchema>;

export type PlannerOutcome = {
  title: string;
  summary: string;
  actions: readonly string[];
  preparedEnquiry: string;
};

const labels = {
  journey: {
    buyer: "Buyer decision",
    landowner: "Landowner / joint-venture discussion",
    "project-client": "Project planning discussion",
  },
  propertyUse: {
    home: "Home / residential use",
    commercial: "Commercial use",
    "mixed-use": "Mixed-use",
    "land-development": "Land development",
    "not-sure": "Use still being framed",
  },
  timeline: {
    exploring: "Exploring and gathering evidence",
    "within-six-months": "A decision may be needed within six months",
    later: "The decision is likely later",
    "not-sure": "Timeline not yet defined",
  },
  budgetReadiness: {
    "not-framed": "Budget context not yet framed",
    "under-review": "Budget context is under review",
    "range-ready": "A working range is ready to discuss",
    "requires-guidance": "Guidance is needed to frame the cost conversation",
  },
  priority: {
    location: "Location and daily movement",
    documentation: "Documents and verification",
    "whole-cost": "Whole cost and responsibilities",
    timeline: "Decision and delivery timing",
    "design-fit": "Design and use fit",
    handover: "Handover and after-sales",
  },
} as const;

const journeyActions: Record<PlannerValues["journey"], readonly string[]> = {
  buyer: [
    "Write down the intended users, daily routines, and non-negotiable needs before comparing options.",
    "Request the relevant ownership, approval, specification, availability, and commercial evidence before relying on a claim.",
    "Compare price together with fit-out, shared costs, maintenance, transition work, and operating needs.",
  ],
  landowner: [
    "Organize the available ownership, mutation, tax, boundary, access, and decision-maker information.",
    "Separate verified records from assumptions and identify questions that require qualified professional review.",
    "Record scope, responsibilities, exclusions, commercial assumptions, and decision gates before commitment.",
  ],
  "project-client": [
    "Frame users, outcomes, constraints, budget context, and the quality criteria the project must protect.",
    "Define the evidence, owner, and authorized decision required to close each project phase.",
    "Plan inspections, changes, documents, open-item tracking, and handover as part of the delivery system.",
  ],
};

const priorityActions: Record<PlannerValues["priorities"][number], string> = {
  location: "Observe access and movement at relevant times, including pedestrian, vehicle, parking, service, and emergency routes.",
  documentation: "Create an evidence register showing each document or claim, its source, reviewer, status, and unresolved question.",
  "whole-cost": "List stated cost, exclusions, recurring costs, transition work, and responsibilities before comparing options.",
  timeline: "Identify the actual decision dates, dependencies, approvals, and information needed instead of relying on one target date.",
  "design-fit": "Test layout, privacy, light, ventilation, services, access, adaptability, and maintenance against the intended use.",
  handover: "Define the inspections, records, transferred items, open issues, and follow-up channel needed at handover.",
};

export function formatPlannerSummary(values: PlannerValues, actions: readonly string[]) {
  const priorityLabels = values.priorities.map((priority) => labels.priority[priority]).join(", ");
  const notes = values.notes || "No additional context added.";

  return [
    "Abdullah Properties decision-planning summary",
    "",
    `Conversation: ${labels.journey[values.journey]}`,
    `Intended use: ${labels.propertyUse[values.propertyUse]}`,
    `Location context: ${values.locationContext}`,
    `Decision timeline: ${labels.timeline[values.timeline]}`,
    `Budget readiness: ${labels.budgetReadiness[values.budgetReadiness]}`,
    `Priorities: ${priorityLabels}`,
    `Additional context: ${notes}`,
    "",
    "Questions and actions to review:",
    ...actions.map((action) => `- ${action}`),
    "",
    "This summary was prepared locally in the browser. It has not been transmitted.",
    "Any ownership, approval, specification, price, availability, timing, or performance statement still requires direct evidence and appropriate professional review.",
  ].join("\n");
}

export function buildPlannerOutcome(values: PlannerValues): PlannerOutcome {
  const actions = [...journeyActions[values.journey], ...values.priorities.map((priority) => priorityActions[priority])];
  const uniqueActions = Array.from(new Set(actions)).slice(0, 6);
  const journeyLabel = labels.journey[values.journey];

  return {
    title: `${journeyLabel} prepared for review`,
    summary:
      "Use this as a conversation brief. It organizes your current context and next questions; it does not verify a property or create a commitment.",
    actions: uniqueActions,
    preparedEnquiry: formatPlannerSummary(values, uniqueActions),
  };
}

import { verifiedServiceLines } from "@/lib/company-data";

export const journeyPaths = [
  {
    id: "01",
    label: "For buyers",
    title: "Choose with evidence, not pressure.",
    summary:
      "Move from first search to a useful conversation with a clear viewing, verification, and comparison framework.",
    href: "/buyers",
    action: "Open the buyer journey",
  },
  {
    id: "02",
    label: "For landowners",
    title: "Structure the partnership before the project.",
    summary:
      "Understand the information, responsibilities, written scope, and decision gates a joint-venture discussion needs.",
    href: "/landowners",
    action: "Explore the landowner route",
  },
  {
    id: "03",
    label: "For project decisions",
    title: "See the whole delivery system.",
    summary:
      "Follow the published path from inquiry and site review through verification, delivery updates, inspection, and handover.",
    href: "/process",
    action: "See the working process",
  },
] as const;

export const buyerDecisionSteps = [
  {
    id: "01",
    title: "Frame the need",
    summary: "Define who the property serves, the location priorities, the budget context, and the non-negotiables before comparing options.",
  },
  {
    id: "02",
    title: "Read the place",
    summary: "Review access, daily movement, surrounding uses, services, noise, light, and the way the area may affect long-term use.",
  },
  {
    id: "03",
    title: "Request evidence",
    summary: "Ask for the relevant ownership, approval, specification, availability, and commercial records before relying on a claim.",
  },
  {
    id: "04",
    title: "Compare the whole cost",
    summary: "Consider fit-out, maintenance, shared costs, transition work, and operating needs alongside the stated price.",
  },
  {
    id: "05",
    title: "Confirm in writing",
    summary: "Record the agreed scope, inclusions, exclusions, milestones, responsibilities, and next decision before commitment.",
  },
] as const;

export const landownerReadiness = [
  {
    id: "A",
    title: "Land record",
    summary: "Bring the available title, mutation, tax, boundary, access, and ownership records for professional review.",
  },
  {
    id: "B",
    title: "Ownership alignment",
    summary: "Identify every decision-maker and confirm that co-owners or authorized representatives are part of the discussion.",
  },
  {
    id: "C",
    title: "Project intent",
    summary: "Clarify the preferred use, priorities, time horizon, family or business needs, and the outcomes that matter most.",
  },
  {
    id: "D",
    title: "Written responsibility",
    summary: "Define who verifies, designs, approves, funds, delivers, reports, hands over, and resolves changes before work begins.",
  },
] as const;

export const responsibilityMatrix = [
  { subject: "Property and title evidence", landowner: "Provide available records and authorized access", company: "Coordinate review and identify evidence gaps" },
  { subject: "Project brief", landowner: "Confirm priorities, constraints, and decision-makers", company: "Translate the brief into a reviewable scope" },
  { subject: "Commercial terms", landowner: "Review value, timing, and allocation expectations", company: "Document proposed terms, assumptions, and exclusions" },
  { subject: "Delivery decisions", landowner: "Approve agreed gates and material changes", company: "Coordinate updates, records, and follow-through" },
] as const;

export const documentReadiness = [
  "The intended property or project outcome",
  "Available ownership and land records",
  "Plot, access, or project location context",
  "Budget range and decision timeline",
  "Names of the people who must approve the next step",
] as const;

export const areaGuides = [
  {
    slug: "joypurhat-property-decisions",
    index: "AREA / 01",
    name: "Joypurhat",
    title: "A practical lens for property decisions in Joypurhat",
    dek: "Use, access, evidence, and long-term operating fit matter more than a location name on its own.",
    updatedAt: "2026-07-14",
    facts: [
      { title: "Start with use", body: "Residential, commercial, and mixed-use needs create different access, servicing, privacy, and operating questions." },
      { title: "Observe movement", body: "Visit at relevant times and review pedestrian, vehicle, delivery, parking, and emergency access patterns." },
      { title: "Verify the record", body: "Treat ownership, boundaries, access rights, approvals, and utility assumptions as evidence questions for qualified review." },
    ],
  },
  {
    slug: "dhanmondi-project-context",
    index: "AREA / 02",
    name: "Dhanmondi, Joypurhat",
    title: "Read the context around the published Nirapad Nibas location",
    dek: "The project name and locality are published; current specifications, approvals, construction status, and availability still require direct confirmation.",
    updatedAt: "2026-07-14",
    facts: [
      { title: "What is published", body: "Abdullah Properties identifies Nirapad Nibas in Dhanmondi, Joypurhat." },
      { title: "What to inspect", body: "Review approach routes, adjoining uses, daily movement, service access, and the project information available at the time of enquiry." },
      { title: "What to confirm", body: "Request approved documents for any specification, ownership, approval, price, schedule, or availability statement before relying on it." },
    ],
  },
  {
    slug: "purbo-bazar-office-visit",
    index: "AREA / 03",
    name: "Purbo Bazar, Joypurhat",
    title: "Prepare for a useful office conversation",
    dek: "The Abdullah Properties office is published at the 2nd Floor of Pouro Market, Purbo Bazar, Joypurhat.",
    updatedAt: "2026-07-14",
    facts: [
      { title: "Bring the context", body: "Share the location, property type, intended outcome, known constraints, and the question you need answered first." },
      { title: "Bring available records", body: "For land or joint-venture discussions, bring copies of the records you already have; professional verification may still be required." },
      { title: "Confirm the meeting", body: "Use the published phone, email, or WhatsApp channel to confirm timing and the people or documents needed for the discussion." },
    ],
  },
] as const;

export const serviceDetails = verifiedServiceLines.map((service, index) => ({
  ...service,
  slug: [
    "residential-development",
    "joint-venture-housing",
    "land-documentation-support",
    "project-consultation",
    "design-project-planning",
    "handover-after-sales",
  ][index]!,
  decisions: [
    "What outcome and users should the work support?",
    "Which information must be verified before scope is confirmed?",
    "Who owns each decision, record, approval, and follow-up?",
  ],
}));

export type AreaGuide = (typeof areaGuides)[number];

export function getAreaGuide(slug: string) {
  return areaGuides.find((guide) => guide.slug === slug);
}

export function getServiceDetail(slug: string) {
  return serviceDetails.find((service) => service.slug === slug);
}

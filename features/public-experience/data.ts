import type {
  ChecklistResource,
  ProcessPhase,
  SolutionPath,
  TrustPrinciple,
} from "@/features/public-experience/types";

export const solutionRailWords = [
  "Buy with evidence",
  "Structure the land conversation",
  "Plan before commitment",
  "Inspect before handover",
] as const;

export const jointVentureRailWords = [
  "Land record",
  "Shared intent",
  "Written responsibility",
  "Visible decision gates",
] as const;

export const qualityRailWords = [
  "Brief",
  "Evidence",
  "Review",
  "Record",
  "Inspect",
  "Handover",
] as const;

export const clientCareRailWords = [
  "Prepare",
  "Walk through",
  "Record",
  "Route",
  "Follow up",
] as const;

export const resourceRailWords = [
  "Ask better questions",
  "Bring useful records",
  "Compare the whole decision",
] as const;

export const solutionPaths = [
  {
    id: "01",
    audience: "For buyers",
    title: "Build a decision before choosing a property.",
    summary:
      "Frame the need, read the location, request relevant evidence, and compare the whole cost before relying on a sales statement.",
    href: "/buyers",
    action: "Open the buyer journey",
    questions: [
      "Who will use the property and what must daily life support?",
      "Which ownership, approval, specification, and availability records need review?",
      "What costs or responsibilities sit outside the stated price?",
    ],
  },
  {
    id: "02",
    audience: "For landowners",
    title: "Make the partnership reviewable before development begins.",
    summary:
      "Bring the available land context, align decision-makers, and document scope, responsibility, assumptions, and commercial direction.",
    href: "/joint-venture",
    action: "Review the joint-venture path",
    questions: [
      "Which ownership, mutation, tax, boundary, and access records are available?",
      "Who must review and approve each decision?",
      "What must be verified before a proposal can become an agreement?",
    ],
  },
  {
    id: "03",
    audience: "For project clients",
    title: "Connect the brief, decisions, delivery records, and handover.",
    summary:
      "Use visible gates to keep scope, responsibility, changes, evidence, and the next decision connected through the project.",
    href: "/process",
    action: "See the working process",
    questions: [
      "What outcome, users, constraints, and exclusions shape the brief?",
      "Which evidence closes each project phase?",
      "How will changes, inspections, open items, and handover records be tracked?",
    ],
  },
  {
    id: "04",
    audience: "For handover and after-sales",
    title: "Prepare the transition to use, not only the key exchange.",
    summary:
      "Organize inspection notes, documents, open items, issue routing, and the agreed follow-up channel in one handover view.",
    href: "/client-care",
    action: "Explore client care",
    questions: [
      "Which documents, demonstrations, and access items should be handed over?",
      "Which observations remain open, who owns them, and how are updates recorded?",
      "Which channel should be used for a new after-sales question?",
    ],
  },
] as const satisfies readonly SolutionPath[];

export const jointVenturePhases = [
  {
    id: "01",
    eyebrow: "Opportunity frame",
    title: "Start with the land, the people, and the intended outcome.",
    summary:
      "Define the known property context, preferred use, priorities, constraints, time horizon, and every person who must participate in a decision.",
    evidence: "Available location context, plot information, ownership records, and a written statement of intent.",
    responsibility: "The landowner provides available records and authorized access; the review identifies evidence gaps and questions.",
    decisionGate: "Agree what is known, what is not yet verified, and whether a structured review should continue.",
    nextStep: "Prepare the relevant records for qualified review.",
  },
  {
    id: "02",
    eyebrow: "Evidence review",
    title: "Separate available records from assumptions.",
    summary:
      "Organize the ownership, boundary, access, tax, mutation, utility, and local-control questions that may affect feasibility or responsibility.",
    evidence: "A record register showing the source, status, reviewer, and unresolved question for each item.",
    responsibility: "Qualified professionals verify matters within their discipline; the project conversation records status without replacing that advice.",
    decisionGate: "Confirm whether material evidence gaps prevent scope or commercial discussion from advancing.",
    nextStep: "Resolve or explicitly carry forward each material evidence gap.",
  },
  {
    id: "03",
    eyebrow: "Scope and responsibility",
    title: "Turn the shared intent into a reviewable project scope.",
    summary:
      "Describe use, planning direction, responsibilities, exclusions, approvals, information ownership, and the decisions required from each party.",
    evidence: "A versioned scope, responsibility matrix, assumptions list, and named decision-makers.",
    responsibility: "Each party reviews the responsibilities and exclusions assigned to them before commercial commitments are recorded.",
    decisionGate: "Approve the scope basis or return it for correction.",
    nextStep: "Use the accepted scope basis to frame commercial terms.",
  },
  {
    id: "04",
    eyebrow: "Commercial direction",
    title: "Record the proposal, assumptions, and change conditions together.",
    summary:
      "Keep value, allocation, timing, dependencies, costs, approvals, and the treatment of change in one reviewable commercial record.",
    evidence: "A dated proposal with assumptions, exclusions, dependencies, review history, and professional advice where required.",
    responsibility: "Decision-makers review the complete proposal and obtain independent advice before commitment where appropriate.",
    decisionGate: "Proceed only through a written agreement executed by authorized parties.",
    nextStep: "Translate the signed basis into delivery and reporting gates.",
  },
  {
    id: "05",
    eyebrow: "Delivery and handover",
    title: "Keep decisions, changes, inspections, and closeout connected.",
    summary:
      "Track agreed milestones, evidence, decisions, material changes, inspection observations, open items, and final records through handover.",
    evidence: "Decision log, change record, progress evidence, inspection notes, handover register, and open-item status.",
    responsibility: "The agreed project roles own updates and approvals; unresolved items remain visible until closed or formally accepted.",
    decisionGate: "Confirm the handover record, open items, document transfer, and follow-up route.",
    nextStep: "Move into the agreed client-care and after-sales process.",
  },
] as const satisfies readonly ProcessPhase[];

export const qualityPhases = [
  {
    id: "01",
    eyebrow: "Brief gate",
    title: "Define what quality must support.",
    summary: "Quality starts with users, purpose, constraints, budget context, maintainability, and the outcomes that must not be traded away silently.",
    evidence: "Approved brief, priorities, constraints, exclusions, and acceptance questions.",
    responsibility: "The client confirms priorities; the project team turns them into reviewable criteria.",
    decisionGate: "The brief is complete enough to guide the next phase without hidden assumptions.",
    nextStep: "Review site and property evidence against the brief.",
  },
  {
    id: "02",
    eyebrow: "Context gate",
    title: "Test the idea against the property context.",
    summary: "Review access, surrounding uses, records, physical constraints, servicing, and the evidence required before design or price assumptions harden.",
    evidence: "Context notes, available records, evidence gaps, and professional review requirements.",
    responsibility: "Relevant specialists own verification within their discipline; the project record exposes unresolved questions.",
    decisionGate: "Material context risks are resolved, scoped, or explicitly accepted.",
    nextStep: "Develop and coordinate the design direction.",
  },
  {
    id: "03",
    eyebrow: "Design gate",
    title: "Review function, coordination, and maintainability together.",
    summary: "Test the design against circulation, privacy, access, light, services, materials, future maintenance, and the accepted brief.",
    evidence: "Reviewable drawings, schedules, coordination comments, decisions, and revision history.",
    responsibility: "Designers coordinate their work; decision-makers approve material departures from the brief.",
    decisionGate: "The coordinated information is suitable for the next agreed delivery step.",
    nextStep: "Establish the delivery evidence and inspection plan.",
  },
  {
    id: "04",
    eyebrow: "Delivery gate",
    title: "Make changes and progress visible.",
    summary: "Connect the agreed scope to progress records, decisions, substitutions, open questions, and the evidence needed for inspection.",
    evidence: "Progress updates, decision log, change record, supporting images, and inspection requests.",
    responsibility: "Assigned project roles record and resolve issues; authorized decision-makers approve material changes.",
    decisionGate: "The recorded work is ready for the relevant inspection or review.",
    nextStep: "Inspect, record observations, and verify closure.",
  },
  {
    id: "05",
    eyebrow: "Inspection gate",
    title: "Record what was observed and what remains open.",
    summary: "Use structured observations, ownership, status, evidence, and acceptance decisions instead of relying on memory or informal messages.",
    evidence: "Dated inspection record, observations, owner, target action, closure evidence, and acceptance status.",
    responsibility: "The responsible party addresses the observation; the authorized reviewer confirms closure or records the remaining condition.",
    decisionGate: "Open items are closed, accepted, or clearly carried into handover.",
    nextStep: "Prepare the complete handover register.",
  },
  {
    id: "06",
    eyebrow: "Handover gate",
    title: "Transfer records, access, and unresolved responsibilities.",
    summary: "Handover should make documents, keys or access items, demonstrations, open items, and the follow-up route understandable to the receiving party.",
    evidence: "Handover register, transferred documents, access items, open-item list, and acknowledged follow-up channel.",
    responsibility: "The project team prepares the register; the receiving party reviews and acknowledges what was transferred and what remains open.",
    decisionGate: "The handover status and after-sales route are recorded without hiding unresolved items.",
    nextStep: "Use the agreed client-care process for follow-up.",
  },
] as const satisfies readonly ProcessPhase[];

export const clientCarePhases = [
  {
    id: "01",
    eyebrow: "Before handover",
    title: "Prepare the transition while the project context is still active.",
    summary: "Collect the relevant documents, access items, demonstrations, inspection notes, open items, and names of the people responsible for follow-up.",
    evidence: "Draft handover register and current open-item record.",
    responsibility: "The project team assembles the record; the client identifies questions or missing items before acknowledgement.",
    decisionGate: "The handover pack is ready for a joint walkthrough.",
    nextStep: "Complete the walkthrough and update the register.",
  },
  {
    id: "02",
    eyebrow: "At handover",
    title: "Walk through the property and the record together.",
    summary: "Review the agreed scope, observations, transferred documents, access, demonstrations, open items, and the channel for future questions.",
    evidence: "Acknowledged handover record with dated observations and transferred items.",
    responsibility: "Both parties review the record; no unresolved item is treated as closed merely because handover occurred.",
    decisionGate: "The current condition, transferred items, and open responsibilities are understood.",
    nextStep: "Route open and new questions through the agreed channel.",
  },
  {
    id: "03",
    eyebrow: "Issue routing",
    title: "Describe the question clearly before assigning it.",
    summary: "Record the location, observed condition, date, supporting image or document, access constraints, and the outcome the client needs clarified.",
    evidence: "A dated issue record with context, attachments, owner, status, and next update.",
    responsibility: "The receiving team triages the question and confirms who owns the next action; specialist matters remain with the relevant professional.",
    decisionGate: "The question has an owner, status, and next update—not an untracked promise.",
    nextStep: "Keep updates on the same issue record until closure or formal handoff.",
  },
  {
    id: "04",
    eyebrow: "Closeout",
    title: "Close with evidence or state what remains unresolved.",
    summary: "Record the action taken, supporting evidence, review result, and any condition or future responsibility that remains after the response.",
    evidence: "Closure note, supporting record, reviewer acknowledgement, or explicit unresolved status.",
    responsibility: "The issue owner provides the update; the authorized reviewer records acceptance or the next required action.",
    decisionGate: "The record accurately reflects closed, accepted, transferred, or unresolved status.",
    nextStep: "Retain the record with the property or project history.",
  },
] as const satisfies readonly ProcessPhase[];

export const trustPrinciples = [
  {
    id: "01",
    title: "Evidence before reliance",
    summary: "Distinguish published context from ownership, approval, price, specification, availability, timing, or performance evidence that still requires confirmation.",
  },
  {
    id: "02",
    title: "Named decision gates",
    summary: "End each phase with a visible question, an authorized decision-maker, and a recorded basis for moving forward or revising the work.",
  },
  {
    id: "03",
    title: "Written responsibility",
    summary: "Keep responsibilities, exclusions, dependencies, and unresolved questions alongside the scope instead of leaving them in informal conversations.",
  },
  {
    id: "04",
    title: "Handover as a record",
    summary: "Connect inspections, transferred documents, access items, open issues, and the follow-up route so the transition remains understandable.",
  },
] as const satisfies readonly TrustPrinciple[];

export const resourceChecklists = [
  {
    id: "R / 01",
    category: "Buyer preparation",
    title: "Property viewing decision sheet",
    summary: "Use one consistent set of observations when comparing properties or project conversations.",
    items: [
      "Intended users, daily routines, and non-negotiable needs",
      "Approach, pedestrian movement, vehicle access, parking, and service access",
      "Surrounding uses, noise, privacy, light, ventilation, and common areas",
      "Published area, layout, specification, availability, and price statements to verify",
      "Ownership, approval, payment, shared-cost, handover, and maintenance questions",
      "Items included, excluded, assumed, or still unknown",
    ],
    note: "A viewing note supports comparison; it does not replace legal, technical, valuation, or financial advice.",
    relatedLink: { href: "/property-planner", label: "Prepare a decision summary" },
  },
  {
    id: "R / 02",
    category: "Landowner preparation",
    title: "First joint-venture conversation pack",
    summary: "Organize the available context before discussing design, allocation, or timing.",
    items: [
      "Intended project outcome and the priorities that matter most",
      "Available title, mutation, tax, boundary, access, and ownership records",
      "Plot, access, utility, surrounding-use, or survey context already available",
      "Names of co-owners, authorized representatives, and required decision-makers",
      "Known constraints, existing commitments, and questions requiring professional review",
      "Preferred communication, document, review, and decision process",
    ],
    note: "Bring copies rather than irreplaceable originals to an initial discussion unless a qualified reviewer requests otherwise.",
    relatedLink: { href: "/joint-venture", label: "Review the joint-venture process" },
  },
  {
    id: "R / 03",
    category: "Project control",
    title: "Decision-gate review",
    summary: "Check whether a project phase is actually ready to close before the next one begins.",
    items: [
      "The current approved scope and its revision date",
      "Evidence completed during the phase and its source",
      "Open assumptions, risks, decisions, and professional reviews",
      "Changes proposed, approved, rejected, or awaiting direction",
      "The authorized decision-maker and recorded approval basis",
      "The next phase owner, inputs, dependencies, and expected decision",
    ],
    note: "A gate can pause or return work for correction. Progress should not depend on hiding unresolved information.",
    relatedLink: { href: "/quality", label: "See the quality gates" },
  },
  {
    id: "R / 04",
    category: "Handover and client care",
    title: "Handover readiness check",
    summary: "Prepare the records and responsibilities needed for a clear transition to use.",
    items: [
      "Dated inspection observations and their current status",
      "Documents, access items, keys, controls, or demonstrations to transfer",
      "Open items with owner, next action, and supporting evidence",
      "Operating, maintenance, or specialist information made available",
      "Acknowledgement of what was transferred and what remains unresolved",
      "The agreed route for new questions after handover",
    ],
    note: "The required handover documents depend on the actual project scope and professional obligations; confirm them for each engagement.",
    relatedLink: { href: "/client-care", label: "Explore client care" },
  },
] as const satisfies readonly ChecklistResource[];


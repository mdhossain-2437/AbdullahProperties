export type DecisionStoryChapter = {
  readonly id: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly summary: string;
  readonly evidenceLabel: string;
  readonly evidence: readonly string[];
  readonly image: string;
  readonly imageAlt: string;
  readonly href: string;
  readonly action: string;
};

export const homeDecisionStory = [
  {
    id: "01",
    eyebrow: "Frame the decision",
    title: "Start with the outcome, not the brochure.",
    summary:
      "Define who the property serves, what the location must support, the budget context, and the uncertainty that matters most before comparing routes.",
    evidenceLabel: "Bring into view",
    evidence: ["Intended use", "Location priorities", "Budget context", "Decision-makers"],
    image: "/projects/client-studio.jpg",
    imageAlt: "Illustrative Abdullah Properties consultation setting",
    href: "/property-planner",
    action: "Prepare the first conversation",
  },
  {
    id: "02",
    eyebrow: "Read the place",
    title: "See the site as a living system.",
    summary:
      "Access, neighbouring uses, daily movement, light, services, and long-term operating fit can matter as much as the property itself.",
    evidenceLabel: "Observe and ask",
    evidence: ["Access and movement", "Surrounding uses", "Service needs", "Open questions"],
    image: "/properties/joypurhat-residence.jpg",
    imageAlt: "Illustrative residential property study for Abdullah Properties",
    href: "/area-guides",
    action: "Explore the local context",
  },
  {
    id: "03",
    eyebrow: "Verify the record",
    title: "Separate what is known from what needs proof.",
    summary:
      "Ownership, boundaries, approvals, specifications, pricing, and availability remain evidence questions until the relevant records and qualified reviews support them.",
    evidenceLabel: "Keep explicit",
    evidence: ["Known facts", "Missing records", "Review owner", "Decision gate"],
    image: "/projects/office-identity.jpg",
    imageAlt: "Illustrative Abdullah Properties office and document review environment",
    href: "/quality",
    action: "Review the quality gates",
  },
  {
    id: "04",
    eyebrow: "Agree the work",
    title: "Put scope, responsibility, and change in writing.",
    summary:
      "A useful agreement makes the deliverables, exclusions, commercial assumptions, approvals, reporting rhythm, and change process reviewable before commitment.",
    evidenceLabel: "Make reviewable",
    evidence: ["Scope and exclusions", "Named responsibility", "Written approvals", "Change history"],
    image: "/projects/housing-base-construction.jpg",
    imageAlt: "Illustrative housing construction and delivery coordination",
    href: "/joint-venture",
    action: "See the partnership pathway",
  },
  {
    id: "05",
    eyebrow: "Deliver and continue",
    title: "Keep the record connected through handover.",
    summary:
      "Milestone updates, inspections, open items, document transfer, key handover, and after-sales follow-through should remain part of one visible history.",
    evidenceLabel: "Carry forward",
    evidence: ["Milestone updates", "Inspection record", "Handover items", "Client-care route"],
    image: "/projects/building-signage.jpg",
    imageAlt: "Illustrative Abdullah Properties project identity and handover study",
    href: "/client-care",
    action: "Understand client care",
  },
] as const satisfies readonly DecisionStoryChapter[];

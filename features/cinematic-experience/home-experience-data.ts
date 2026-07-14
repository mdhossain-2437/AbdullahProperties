export type HomeChapter = {
  readonly id: string;
  readonly label: string;
};

export const homeChapters = [
  { id: "story-start", label: "Discover" },
  { id: "choose-route", label: "Choose" },
  { id: "operating-system", label: "Understand" },
  { id: "decision-process", label: "Prepare" },
  { id: "selected-work", label: "Examine" },
  { id: "visit-office", label: "Connect" },
] as const satisfies readonly HomeChapter[];

export const decisionRoutes = [
  {
    id: "buyer",
    index: "01",
    label: "I am buying",
    title: "Compare the whole decision—not only the property.",
    prompt: "Start with the intended use, location priorities, budget context, and the evidence you need before relying on a claim.",
    questions: [
      "What must this property make easier in daily life?",
      "Which ownership, approval, specification, and availability records need review?",
      "What costs and responsibilities sit beyond the stated price?",
    ],
    outcome: "A focused comparison brief and a clear list of evidence questions for the next conversation.",
    href: "/buyers",
    action: "Open the buyer journey",
  },
  {
    id: "landowner",
    index: "02",
    label: "I own land",
    title: "Make the partnership reviewable before it becomes a project.",
    prompt: "Bring the available land record, ownership context, project intent, and the people who must approve the next step.",
    questions: [
      "Are every owner and authorized decision-maker identified?",
      "Which title, mutation, tax, boundary, and access records are available?",
      "How will scope, value, timing, changes, and handover be recorded?",
    ],
    outcome: "A more accountable joint-venture discussion built around verified context and written responsibilities.",
    href: "/landowners",
    action: "Explore the landowner route",
  },
  {
    id: "delivery",
    index: "03",
    label: "I am planning a project",
    title: "Connect the brief, evidence, delivery, and handover.",
    prompt: "Frame the users, intended outcome, site context, commercial boundaries, and decision owners before the solution takes shape.",
    questions: [
      "What is known, assumed, excluded, and still awaiting evidence?",
      "Who owns each decision, approval, update, and supporting record?",
      "Which gates must be reviewed before the project moves forward?",
    ],
    outcome: "A visible working sequence from inquiry and site review through delivery updates, inspection, and handover.",
    href: "/process",
    action: "See the working process",
  },
] as const;

export const officeConversationSteps = [
  {
    index: "01",
    title: "Choose a direct channel",
    description: "Call, WhatsApp, email, or use the contact page to share the purpose of the conversation without sending unnecessary sensitive records.",
  },
  {
    index: "02",
    title: "Confirm useful context",
    description: "The team clarifies the property, location, intended outcome, known constraints, and who should join the discussion.",
  },
  {
    index: "03",
    title: "Agree the next evidence step",
    description: "Leave the conversation with a named next action—such as a site visit, document review, comparison, or scoped follow-up.",
  },
] as const;

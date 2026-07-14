export type PublicExperienceLink = {
  href: string;
  label: string;
};

export type SolutionPath = {
  id: string;
  audience: string;
  title: string;
  summary: string;
  href: string;
  action: string;
  questions: readonly string[];
};

export type ProcessPhase = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  evidence: string;
  responsibility: string;
  decisionGate: string;
  nextStep: string;
};

export type TrustPrinciple = {
  id: string;
  title: string;
  summary: string;
};

export type ChecklistResource = {
  id: string;
  category: string;
  title: string;
  summary: string;
  items: readonly string[];
  note: string;
  relatedLink?: PublicExperienceLink;
};


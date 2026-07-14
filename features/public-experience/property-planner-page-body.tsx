import { ClosingConversation } from "@/features/public-experience/closing-conversation";
import { solutionRailWords } from "@/features/public-experience/data";
import { KineticWordRail } from "@/features/public-experience/kinetic-word-rail";
import { OperationsTrustSection } from "@/features/public-experience/operations-trust-section";
import { PropertyDecisionPlanner } from "@/features/public-experience/property-decision-planner";

export function PropertyPlannerPageBody() {
  return (
    <>
      <KineticWordRail words={solutionRailWords} label="Property planner decision themes" />
      <PropertyDecisionPlanner />
      <OperationsTrustSection
        title="The planner prepares questions; people verify the decision."
        description="No planner result verifies ownership, approval, suitability, price, availability, feasibility, timing, professional advice, or performance. Use the summary to request the right evidence."
        link={{ href: "/resources", label: "Review the practical checklists" }}
      />
      <ClosingConversation
        title="Review the summary before you contact anyone."
        description="Remove sensitive details, confirm the questions you want answered, and choose a direct channel only when the summary is ready."
        href="/contact"
        label="Open contact options"
      />
    </>
  );
}


import { ClosingConversation } from "@/features/public-experience/closing-conversation";
import { jointVenturePhases, jointVentureRailWords, resourceChecklists } from "@/features/public-experience/data";
import { KineticWordRail } from "@/features/public-experience/kinetic-word-rail";
import { OperationsTrustSection } from "@/features/public-experience/operations-trust-section";
import { ResourceChecklists } from "@/features/public-experience/resource-checklists";
import { StickyProcessStory } from "@/features/public-experience/sticky-process-story";

export function JointVenturePageBody() {
  return (
    <>
      <KineticWordRail words={jointVentureRailWords} label="Joint-venture decision principles" />
      <StickyProcessStory
        eyebrow="Joint-venture pathway"
        title="Structure the land conversation before the project."
        description="A joint-venture discussion becomes useful when available records, evidence gaps, responsibilities, commercial assumptions, and authorized decisions remain visible together."
        phases={jointVenturePhases}
        note="This pathway explains a review process. It is not a feasibility conclusion, valuation, legal opinion, development approval, commercial offer, or guarantee."
      />
      <ResourceChecklists
        resources={[resourceChecklists[1]]}
        eyebrow="Landowner preparation"
        title="Bring the context that makes the first discussion useful."
        description="Organize copies of the information you already have and identify the people and professional reviews still needed."
      />
      <OperationsTrustSection
        title="A partnership needs an inspectable basis."
        description="Keep available evidence, unresolved questions, proposed responsibility, commercial assumptions, and authorized approvals in one decision history."
        link={{ href: "/property-planner", label: "Prepare a landowner summary" }}
      />
      <ClosingConversation
        title="Start with records and questions—not an assumed deal."
        description="Use the planner to prepare a non-sensitive summary, then choose a direct contact channel when you are ready."
        href="/property-planner"
        label="Prepare the first conversation"
      />
    </>
  );
}


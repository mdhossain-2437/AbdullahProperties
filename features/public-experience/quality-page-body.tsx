import { ClosingConversation } from "@/features/public-experience/closing-conversation";
import { qualityPhases, qualityRailWords, resourceChecklists } from "@/features/public-experience/data";
import { KineticWordRail } from "@/features/public-experience/kinetic-word-rail";
import { OperationsTrustSection } from "@/features/public-experience/operations-trust-section";
import { ResourceChecklists } from "@/features/public-experience/resource-checklists";
import { StickyProcessStory } from "@/features/public-experience/sticky-process-story";

export function QualityPageBody() {
  return (
    <>
      <KineticWordRail words={qualityRailWords} label="Quality review gates" />
      <StickyProcessStory
        eyebrow="Quality decision gates"
        title="Quality is a chain of reviewable decisions."
        description="The purpose of each gate is to expose evidence, responsibility, unresolved questions, and the accepted basis for moving to the next phase."
        phases={qualityPhases}
        note="The exact inspections, records, professional roles, and acceptance criteria depend on the actual scope and applicable requirements."
      />
      <OperationsTrustSection
        title="Do not turn an open question into a quality claim."
        description="A transparent record can show what was reviewed, by whom, against which basis, and whether an observation is closed, accepted, transferred, or unresolved."
        link={{ href: "/resources", label: "Open the decision resources" }}
      />
      <ResourceChecklists resources={[resourceChecklists[2]]} />
      <ClosingConversation
        title="Use the same standard from brief to handover."
        description="Bring the current scope, evidence, open questions, and authorized decision into every project gate."
        href="/process"
        label="Review the full process"
      />
    </>
  );
}


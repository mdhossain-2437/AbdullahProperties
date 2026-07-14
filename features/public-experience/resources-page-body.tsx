import { ClosingConversation } from "@/features/public-experience/closing-conversation";
import { resourceChecklists, resourceRailWords } from "@/features/public-experience/data";
import { KineticWordRail } from "@/features/public-experience/kinetic-word-rail";
import { OperationsTrustSection } from "@/features/public-experience/operations-trust-section";
import { ResourceChecklists } from "@/features/public-experience/resource-checklists";

export function ResourcesPageBody() {
  return (
    <>
      <KineticWordRail words={resourceRailWords} label="Property decision resource principles" />
      <ResourceChecklists resources={resourceChecklists} />
      <OperationsTrustSection
        title="A checklist is a prompt—not a professional conclusion."
        description="Use these resources to expose missing questions and prepare a better conversation. Legal, technical, valuation, financial, and regulatory conclusions remain with qualified reviewers."
        link={{ href: "/property-planner", label: "Prepare a local summary" }}
      />
      <ClosingConversation
        title="Turn the checklist into a focused conversation brief."
        description="The planner helps you select the closest context and produce a summary that remains local until you decide what to do next."
        href="/property-planner"
        label="Open the property planner"
      />
    </>
  );
}


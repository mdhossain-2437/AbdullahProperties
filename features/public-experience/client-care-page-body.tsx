import { ClosingConversation } from "@/features/public-experience/closing-conversation";
import { clientCarePhases, clientCareRailWords, resourceChecklists } from "@/features/public-experience/data";
import { KineticWordRail } from "@/features/public-experience/kinetic-word-rail";
import { OperationsTrustSection } from "@/features/public-experience/operations-trust-section";
import { ResourceChecklists } from "@/features/public-experience/resource-checklists";
import { StickyProcessStory } from "@/features/public-experience/sticky-process-story";

export function ClientCarePageBody() {
  return (
    <>
      <KineticWordRail words={clientCareRailWords} label="Client-care record stages" />
      <StickyProcessStory
        eyebrow="Handover and after-sales"
        title="Keep the property history connected after handover."
        description="Prepare the transfer, record observations, route questions to an owner, and close with evidence or an explicit unresolved status."
        phases={clientCarePhases}
        note="Response, remedy, warranty, maintenance, and specialist obligations depend on the actual agreement and issue. This page does not create additional commitments."
      />
      <ResourceChecklists
        resources={[resourceChecklists[3]]}
        eyebrow="Handover preparation"
        title="Make the transition understandable to the receiving client."
        description="Use the checklist to identify the documents, access items, observations, owners, and follow-up route required for the actual project."
      />
      <OperationsTrustSection
        title="An open item should remain visible until its status is clear."
        description="A client-care record should distinguish a new question, assigned action, professional referral, accepted condition, completed response, and unresolved matter."
        link={{ href: "/contact", label: "Open contact options" }}
      />
      <ClosingConversation
        title="Need to prepare an after-sales question?"
        description="Record the location, observed condition, date, supporting context, and outcome you need clarified before choosing a contact channel."
        href="/contact"
        label="Choose a direct contact channel"
      />
    </>
  );
}


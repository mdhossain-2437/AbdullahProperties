import { PageHero } from "@/components/layout/page-hero";
import { ClientCarePageBody } from "@/features/public-experience";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Handover & Property Client Care",
  description: "Prepare property handover, open-item records, issue routing, document transfer, and after-sales follow-up with Abdullah Properties in Joypurhat.",
  path: "/client-care",
  image: "/og/about.jpg",
});

export default function ClientCarePage() {
  return <main><PageHero eyebrow="Handover / Client care" title="The relationship continues after the keys." description="A clear transition connects inspection notes, transferred records, access items, open responsibilities, issue routing, and the next update." index="16" /><ClientCarePageBody /></main>;
}


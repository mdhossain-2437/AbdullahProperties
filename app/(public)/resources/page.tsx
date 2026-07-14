import { PageHero } from "@/components/layout/page-hero";
import { ResourcesPageBody } from "@/features/public-experience";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Property Decision Checklists & Resources",
  description: "Use practical Abdullah Properties checklists for property viewing, landowner conversations, project decision gates, and handover preparation.",
  path: "/resources",
  image: "/og/insights.jpg",
});

export default function ResourcesPage() {
  return <main><PageHero eyebrow="Resources / Practical preparation" title="Bring better questions to the property decision." description="Use consistent checklists to prepare context, compare what matters, expose evidence gaps, and make the next conversation more useful." index="17" /><ResourcesPageBody /></main>;
}


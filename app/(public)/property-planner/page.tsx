import { PageHero } from "@/components/layout/page-hero";
import { PropertyPlannerPageBody } from "@/features/public-experience";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Property Decision Planner",
  description: "Prepare a local, private property conversation summary for buying, land partnerships, or project planning before contacting Abdullah Properties.",
  path: "/property-planner",
  image: "/og/contact.jpg",
});

export default function PropertyPlannerPage() {
  return <main><PageHero eyebrow="Decision planner / Local-only" title="Prepare the questions before the enquiry." description="Organize the intended use, location context, timeline, budget readiness, and priorities. Nothing is transmitted until you choose a contact channel." index="18" /><PropertyPlannerPageBody /></main>;
}


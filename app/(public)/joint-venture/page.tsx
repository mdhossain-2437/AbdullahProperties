import { PageHero } from "@/components/layout/page-hero";
import { JointVenturePageBody } from "@/features/public-experience";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Landowner Joint-Venture Process in Joypurhat",
  description: "Understand the Abdullah Properties landowner and joint-venture pathway across records, due diligence, scope, commercial discussion, written responsibility, and handover.",
  path: "/joint-venture",
  image: "/og/projects.jpg",
});

export default function JointVenturePage() {
  return <main><PageHero eyebrow="Landowners / Joint venture" title="Build the agreement before the building." description="A partnership becomes clearer when available records, evidence gaps, responsibilities, assumptions, and authorized decisions remain visible together." index="14" /><JointVenturePageBody /></main>;
}


import { PageHero } from "@/components/layout/page-hero";
import { QualityPageBody } from "@/features/public-experience";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Property Development Quality Gates",
  description: "See how Abdullah Properties frames quality through brief, evidence, design, delivery, inspection, record keeping, and handover decision gates.",
  path: "/quality",
  image: "/og/services.jpg",
});

export default function QualityPage() {
  return <main><PageHero eyebrow="Quality / Visible gates" title="Quality should leave a decision trail." description="Connect the brief, property context, design, delivery evidence, observations, and handover instead of treating quality as a final inspection slogan." index="15" /><QualityPageBody /></main>;
}


import { PageHero } from "@/components/layout/page-hero";
import { SolutionsPageBody } from "@/features/public-experience";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Property Solutions for Buyers, Landowners & Project Clients",
  description: "Choose a clear Abdullah Properties decision path for buying, land partnerships, project planning, handover, and after-sales support in Joypurhat.",
  path: "/solutions",
  image: "/og/services.jpg",
});

export default function SolutionsPage() {
  return <main><PageHero eyebrow="Solutions / Choose the question" title="One property system. Four useful starting points." description="Enter through the decision that matches your role, then use evidence, responsibility, and visible gates to prepare the next conversation." index="13" /><SolutionsPageBody /></main>;
}


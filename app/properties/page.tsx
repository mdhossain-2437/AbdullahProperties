import type { Metadata } from "next";
import { PageHero } from "@/components/layout/page-hero";
import { PropertyExplorer } from "@/features/properties/property-explorer";
import type { PropertyKind } from "@/features/properties/data";

export const metadata: Metadata = {
  title: "Properties",
  description: "Explore Abdullah Properties visual studies across residential, commercial, mixed-use, and client experience contexts.",
};

const supportedKinds: readonly ("All" | PropertyKind)[] = ["All", "Residential", "Commercial", "Mixed-use", "Experience"];

type PropertiesPageProps = {
  searchParams: Promise<{ q?: string; type?: string }>;
};

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const params = await searchParams;
  const selectedKind = supportedKinds.includes(params.type as (typeof supportedKinds)[number])
    ? (params.type as (typeof supportedKinds)[number])
    : "All";

  return (
    <main>
      <PageHero
        eyebrow="Property discovery"
        index="02"
        title="Find the fit, not just the listing."
        description="Browse branded visual studies by context, place, and property type. These are portfolio concepts; confirm current inventory directly with Abdullah Properties."
      />
      <section className="property-page-section">
        <div className="site-shell">
          <PropertyExplorer initialQuery={params.q ?? ""} initialKind={selectedKind} />
        </div>
      </section>
    </main>
  );
}

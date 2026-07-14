import { PageHero } from "@/components/layout/page-hero";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { PropertyExplorer } from "@/features/properties/property-explorer";
import type { PropertyKind } from "@/features/properties/data";
import { createMetadata } from "@/lib/seo";

const supportedKinds: readonly ("All" | PropertyKind)[] = ["All", "Residential", "Commercial", "Mixed-use", "Experience"];

type PropertiesPageProps = {
  searchParams: Promise<{ q?: string; type?: string }>;
};

export async function generateMetadata({ searchParams }: PropertiesPageProps) {
  const params = await searchParams;
  const hasFilters = Boolean(params.q?.trim() || params.type?.trim());

  return createMetadata({
    title: "Property & Housing Visual Studies in Joypurhat",
    description: "Explore clearly labelled Abdullah Properties residential, commercial, mixed-use, and client-experience visual studies for Joypurhat.",
    path: "/properties",
    image: "/og/properties.jpg",
    noIndex: hasFilters,
  });
}

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const params = await searchParams;
  const initialQuery = (params.q ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, 100);
  const selectedKind = supportedKinds.includes(params.type as (typeof supportedKinds)[number])
    ? (params.type as (typeof supportedKinds)[number])
    : "All";

  return (
    <main>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Properties", path: "/properties" }]} />
      <PageHero
        eyebrow="Property discovery"
        index="02"
        title="Find the fit, not just the listing."
        description="Browse branded visual studies by context, place, and property type. These are portfolio concepts; confirm current inventory directly with Abdullah Properties."
      />
      <section className="property-page-section">
        <div className="site-shell">
          <PropertyExplorer
            key={`${initialQuery}:${selectedKind}`}
            initialQuery={initialQuery}
            initialKind={selectedKind}
          />
        </div>
      </section>
    </main>
  );
}

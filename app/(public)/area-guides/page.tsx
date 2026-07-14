import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { listPublicAreaGuides } from "@/features/cms/public-content";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Joypurhat Property Area Guides",
  description:
    "Explore source-conscious Abdullah Properties guides for Joypurhat property context, the published Nirapad Nibas locality, and a useful Purbo Bazar office visit.",
  path: "/area-guides",
  image: "/og/properties.jpg",
});

export default async function AreaGuidesPage() {
  const areaGuides = await listPublicAreaGuides();
  return (
    <main>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Area guides", path: "/area-guides" }]} />
      <PageHero eyebrow="Local field guide" index="10" title="Read the place before the property." description="Location intelligence begins with intended use, real movement, surrounding context, available evidence, and the questions that still need qualified review." />
      <section className="area-guide-index">
        <div className="site-shell area-guide-index__grid">
          {areaGuides.map((guide) => (
            <article className="area-guide-feature" key={guide.slug}>
              <div className="area-guide-feature__meta"><MapPin aria-hidden="true" /><span>{guide.index}</span><span>Updated {guide.updatedAt}</span></div>
              <h2>{guide.title}</h2>
              <p>{guide.dek}</p>
              <Link href={`/area-guides/${guide.slug}`} aria-label={`Read ${guide.title}`}>Open area guide <ArrowUpRight aria-hidden="true" /></Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

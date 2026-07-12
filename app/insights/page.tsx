import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { createMetadata } from "@/lib/seo";
import { insights } from "@/lib/site-data";

export const metadata = createMetadata({
  title: "Property & Land Insights for Joypurhat",
  description: "Practical Abdullah Properties field notes for land due diligence, development planning, and commercial location decisions in Joypurhat.",
  path: "/insights",
  image: "/og/insights.jpg",
});

export default function InsightsPage() {
  return (
    <main>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Insights", path: "/insights" }]} />
      <PageHero eyebrow="Field notes" index="06" title="Think clearly before the property carries weight." description="Short, practical perspectives for evaluating land, shaping a development journey, and understanding commercial fit." />
      <section className="content-section">
        <div className="site-shell insight-index">
          {insights.map((insight, index) => (
            <article className="insight-index__item" key={insight.slug}>
              <span>0{index + 1}</span>
              <div><p>{insight.category} / {insight.readTime}</p><h2>{insight.title}</h2><p>{insight.dek}</p></div>
              <Link href={`/insights/${insight.slug}`} aria-label={`Read ${insight.title}`}><ArrowUpRight aria-hidden="true" /></Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

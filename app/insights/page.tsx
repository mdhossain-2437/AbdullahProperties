import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { insights } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Insights",
  description: "Practical field notes for land, property development, commercial fit, and clearer real-estate decisions.",
};

export default function InsightsPage() {
  return (
    <main>
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

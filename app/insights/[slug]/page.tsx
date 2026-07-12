import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { company } from "@/lib/company-data";
import { absoluteUrl, createMetadata } from "@/lib/seo";
import { getInsight, insights } from "@/lib/site-data";

type InsightPageProps = { params: Promise<{ slug: string }> };

const insightDateFormatter = new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" });

export function generateStaticParams() {
  return insights.map((insight) => ({ slug: insight.slug }));
}

export async function generateMetadata({ params }: InsightPageProps): Promise<Metadata> {
  const { slug } = await params;
  const insight = getInsight(slug);
  return insight
    ? createMetadata({
        title: insight.title,
        description: insight.dek,
        path: `/insights/${insight.slug}`,
        image: "/og/insights.jpg",
        type: "article",
        publishedTime: insight.publishedAt,
        modifiedTime: insight.updatedAt,
      })
    : createMetadata({ title: "Insight not found", description: "This insight does not exist.", path: `/insights/${slug}`, noIndex: true });
}

export default async function InsightPage({ params }: InsightPageProps) {
  const { slug } = await params;
  const insight = getInsight(slug);
  if (!insight) notFound();

  return (
    <main>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Insights", path: "/insights" }, { name: insight.title, path: `/insights/${insight.slug}` }]} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: insight.title,
        description: insight.dek,
        datePublished: insight.publishedAt,
        dateModified: insight.updatedAt,
        mainEntityOfPage: absoluteUrl(`/insights/${insight.slug}`),
        image: absoluteUrl("/og/insights.jpg"),
        author: { "@type": "Organization", name: company.name, url: absoluteUrl("/") },
        publisher: { "@id": `${absoluteUrl("/")}#organization` },
      }} />
      <header className="article-header"><div className="article-shell"><span className="eyebrow">{insight.category} / {insight.readTime}</span><h1>{insight.title}</h1><p>{insight.dek}</p><p className="article-header__dates">Published <time dateTime={insight.publishedAt}>{insightDateFormatter.format(new Date(insight.publishedAt))}</time> · Updated <time dateTime={insight.updatedAt}>{insightDateFormatter.format(new Date(insight.updatedAt))}</time></p></div></header>
      <article className="article-body"><div className="article-shell">{insight.sections.map((section, index) => <section className="article-section" key={section.heading}><div><span className="page-index">0{index + 1}</span><h2>{section.heading}</h2></div><p>{section.body}</p></section>)}</div></article>
      <section className="detail-cta"><div className="site-shell detail-cta__inner"><div><span className="eyebrow eyebrow--light">Apply the thinking</span><h2>Bring the real property context.</h2></div><Button asChild className="brand-button brand-button--light"><Link href="/contact">Start a conversation <ArrowRight aria-hidden="true" /></Link></Button></div></section>
      <div className="site-shell back-link-wrap"><Link className="back-link" href="/insights"><ArrowLeft aria-hidden="true" /> Back to insights</Link></div>
    </main>
  );
}

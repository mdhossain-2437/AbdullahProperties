import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { areaGuides } from "@/lib/experience-data";
import { getPublicAreaGuide } from "@/features/cms/public-content";
import { absoluteUrl, createMetadata } from "@/lib/seo";

type AreaGuidePageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return areaGuides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: AreaGuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getPublicAreaGuide(slug);
  return guide
    ? createMetadata({ title: guide.seoTitle ?? guide.title, description: guide.seoDescription ?? guide.dek, path: `/area-guides/${guide.slug}`, image: "/og/properties.jpg", type: "article", publishedTime: guide.updatedAt, modifiedTime: guide.updatedAt })
    : createMetadata({ title: "Area guide not found", description: "This area guide does not exist.", path: `/area-guides/${slug}`, noIndex: true });
}

export default async function AreaGuidePage({ params }: AreaGuidePageProps) {
  const { slug } = await params;
  const guide = await getPublicAreaGuide(slug);
  if (!guide) notFound();

  return (
    <main>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Area guides", path: "/area-guides" }, { name: guide.name, path: `/area-guides/${guide.slug}` }]} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guide.title,
          description: guide.dek,
          datePublished: guide.updatedAt,
          dateModified: guide.updatedAt,
          mainEntityOfPage: absoluteUrl(`/area-guides/${guide.slug}`),
          image: absoluteUrl("/og/properties.jpg"),
          author: {
            "@type": "Organization",
            name: "Abdullah Properties",
            url: absoluteUrl("/about"),
          },
          publisher: { "@id": `${absoluteUrl("/")}#organization` },
        }}
      />
      <header className="area-guide-hero">
        <div className="site-shell area-guide-hero__grid">
          <div><span className="eyebrow">{guide.index}</span><h1>{guide.title}</h1></div>
          <div><MapPin aria-hidden="true" /><p>{guide.dek}</p><span>Last reviewed {guide.updatedAt}</span></div>
        </div>
      </header>
      <article className="area-guide-body">
        <div className="site-shell area-guide-body__grid">
          <aside><span className="eyebrow">Evidence boundary</span><p>These guides organize questions and published context. They do not replace site inspection, approved records, or qualified legal, engineering, planning, and financial review.</p></aside>
          <div className="area-guide-body__facts">
            {guide.facts.map((fact, index) => <section key={fact.title}><span>0{index + 1}</span><div><h2>{fact.title}</h2><p>{fact.body}</p></div></section>)}
          </div>
        </div>
      </article>
      <section className="detail-cta"><div className="site-shell detail-cta__inner"><div><span className="eyebrow">Use the local context</span><h2>Connect the guide to a real property.</h2></div><Button asChild className="brand-button brand-button--light"><Link href="/contact">Discuss the location <ArrowRight aria-hidden="true" /></Link></Button></div></section>
      <div className="site-shell back-link-wrap"><Link className="back-link" href="/area-guides"><ArrowLeft aria-hidden="true" /> Back to area guides</Link></div>
    </main>
  );
}

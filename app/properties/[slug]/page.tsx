import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { Button } from "@/components/ui/button";
import { AppImage as Image } from "@/components/ui/app-image";
import { getProperty, properties } from "@/features/properties/data";
import { createMetadata } from "@/lib/seo";

type PropertyDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return properties.map((property) => ({ slug: property.slug }));
}

export async function generateMetadata({ params }: PropertyDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const property = getProperty(slug);
  return property
    ? createMetadata({
        title: `${property.title} — Illustrative Property Study`,
        description: property.summary,
        path: `/properties/${property.slug}`,
        image: "/og/properties.jpg",
        noIndex: true,
      })
    : createMetadata({
        title: "Property study not found",
        description: "This property study does not exist.",
        path: `/properties/${slug}`,
        noIndex: true,
      });
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { slug } = await params;
  const property = getProperty(slug);
  if (!property) notFound();

  return (
    <main>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Properties", path: "/properties" }, { name: property.title, path: `/properties/${property.slug}` }]} />
      <section className="detail-hero">
        <div className="site-shell">
          <div className="detail-hero__media">
            <Image src={property.image} alt={property.imageAlt} fill preload sizes="(max-width: 760px) 100vw, 1280px" />
            <div className="detail-hero__overlay" />
            <div className="detail-hero__content">
              <div>
                <span className="eyebrow eyebrow--light">{property.status}</span>
                <h1>{property.title}</h1>
              </div>
              <p>{property.summary}</p>
            </div>
          </div>
          <div className="detail-facts">
            <div><span>Context</span><strong>{property.location}</strong></div>
            <div><span>Property type</span><strong>{property.kind}</strong></div>
            <div><span>Availability</span><strong>Confirm directly</strong></div>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="site-shell editorial-grid">
          <div className="editorial-copy">
            <span className="eyebrow">Project overview</span>
            <h2>A visual study with a clear operating idea.</h2>
            <p>{property.overview}</p>
          </div>
          <ul className="editorial-list">
            {property.highlights.map((highlight, index) => (
              <li key={highlight}>
                <span>0{index + 1}</span>
                <div><h3>{highlight}</h3><p>Evaluated as part of the complete property experience, not as an isolated feature.</p></div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="content-section content-section--tint">
        <div className="site-shell editorial-grid">
          <div className="editorial-copy">
            <span className="eyebrow">Connected services</span>
            <h2>One brief, fewer gaps between decisions.</h2>
            <p>The exact scope is agreed only after discovery and verification. These disciplines show how the team can structure the journey.</p>
          </div>
          <ul className="service-checklist">
            {property.services.map((service) => <li key={service}><CheckCircle2 aria-hidden="true" /><span>{service}</span></li>)}
          </ul>
        </div>
      </section>

      <section className="detail-cta">
        <div className="site-shell detail-cta__inner">
          <div><span className="eyebrow eyebrow--light">Direct conversation</span><h2>Ask about this property context.</h2></div>
          <Button asChild className="brand-button brand-button--light"><Link href={`/contact?interest=${property.slug}`}>Request details <ArrowRight aria-hidden="true" /></Link></Button>
        </div>
      </section>

      <div className="site-shell back-link-wrap">
        <Link className="back-link" href="/properties"><ArrowLeft aria-hidden="true" /> Back to properties</Link>
      </div>
    </main>
  );
}

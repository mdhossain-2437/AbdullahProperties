import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, FileCheck2, MessagesSquare, Route } from "lucide-react";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { Button } from "@/components/ui/button";
import { getServiceDetail, serviceDetails } from "@/lib/experience-data";
import { createMetadata } from "@/lib/seo";

type ServiceDetailPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return serviceDetails.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceDetail(slug);
  return service
    ? createMetadata({ title: `${service.title} in Joypurhat`, description: service.summary, path: `/services/${service.slug}`, image: "/og/services.jpg" })
    : createMetadata({ title: "Service not found", description: "This service page does not exist.", path: `/services/${slug}`, noIndex: true });
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { slug } = await params;
  const service = getServiceDetail(slug);
  if (!service) notFound();

  return (
    <main>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Services", path: "/services" }, { name: service.title, path: `/services/${service.slug}` }]} />
      <header className="service-detail-hero">
        <div className="site-shell service-detail-hero__grid">
          <span className="service-detail-hero__index">{service.id}</span>
          <div><span className="eyebrow">Housing Base service</span><h1>{service.title}</h1><p>{service.summary}</p></div>
          <Route aria-hidden="true" />
        </div>
      </header>

      <section className="service-decision-section">
        <div className="site-shell service-decision-section__grid">
          <div className="service-decision-section__intro"><span className="eyebrow">Start with the decision</span><h2>Good scope begins with better questions.</h2><p>The exact service depends on verified facts, approved scope, qualified professional input, and written commercial terms.</p></div>
          <ol>
            {service.decisions.map((decision, index) => <li key={decision}><span>0{index + 1}</span><p>{decision}</p></li>)}
          </ol>
        </div>
      </section>

      <section className="service-guardrails">
        <div className="site-shell service-guardrails__grid">
          <article><MessagesSquare aria-hidden="true" /><span>01</span><h2>Discuss</h2><p>Frame the intended outcome, known context, constraints, and the first useful decision.</p></article>
          <article><FileCheck2 aria-hidden="true" /><span>02</span><h2>Verify</h2><p>Identify the records, site information, professional review, and approvals the scope needs.</p></article>
          <article><Check aria-hidden="true" /><span>03</span><h2>Document</h2><p>Record responsibilities, inclusions, exclusions, milestones, commercial terms, and change control.</p></article>
        </div>
      </section>

      <section className="detail-cta"><div className="site-shell detail-cta__inner"><div><span className="eyebrow">Service enquiry / {service.id}</span><h2>Bring the real property context.</h2></div><Button asChild className="brand-button brand-button--light"><Link href={`/contact?interest=${encodeURIComponent(service.title)}`}>Discuss this service <ArrowRight aria-hidden="true" /></Link></Button></div></section>
      <div className="site-shell back-link-wrap"><Link className="back-link" href="/services"><ArrowLeft aria-hidden="true" /> Back to services</Link></div>
    </main>
  );
}

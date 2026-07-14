import Link from "next/link";
import { ArrowRight, Building2, FileCheck2, Handshake, KeyRound, MessagesSquare, Ruler } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { JsonLd } from "@/components/seo/json-ld";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { companyFaqs, operatingProcess, verifiedServiceLines } from "@/lib/company-data";
import { serviceDetails } from "@/lib/experience-data";
import { absoluteUrl, createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Real Estate Development Services in Joypurhat",
  description:
    "Residential development, joint-venture housing, land and documentation support, project planning, handover, and after-sales services from Abdullah Properties.",
  path: "/services",
  image: "/og/services.jpg",
});

const serviceIcons = [Building2, Handshake, FileCheck2, MessagesSquare, Ruler, KeyRound] as const;

export default function ServicesPage() {
  return (
    <main>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Services", path: "/services" }]} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Abdullah Properties service lines",
          itemListElement: verifiedServiceLines.map((service, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Service",
              name: service.title,
              description: service.summary,
              provider: { "@id": `${absoluteUrl("/")}#business` },
              areaServed: "Joypurhat, Bangladesh",
            },
          })),
        }}
      />
      <PageHero
        eyebrow="Housing Base Total Solutions"
        index="04"
        title="Six services around one clear housing journey."
        description="Choose focused support or connect the full route. Scope, evidence, responsibilities, and commercial commitments are confirmed before work begins."
      />

      <section className="content-section">
        <div className="site-shell service-suite">
          {serviceDetails.map((service, index) => {
            const Icon = serviceIcons[index];
            return (
              <article className="service-suite__item" key={service.id}>
                <div className="service-suite__index"><span>{service.id}</span><Icon aria-hidden="true" /></div>
                <div><h2>{service.title}</h2><p>{service.summary}</p></div>
                <Link href={`/services/${service.slug}`}>Explore service <ArrowRight aria-hidden="true" /></Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="content-section content-section--tint">
        <div className="site-shell editorial-grid">
          <div className="editorial-copy">
            <span className="eyebrow">Published working process</span>
            <h2>From inquiry to handover, the next step stays visible.</h2>
            <p>
              This sequence describes Abdullah Properties&apos; working approach. Exact fees, timelines, approvals, specifications, and deliverables are confirmed only in approved written documents.
            </p>
          </div>
          <ol className="editorial-list">
            {operatingProcess.map((step) => (
              <li key={step.id}><span>{step.id}</span><div><h3>{step.title}</h3><p>{step.summary}</p></div></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="content-section">
        <div className="site-shell faq-grid">
          <div className="editorial-copy">
            <span className="eyebrow">Frequently asked</span>
            <h2>Clarity before commitment.</h2>
            <p>These answers describe the current published operating approach for the Joypurhat office.</p>
            <Button asChild className="brand-button brand-button--outline"><Link href="/faq">View all questions <ArrowRight aria-hidden="true" /></Link></Button>
          </div>
          <Accordion type="single" collapsible className="faq-list">
            {companyFaqs.slice(0, 4).map((faq, index) => (
              <AccordionItem value={`item-${index}`} key={faq.question}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="detail-cta">
        <div className="site-shell detail-cta__inner">
          <div><span className="eyebrow">{verifiedServiceLines.length} connected service lines</span><h2>Frame the right service together.</h2></div>
          <Button asChild className="brand-button brand-button--light"><Link href="/contact">Plan a consultation <ArrowRight aria-hidden="true" /></Link></Button>
        </div>
      </section>
    </main>
  );
}

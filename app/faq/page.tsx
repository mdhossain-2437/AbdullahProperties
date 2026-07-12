import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageCircleQuestion } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { company, companyFaqs, contentVerification } from "@/lib/company-data";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Frequently Asked Questions",
  description:
    "Source-reviewed answers about Abdullah Properties in Joypurhat, including office location, hours, services, process, and property imagery.",
  path: "/faq",
  image: "/og/faq.jpg",
});

export default function FaqPage() {
  return (
    <main className="faq-page">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Frequently asked questions", path: "/faq" },
        ]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: companyFaqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }}
      />

      <PageHero
        eyebrow="Source-reviewed answers"
        index="09"
        title="Clarity before commitment."
        description="Straight answers about where Abdullah Properties operates, how a project conversation starts, and what must be confirmed directly."
      />

      <section className="content-section faq-page__content" aria-labelledby="faq-list-title">
        <div className="site-shell faq-page__grid">
          <aside className="faq-page__intro">
            <MessageCircleQuestion aria-hidden="true" />
            <span className="eyebrow">Useful first answers</span>
            <h2 id="faq-list-title">What to know before you enquire.</h2>
            <p>
              The answers below reflect the supplied company information reviewed on {contentVerification.reviewedOn}.
              Property-specific facts still require document review and direct confirmation.
            </p>
            <Button asChild className="brand-button brand-button--outline">
              <Link href="/services">
                Explore services <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </aside>

          <div className="faq-page__list">
            {companyFaqs.map((faq, index) => (
              <details className="faq-page__item" key={faq.question} open={index === 0}>
                <summary>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{faq.question}</h3>
                </summary>
                <div className="faq-page__answer">
                  <p>{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section content-section--tint faq-page__verification">
        <div className="site-shell editorial-grid">
          <div className="editorial-copy">
            <span className="eyebrow">Property verification</span>
            <h2>Important details belong in evidence, not assumptions.</h2>
            <p>
              Availability, ownership, dimensions, price, approvals, taxes, construction status, and contractual
              terms can change. Confirm each item directly and review the supporting documents before making a
              decision.
            </p>
          </div>
          <ol className="editorial-list">
            <li>
              <span>01</span>
              <div>
                <h3>Share the requirement</h3>
                <p>Explain the property need, location, intended outcome, and known constraints.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Review the context</h3>
                <p>Arrange a site visit and identify the plans, records, and questions that need evidence.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Confirm in writing</h3>
                <p>Agree scope, responsibilities, exclusions, commercial terms, and approvals before commitment.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="detail-cta">
        <div className="site-shell detail-cta__inner">
          <div>
            <span className="eyebrow">Still need an answer?</span>
            <h2>Ask the Joypurhat team directly.</h2>
            <p className="faq-page__contact-note">
              Call {company.phones[0].display} during published office hours or send an enquiry for follow-up.
            </p>
          </div>
          <Button asChild className="brand-button brand-button--light">
            <Link href="/contact">
              Contact the team <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

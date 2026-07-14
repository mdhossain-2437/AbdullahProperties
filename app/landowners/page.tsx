import Link from "next/link";
import { ArrowRight, CheckCircle2, FileSignature, Handshake, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { AppImage as Image } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { landownerReadiness, responsibilityMatrix } from "@/lib/experience-data";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Joint-Venture Housing Guide for Joypurhat Landowners",
  description:
    "Understand the documents, ownership alignment, project brief, written responsibilities, and verification gates for a landowner joint-venture discussion in Joypurhat.",
  path: "/landowners",
  image: "/og/services.jpg",
});

export default function LandownersPage() {
  return (
    <main>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Landowner journey", path: "/landowners" }]} />
      <PageHero
        eyebrow="Landowner journey"
        index="08"
        title="Build the agreement before the building."
        description="A joint venture works through verified records, aligned decision-makers, an understandable project brief, and written responsibilities—not verbal momentum."
      />

      <section className="partnership-stage">
        <div className="site-shell partnership-stage__frame">
          <Reveal className="partnership-stage__media">
            <Image src="/projects/housing-base-construction.jpg" alt="Illustrative construction coordination scene for joint-venture planning" fill preload sizes="(max-width: 760px) 100vw, 62vw" />
            <div className="partnership-stage__label"><span>Land</span><span>Agreement</span><span>Delivery</span></div>
          </Reveal>
          <div className="partnership-stage__copy">
            <Handshake aria-hidden="true" />
            <span className="eyebrow">The partnership premise</span>
            <h2>Clarity is shared infrastructure.</h2>
            <p>Every participant should be able to see the evidence, commercial assumptions, decision gates, responsibilities, exclusions, and process for recording change.</p>
          </div>
        </div>
      </section>

      <section className="readiness-cards" aria-labelledby="land-readiness-heading">
        <div className="site-shell">
          <div className="section-heading-row">
            <div className="section-heading"><span className="eyebrow">Readiness / 04</span><h2 id="land-readiness-heading">Prepare the ground for a serious conversation.</h2><p>These are starting inputs, not a substitute for qualified legal, engineering, or financial review.</p></div>
          </div>
          <div className="readiness-cards__grid">
            {landownerReadiness.map((item, index) => (
              <Reveal className="readiness-card" delay={index * 0.05} key={item.id}>
                <span>{item.id}</span><CheckCircle2 aria-hidden="true" /><h3>{item.title}</h3><p>{item.summary}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="responsibility-section">
        <div className="site-shell">
          <div className="responsibility-section__head">
            <div><span className="eyebrow eyebrow--light">Responsibility matrix</span><h2>Put the working relationship where everyone can see it.</h2></div>
            <div className="responsibility-section__icons"><FileSignature aria-hidden="true" /><ShieldCheck aria-hidden="true" /></div>
          </div>
          <div className="responsibility-table" role="table" aria-label="Indicative joint venture responsibility matrix">
            <div className="responsibility-table__row responsibility-table__row--head" role="row">
              <span role="columnheader">Decision area</span><span role="columnheader">Landowner input</span><span role="columnheader">Company coordination</span>
            </div>
            {responsibilityMatrix.map((row) => (
              <div className="responsibility-table__row" role="row" key={row.subject}>
                <strong role="cell" aria-label={`Decision area: ${row.subject}`}>{row.subject}</strong><span role="cell" aria-label={`Landowner input: ${row.landowner}`}>{row.landowner}</span><span role="cell" aria-label={`Company coordination: ${row.company}`}>{row.company}</span>
              </div>
            ))}
          </div>
          <div className="responsibility-section__footer"><p>Final responsibilities depend on verified facts and the approved written agreement.</p><Button asChild className="brand-button brand-button--light"><Link href="/contact?interest=Joint-venture%20housing">Discuss a land partnership <ArrowRight aria-hidden="true" /></Link></Button></div>
        </div>
      </section>
    </main>
  );
}

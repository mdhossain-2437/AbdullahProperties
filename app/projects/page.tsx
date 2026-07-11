import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, ClipboardCheck, Layers3 } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { AppImage as Image } from "@/components/ui/app-image";

export const metadata: Metadata = {
  title: "Projects",
  description: "See how Abdullah Properties connects brand, planning, delivery, and client experience across the property journey.",
};

export default function ProjectsPage() {
  return (
    <main>
      <PageHero eyebrow="Projects & capability" index="03" title="Built work starts with visible decisions." description="A portfolio is more than finished imagery. It shows how identity, planning, delivery, and long-term use remain connected." />

      <section className="content-section">
        <div className="site-shell project-feature">
          <Reveal className="media-panel">
            <Image src="/projects/housing-base-construction.jpg" alt="Housing Base Total Solution development under construction" fill priority sizes="(max-width: 760px) 100vw, 62vw" />
            <div className="media-panel__label"><span>Housing Base / Delivery study</span><span>Joypurhat</span></div>
          </Reveal>
          <Reveal className="editorial-copy" delay={0.08}>
            <span className="eyebrow">Delivery thinking</span>
            <h2>Make progress understandable.</h2>
            <p>Good project communication turns programme, scope, risk, and quality into shared decisions. It helps clients see what is changing and what must stay protected.</p>
            <Button asChild className="brand-button"><Link href="/contact">Discuss a project <ArrowRight aria-hidden="true" /></Link></Button>
          </Reveal>
        </div>
      </section>

      <section className="content-section content-section--dark">
        <div className="site-shell project-principles">
          {[
            { icon: Layers3, number: "01", title: "Connected layers", copy: "Commercial, spatial, technical, and operational decisions are reviewed as one property system." },
            { icon: ClipboardCheck, number: "02", title: "Visible gates", copy: "Each phase ends with evidence, decisions, owners, and the next useful action." },
            { icon: Building2, number: "03", title: "Long-term use", copy: "The experience after handover is part of the brief, not somebody else's problem." },
          ].map((principle, index) => (
            <Reveal className="project-principle" delay={index * 0.06} key={principle.number}>
              <principle.icon aria-hidden="true" />
              <span>{principle.number}</span>
              <h2>{principle.title}</h2>
              <p>{principle.copy}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="content-section content-section--tint">
        <div className="site-shell project-gallery">
          <div className="media-panel"><Image src="/projects/client-studio.jpg" alt="Abdullah Properties client experience studio" fill sizes="(max-width: 760px) 100vw, 50vw" /><div className="media-panel__label"><span>Client experience</span><span>Interior identity</span></div></div>
          <div className="media-panel"><Image src="/projects/building-signage.jpg" alt="Abdullah Properties building signage" fill sizes="(max-width: 760px) 100vw, 50vw" /><div className="media-panel__label"><span>Property presence</span><span>Exterior identity</span></div></div>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import { ArrowRight, Building2, ClipboardCheck, Layers3 } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { Button } from "@/components/ui/button";
import { AppImage as Image } from "@/components/ui/app-image";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Projects & Nirapad Nibas in Joypurhat",
  description:
    "Review Abdullah Properties' published Nirapad Nibas project location in Dhanmondi, Joypurhat, plus clearly labelled design and delivery studies.",
  path: "/projects",
  image: "/og/projects.jpg",
});

export default function ProjectsPage() {
  return (
    <main>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Projects", path: "/projects" }]} />
      <PageHero
        eyebrow="Projects & capability"
        index="03"
        title="Project information with evidence boundaries."
        description="Nirapad Nibas is identified in the supplied company material. Conflicting dimensions and amenity claims are withheld until an approved project schedule is available."
      />

      <section className="content-section">
        <div className="site-shell project-feature">
          <Reveal className="media-panel">
            <Image src="/projects/housing-base-construction.jpg" alt="Abdullah Properties branded construction delivery visual" fill preload sizes="(max-width: 760px) 100vw, 62vw" />
            <div className="media-panel__label"><span>Illustrative delivery image</span><span>Not a verified project photograph</span></div>
          </Reveal>
          <Reveal className="editorial-copy" delay={0.08}>
            <span className="eyebrow">Published project record</span>
            <h2>Nirapad Nibas</h2>
            <p><strong>Published location:</strong> Dhanmondi, Joypurhat.</p>
            <p>
              The former company website identifies this residential project, but publishes conflicting areas, balcony counts, and other specifications. This site therefore shows only the consistent project name and locality until the owner approves a single project record.
            </p>
            <Button asChild className="brand-button"><Link href="/projects/nirapad-nibas">Review the bounded record <ArrowRight aria-hidden="true" /></Link></Button>
          </Reveal>
        </div>
      </section>

      <section className="content-section content-section--dark">
        <div className="site-shell project-principles">
          {[
            { icon: Layers3, number: "01", title: "Connected layers", copy: "Commercial, spatial, technical, documentation, and operating decisions are reviewed as one property system." },
            { icon: ClipboardCheck, number: "02", title: "Visible gates", copy: "Each phase should end with evidence, decisions, owners, and the next useful action." },
            { icon: Building2, number: "03", title: "Responsible claims", copy: "Dimensions, approvals, amenities, prices, and availability are published only from an approved current record." },
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
        <div className="site-shell project-study-heading">
          <div className="editorial-copy"><span className="eyebrow">Brand & delivery studies</span><h2>Visual direction, clearly separated from inventory.</h2><p>These images show presentation and experience concepts. They are not evidence of completed, available, or approved property inventory.</p></div>
          <Button asChild className="brand-button brand-button--outline"><Link href="/property-disclaimer">Read the property disclaimer</Link></Button>
        </div>
        <div className="site-shell project-gallery">
          <div className="media-panel"><Image src="/projects/client-studio.jpg" alt="Illustrative Abdullah Properties client experience studio" fill sizes="(max-width: 760px) 100vw, 50vw" /><div className="media-panel__label"><span>Visual study</span><span>Client experience</span></div></div>
          <div className="media-panel"><Image src="/projects/building-signage.jpg" alt="Illustrative Abdullah Properties building signage" fill sizes="(max-width: 760px) 100vw, 50vw" /><div className="media-panel__label"><span>Visual study</span><span>Property identity</span></div></div>
        </div>
      </section>
    </main>
  );
}

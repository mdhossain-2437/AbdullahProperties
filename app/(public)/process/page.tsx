import Link from "next/link";
import { ArrowRight, FileSearch, MessagesSquare, Route, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { AppImage as Image } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { operatingProcess } from "@/lib/company-data";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "How Abdullah Properties Works",
  description:
    "Follow Abdullah Properties' five-stage operating process in Joypurhat: inquiry, site visit, verification and agreement, delivery updates, inspection, and handover.",
  path: "/process",
  image: "/og/services.jpg",
});

const gates = [
  { icon: MessagesSquare, label: "A clear question" },
  { icon: FileSearch, label: "Evidence before scope" },
  { icon: Route, label: "Visible decisions" },
  { icon: ShieldCheck, label: "Recorded handover" },
] as const;

export default function ProcessPage() {
  return (
    <main>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Working process", path: "/process" }]} />
      <PageHero
        eyebrow="Working system"
        index="09"
        title="One visible route through a complex decision."
        description="The published process connects the first inquiry to the site context, verified scope, delivery records, final inspection, and structured handover."
      />

      <section className="process-film">
        <div className="site-shell process-film__grid">
          <div className="process-film__sticky">
            <div className="process-film__media">
              <Image src="/projects/client-studio.jpg" alt="Illustrative Abdullah Properties planning and consultation environment" fill preload sizes="(max-width: 760px) 100vw, 42vw" />
              <div className="process-film__counter">01—05</div>
            </div>
            <p>Each stage ends with a clearer record, decision, or owner for the next action.</p>
          </div>
          <ol className="process-film__chapters">
            {operatingProcess.map((step) => (
              <li key={step.id}>
                <span>{step.id}</span>
                <div><p>Decision gate</p><h2>{step.title}</h2><p>{step.summary}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="process-gates">
        <div className="site-shell process-gates__grid">
          {gates.map((gate) => (
            <article key={gate.label}><gate.icon aria-hidden="true" /><span>{gate.label}</span></article>
          ))}
        </div>
      </section>

      <section className="detail-cta"><div className="site-shell detail-cta__inner"><div><span className="eyebrow">Enter the process</span><h2>Start with the real context.</h2></div><Button asChild className="brand-button brand-button--light"><Link href="/contact">Plan the first conversation <ArrowRight aria-hidden="true" /></Link></Button></div></section>
    </main>
  );
}

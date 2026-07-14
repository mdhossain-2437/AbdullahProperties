import Link from "next/link";
import { ArrowRight, Check, Eye, FileCheck2, Scale } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { AppImage as Image } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { buyerDecisionSteps, documentReadiness } from "@/lib/experience-data";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Buyer Property Decision Guide for Joypurhat",
  description:
    "Use Abdullah Properties' practical buyer journey to frame your needs, inspect context, request evidence, compare whole cost, and confirm decisions in writing.",
  path: "/buyers",
  image: "/og/properties.jpg",
});

export default function BuyersPage() {
  return (
    <main>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Buyer journey", path: "/buyers" }]} />
      <PageHero
        eyebrow="Buyer journey"
        index="07"
        title="Make the property earn your confidence."
        description="A useful search is not a race through listings. It is a sequence of clear needs, observed context, verified evidence, whole-cost comparison, and written decisions."
      />

      <section className="cinematic-intro">
        <div className="site-shell cinematic-intro__grid">
          <Reveal className="cinematic-intro__media">
            <Image src="/properties/joypurhat-residence.jpg" alt="Illustrative residential property study for buyer decision planning" fill preload sizes="(max-width: 760px) 100vw, 58vw" />
            <div className="cinematic-intro__caption"><span>Observe</span><span>Verify</span><span>Compare</span></div>
          </Reveal>
          <div className="cinematic-intro__copy">
            <span className="eyebrow">Before the viewing</span>
            <h2>Begin with the life the property must support.</h2>
            <p>Who will use it? What needs to be close? Which daily journeys matter? What would make the property difficult to operate or adapt?</p>
            <div className="icon-principles">
              <div><Eye aria-hidden="true" /><span>See the context</span></div>
              <div><FileCheck2 aria-hidden="true" /><span>Request evidence</span></div>
              <div><Scale aria-hidden="true" /><span>Compare the whole</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="decision-corridor" aria-labelledby="buyer-decision-heading">
        <div className="site-shell decision-corridor__grid">
          <div className="decision-corridor__sticky">
            <span className="eyebrow">Decision corridor / 05</span>
            <h2 id="buyer-decision-heading">Five gates between interest and commitment.</h2>
            <p>Each gate should produce a clearer question, stronger evidence, or an explicit written decision.</p>
            <Button asChild className="brand-button brand-button--outline"><Link href="/properties">Explore visual studies <ArrowRight aria-hidden="true" /></Link></Button>
          </div>
          <ol className="decision-corridor__steps">
            {buyerDecisionSteps.map((step) => (
              <li key={step.id}>
                <span>{step.id}</span>
                <div><h3>{step.title}</h3><p>{step.summary}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="readiness-section">
        <div className="site-shell readiness-section__grid">
          <div>
            <span className="eyebrow eyebrow--light">Prepare the conversation</span>
            <h2>Bring enough context to make the first meeting useful.</h2>
          </div>
          <ul>
            {documentReadiness.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}
          </ul>
          <Button asChild className="brand-button brand-button--light"><Link href="/contact?interest=Buyer%20consultation">Plan a buyer consultation <ArrowRight aria-hidden="true" /></Link></Button>
        </div>
      </section>
    </main>
  );
}

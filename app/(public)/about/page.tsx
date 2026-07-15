import Link from "next/link";
import { ArrowRight, Eye, Home, Shield, UserRoundCheck } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { Button } from "@/components/ui/button";
import { AppImage as Image } from "@/components/ui/app-image";
import { company, contentVerification } from "@/lib/company-data";
import { createMetadata } from "@/lib/seo";

const leadershipResponsibilities = [
  {
    id: "01",
    role: "Founder",
    heading: "Company direction",
    responsibility: "Business direction, customer relationships, housing strategy, and the principles used to evaluate commitments before they are made.",
  },
  {
    id: "02",
    role: "Co-founder",
    heading: "Delivery oversight",
    responsibility: "Project coordination, quality follow-through, decision ownership, and the connection between written commitments and day-to-day delivery.",
  },
] as const;

export const metadata = createMetadata({
  title: "About Abdullah Properties in Joypurhat",
  description:
    "Learn how Abdullah Properties approaches residential development, joint-venture housing, verified documentation, delivery, and customer support in Joypurhat.",
  path: "/about",
  image: "/og/about.jpg",
});

export default function AboutPage() {
  return (
    <main>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "About", path: "/about" }]} />
      <PageHero
        eyebrow="About Abdullah Properties"
        index="05"
        title="Local housing work, made easier to understand."
        description="Abdullah Properties serves Joypurhat through residential development, joint-venture housing, documentation support, project planning, and structured follow-through."
      />

      <section className="content-section">
        <div className="site-shell about-story">
          <div className="about-story__logo">
            <Image
              src="/brand/logo-primary.png"
              alt="Transparent Abdullah Properties AP house logo and wordmark"
              fill
              preload
              sizes="(max-width: 760px) 100vw, 48vw"
            />
          </div>
          <div className="editorial-copy">
            <span className="eyebrow">The company</span>
            <h2>A housing base for the full decision journey.</h2>
            <p>
              The company&apos;s published operating model starts with an inquiry and site visit, then moves through property and document verification, written scope, delivery updates, inspection, handover, and after-sales coordination.
            </p>
            <p>
              Its stated base is {company.address.line1}, {company.address.line2}. The service focus is Joypurhat, with commitments confirmed through direct conversation and approved documents.
            </p>
            <Button asChild className="brand-button brand-button--outline">
              <Link href="/services">Explore the working system <ArrowRight aria-hidden="true" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="content-section content-section--dark">
        <div className="site-shell values-grid">
          {[
            { icon: Shield, title: "Sturdy", copy: "Clear scope, documented decisions, and careful follow-through protect the work from avoidable uncertainty." },
            { icon: Eye, title: "Visionary", copy: "Each property is considered through long-term use, local context, design direction, and the people it must serve." },
            { icon: Home, title: "Direct", copy: "Complex property questions are translated into visible steps, responsibilities, and the next useful action." },
          ].map((value) => (
            <article key={value.title}>
              <value.icon aria-hidden="true" />
              <h2>{value.title}</h2>
              <p>{value.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section content-section--tint" aria-labelledby="leadership-heading">
        <div className="site-shell leadership-section">
          <div className="leadership-section__head">
            <div className="editorial-copy">
              <span className="eyebrow">Leadership disclosure</span>
              <h2 id="leadership-heading">Responsibility without placeholder people.</h2>
            </div>
            <p>
              Verified legal names, titles, biographies, and original portraits are not present in the approved evidence set. Until the company supplies them, this page publishes the work each role owns—never a guessed identity or stock-image profile.
            </p>
          </div>
          <div className="leadership-grid">
            {leadershipResponsibilities.map((leader) => (
              <article className="leadership-card" key={leader.id}>
                <div className="leadership-card__body">
                  <div><span>{leader.id}</span><UserRoundCheck aria-hidden="true" /></div>
                  <p className="leadership-card__role">{leader.role}</p>
                  <h3>{leader.heading}</h3>
                  <p>{leader.responsibility}</p>
                  <small>Identity and portrait will appear only after owner-supplied evidence is approved.</small>
                </div>
              </article>
            ))}
          </div>
          <p className="verification-note">
            Content review: {contentVerification.reviewedOn}. {contentVerification.note}
          </p>
        </div>
      </section>

      <section className="content-section">
        <div className="site-shell editorial-grid">
          <div className="editorial-copy">
            <span className="eyebrow">Joypurhat first</span>
            <h2>Scale begins with understanding one place well.</h2>
            <p>
              Local relationships, access, documentation, service connections, construction realities, and daily use inform better housing decisions. Abdullah Properties&apos; stated service area is {company.areaServed}.
            </p>
            <p><strong>Office hours:</strong> {company.hours.display}</p>
            <Button asChild className="brand-button">
              <Link href="/contact">Contact the Joypurhat office <ArrowRight aria-hidden="true" /></Link>
            </Button>
          </div>
          <div className="media-panel">
            <Image src="/projects/office-identity.jpg" alt="Illustrative Abdullah Properties office identity visual" fill sizes="(max-width: 760px) 100vw, 58vw" />
            <div className="media-panel__label"><span>Joypurhat</span><span>Illustrative company environment</span></div>
          </div>
        </div>
      </section>
    </main>
  );
}

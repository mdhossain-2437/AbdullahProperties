import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  Check,
  Compass,
  KeyRound,
  Landmark,
  MapPin,
  Ruler,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { AppImage as Image } from "@/components/ui/app-image";
import { SectionHeading } from "@/components/brand/section-heading";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/features/properties/property-card";
import { featuredProperties } from "@/features/properties/data";
import { company } from "@/lib/company-data";
import { createMetadata } from "@/lib/seo";
import { proofPoints, services } from "@/lib/site-data";
import { documentReadiness } from "@/lib/experience-data";
import { listPublicAnnouncements, listPublicAreaGuides, listPublicInsights } from "@/features/cms/public-content";
import { CinematicHomeHero } from "@/features/cinematic-experience";
import { KineticWordRail, OperationsTrustSection, ResourceChecklists } from "@/features/public-experience";
import { resourceChecklists, solutionRailWords } from "@/features/public-experience/data";
import { DecisionStory } from "@/features/cinematic-experience/decision-story";
import { homeDecisionStory } from "@/features/cinematic-experience/decision-story-data";
import { DecisionRoom } from "@/features/cinematic-experience/decision-room";
import { EvidenceLedger } from "@/features/cinematic-experience/evidence-ledger";
import { HomeChapterNav } from "@/features/cinematic-experience/home-chapter-nav";
import { homeChapters } from "@/features/cinematic-experience/home-experience-data";
import { OfficeNextStep } from "@/features/cinematic-experience/office-next-step";

export const metadata = createMetadata({
  title: "Real Estate & Joint Venture Housing in Joypurhat",
  description:
    "Explore Abdullah Properties services for residential development, joint-venture housing, land documentation, planning, handover, and after-sales support in Joypurhat.",
  path: "/",
  image: "/og/home.jpg",
});

const serviceIcons = {
  building: Building2,
  landmark: Landmark,
  ruler: Ruler,
  key: KeyRound,
} as const;

export default async function Home() {
  const [announcements, areaGuides, insights] = await Promise.all([
    listPublicAnnouncements(),
    listPublicAreaGuides(),
    listPublicInsights(),
  ]);
  return (
    <main>
      <HomeChapterNav chapters={homeChapters} />
      <CinematicHomeHero />

      <KineticWordRail words={solutionRailWords} label="Abdullah Properties decision paths" />

      {announcements.length > 0 ? (
        <section className="announcement-strip" aria-labelledby="announcement-strip-title">
          <div className="site-shell announcement-strip__layout">
            <div className="announcement-strip__heading">
              <span className="eyebrow">Company updates</span>
              <h2 id="announcement-strip-title">Current notices from Abdullah Properties.</h2>
            </div>
            <div className="announcement-strip__list">
              {announcements.map((announcement, index) => (
                <article className="announcement-strip__item" key={announcement.slug}>
                  <div>
                    <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    <time dateTime={announcement.publishedAt}>{announcement.publishedAt.slice(0, 10)}</time>
                  </div>
                  <h3>{announcement.title}</h3>
                  <p>{announcement.summary}</p>
                  <Link href="/contact">Ask about this update <ArrowUpRight aria-hidden="true" /></Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="proof-section">
        <div className="site-shell proof-section__grid">
          <Reveal className="proof-section__statement">
            <span className="eyebrow">Housing Base Total Solutions</span>
            <h2>Property guidance that stays connected from first question to long-term use.</h2>
            <Button asChild className="brand-button brand-button--outline"><Link href="/about">Our approach <ArrowRight aria-hidden="true" /></Link></Button>
          </Reveal>
          <Reveal className="proof-points" delay={0.08}>
            <div className="proof-points__title"><span>Our focus</span><span>Built for clear decisions</span></div>
            {proofPoints.map((point) => (
              <div className="proof-point" key={point.value}>
                <strong>{point.value}</strong>
                <span>{point.label}</span>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <DecisionRoom />

      <section className="services-section" id="operating-system">
        <div className="site-shell">
          <div className="section-heading-row">
            <SectionHeading eyebrow="Services / 06" title="One property journey. Connected support." description="Residential development, joint ventures, documentation, planning, handover, and after-sales each have a clear role." />
            <Button asChild className="brand-button brand-button--outline"><Link href="/services">View all services</Link></Button>
          </div>
          <div className="service-grid">
            {services.map((service, index) => {
              const Icon = serviceIcons[service.icon];
              return (
                <Reveal className={`service-card ${index === 1 ? "service-card--accent" : ""}`} delay={index * 0.05} key={service.id}>
                  <div className="service-card__top"><span>{service.id}</span><Icon aria-hidden="true" /></div>
                  <div><h3>{service.title}</h3><p>{service.summary}</p></div>
                  <Link href="/services">Learn more <ArrowRight aria-hidden="true" /></Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <DecisionStory id="decision-process" chapters={homeDecisionStory} />

      <OperationsTrustSection
        title="A better property experience keeps the evidence trail visible."
        description="The public journey and protected office system use the same operating language: known facts, open questions, named owners, decision gates, and records that remain reviewable."
        link={{ href: "/quality", label: "Explore the quality gates" }}
      />

      <section className="featured-section" id="selected-work">
        <div className="site-shell">
          <div className="section-heading-row section-heading-row--dark">
            <SectionHeading inverse eyebrow="Selected work / Visual studies" title="Choose what fits the whole picture." description="These branded studies communicate design and delivery intent. Confirm live inventory and availability directly with the team." />
            <Button asChild className="brand-button brand-button--light"><Link href="/properties">Explore all</Link></Button>
          </div>
          <div className="featured-grid">
            {featuredProperties.map((property, index) => <PropertyCard property={property} key={property.slug} preload={index === 0} />)}
          </div>
          <div className="featured-section__footer">
            <span>Sturdy structures</span><span>Visionary direction</span><span>Direct service</span>
          </div>
        </div>
      </section>

      <EvidenceLedger />

      <section className="areas-section">
        <div className="site-shell">
          <SectionHeading eyebrow="Local intelligence" title="Read the place before you choose the property." description="A location is a system of access, daily life, visibility, services, and long-term change." />
          <div className="area-grid">
            {areaGuides.map((guide, index) => (
              <Reveal className="area-card" delay={index * 0.06} key={guide.slug}>
                <div><MapPin aria-hidden="true" /><span>{guide.index}</span></div>
                <h3>{guide.name}</h3>
                <p>{guide.dek}</p>
                <Link href={`/area-guides/${guide.slug}`}>Read area guide <ArrowUpRight aria-hidden="true" /></Link>
              </Reveal>
            ))}
          </div>
          <div className="areas-section__footer"><Button asChild className="brand-button brand-button--outline"><Link href="/area-guides">Explore all area guides <BookOpen aria-hidden="true" /></Link></Button></div>
        </div>
      </section>

      <section className="consult-section">
        <div className="site-shell consult-section__frame">
          <Reveal className="consult-card">
            <div className="consult-card__media">
              <Image src="/projects/client-studio.jpg" alt="Illustrative Abdullah Properties client consultation studio" fill sizes="(max-width: 760px) 100vw, 42vw" />
            </div>
            <div className="consult-card__content">
              <span className="eyebrow">Direct enquiry</span>
              <h2>Consult with our property team.</h2>
              <p>Bring the plot, the requirement, or the uncertainty. We will help structure the next useful decision.</p>
              <Button asChild className="brand-button"><Link href="/contact">Plan a consultation <ArrowRight aria-hidden="true" /></Link></Button>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="document-lab">
        <div className="site-shell document-lab__grid">
          <div className="document-lab__title"><span className="eyebrow eyebrow--light">Conversation kit</span><h2>Arrive with context.<br />Leave with a next step.</h2></div>
          <ul>
            {documentReadiness.map((item, index) => <li key={item}><span>0{index + 1}</span><p>{item}</p><Check aria-hidden="true" /></li>)}
          </ul>
          <div className="document-lab__action"><p>This checklist prepares the first conversation; it is not a complete legal or technical document list.</p><Link href="/contact">Prepare an enquiry <ArrowUpRight aria-hidden="true" /></Link></div>
        </div>
      </section>

      <section className="brand-principles">
        <div className="site-shell brand-principles__grid">
          <div className="brand-principles__mark"><ShieldCheck aria-hidden="true" /><span>Housing Base / AP</span></div>
          <div className="brand-principles__words"><span>Sturdy</span><span>Visionary</span><span>Direct</span></div>
          <p>The house frame signals protection. The AP foundation carries the journey. The orange window keeps warmth and opportunity visible.</p>
        </div>
      </section>

      <ResourceChecklists
        resources={resourceChecklists.slice(0, 2)}
        eyebrow="Practical tools"
        title="Prepare the buyer or landowner conversation before it begins."
        description="Use a consistent checklist to organize context and evidence questions, then take the unresolved items into the right professional review."
      />

      <section className="insights-section">
        <div className="site-shell">
          <div className="section-heading-row">
            <SectionHeading eyebrow="Field notes" title="Useful thinking before the big decision." />
            <Button asChild className="brand-button brand-button--outline"><Link href="/insights">All insights</Link></Button>
          </div>
          <div className="insight-grid">
            {insights.map((insight, index) => (
              <Reveal className="insight-card" delay={index * 0.05} key={insight.slug}>
                <div className="insight-card__meta"><span>{insight.category}</span><span>{insight.readTime}</span></div>
                <h3>{insight.title}</h3>
                <p>{insight.dek}</p>
                <Link href={`/insights/${insight.slug}`}>Read note <ArrowUpRight aria-hidden="true" /></Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <OfficeNextStep />

      <section className="home-cta">
        <div className="site-shell">
          <Reveal className="home-cta__card">
            <div className="home-cta__icon"><Compass aria-hidden="true" /><Sparkles aria-hidden="true" /></div>
            <span className="eyebrow eyebrow--light">{company.address.locality} property support</span>
            <h2>Start with a better question.</h2>
            <p>Tell us what you are trying to achieve. We will help organize the next conversation around the decisions that matter.</p>
            <Button asChild className="brand-button brand-button--light"><Link href="/contact">Start a conversation <ArrowRight aria-hidden="true" /></Link></Button>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

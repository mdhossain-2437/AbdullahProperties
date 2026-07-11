import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Compass,
  KeyRound,
  Landmark,
  MapPin,
  Ruler,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { AppImage as Image } from "@/components/ui/app-image";
import { SectionHeading } from "@/components/brand/section-heading";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/features/properties/property-card";
import { featuredProperties } from "@/features/properties/data";
import { areas, insights, proofPoints, services } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Property guidance built around clarity",
  description:
    "Discover Abdullah Properties, selected property visual studies, development services, and local insight for Joypurhat.",
};

const serviceIcons = {
  building: Building2,
  landmark: Landmark,
  ruler: Ruler,
  key: KeyRound,
} as const;

export default function Home() {
  return (
    <main>
      <section className="home-hero">
        <div className="site-shell">
          <div className="home-hero__intro">
            <p>
              Property decisions carry real weight. We connect local context, clear advice, and delivery thinking so the next move feels considered.
            </p>
            <h1>
              <span>Discover</span>
              <span className="home-hero__title-row">
                <span className="home-hero__title-image" aria-hidden="true">
                  <Image src="/properties/joypurhat-residence.jpg" alt="" fill priority sizes="180px" />
                </span>
                the best
              </span>
              <span>properties</span>
            </h1>
          </div>

          <Reveal className="hero-stage">
            <Image
              className="hero-stage__image"
              src="/properties/joypurhat-residence.jpg"
              alt="Contemporary Abdullah Properties residential entrance"
              fill
              priority
              sizes="(max-width: 760px) 100vw, 1240px"
            />
            <div className="hero-stage__veil" />
            <div className="hero-search-panel">
              <span className="eyebrow eyebrow--light">Property discovery / Joypurhat</span>
              <h2>Looking for a strategic, comfortable place?</h2>
              <form action="/properties" className="hero-search-panel__form" role="search">
                <label>
                  <span className="sr-only">Search by location or property type</span>
                  <input name="q" placeholder="Search by location or property type" />
                </label>
                <button type="submit" aria-label="Search properties"><Search aria-hidden="true" /></button>
              </form>
              <div className="hero-search-panel__chips" aria-label="Popular filters">
                <Link href="/properties?type=Residential">Residential</Link>
                <Link href="/properties?type=Commercial">Commercial</Link>
                <Link href="/properties?type=Mixed-use">Mixed-use</Link>
              </div>
            </div>
            <div className="hero-stage__index">
              <span>AP / 01</span>
              <span>Main Road, Joypurhat</span>
            </div>
          </Reveal>
        </div>
      </section>

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
                <strong>{point.value}<em>+</em></strong>
                <span>{point.label}</span>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="services-section">
        <div className="site-shell">
          <div className="section-heading-row">
            <SectionHeading eyebrow="Services / 04" title="One property journey. Four connected disciplines." description="Every service has a clear role, but the decisions work together." />
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

      <section className="consult-section">
        <div className="site-shell consult-section__frame">
          <Reveal className="consult-card">
            <div className="consult-card__media">
              <Image src="/projects/client-studio.jpg" alt="Abdullah Properties client consultation studio" fill sizes="(max-width: 760px) 100vw, 42vw" />
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

      <section className="featured-section">
        <div className="site-shell">
          <div className="section-heading-row section-heading-row--dark">
            <SectionHeading inverse eyebrow="Selected work / Visual studies" title="Best choice is the one that fits the whole picture." description="These branded studies communicate design and delivery intent. Confirm live inventory and availability directly with the team." />
            <Button asChild className="brand-button brand-button--light"><Link href="/properties">Explore all</Link></Button>
          </div>
          <div className="featured-grid">
            {featuredProperties.map((property, index) => <PropertyCard property={property} key={property.slug} priority={index === 0} />)}
          </div>
          <div className="featured-section__footer">
            <span>Sturdy structures</span><span>Visionary direction</span><span>Direct service</span>
          </div>
        </div>
      </section>

      <section className="areas-section">
        <div className="site-shell">
          <SectionHeading eyebrow="Local intelligence" title="Read the place before you choose the property." description="A location is a system of access, daily life, visibility, services, and long-term change." />
          <div className="area-grid">
            {areas.map((area, index) => (
              <Reveal className="area-card" delay={index * 0.06} key={area.name}>
                <div><MapPin aria-hidden="true" /><span>{area.index}</span></div>
                <h3>{area.name}</h3>
                <p>{area.note}</p>
                <Link href="/contact">Discuss this area <ArrowUpRight aria-hidden="true" /></Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="process-section">
        <div className="site-shell process-section__grid">
          <SectionHeading eyebrow="The process" title="Four clear gates. No mystery in the middle." description="A direct sequence helps every stakeholder understand what is known, what is next, and who owns the decision." />
          <ol className="process-list">
            {[
              ["01", "Frame", "Clarify the need, users, location, budget boundaries, and definition of success."],
              ["02", "Verify", "Check the site, documentation, access, constraints, and assumptions that carry risk."],
              ["03", "Shape", "Compare options and connect design, commercial, programme, and operational thinking."],
              ["04", "Deliver", "Coordinate the route to handover with visible decisions and accountable follow-through."],
            ].map(([number, title, copy]) => (
              <li key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="brand-principles">
        <div className="site-shell brand-principles__grid">
          <div className="brand-principles__mark"><ShieldCheck aria-hidden="true" /><span>Avenue Legacy / AP</span></div>
          <div className="brand-principles__words"><span>Sturdy</span><span>Visionary</span><span>Direct</span></div>
          <p>The house frame signals protection. The AP foundation carries the journey. The orange window keeps warmth and opportunity visible.</p>
        </div>
      </section>

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

      <section className="home-cta">
        <div className="site-shell">
          <Reveal className="home-cta__card">
            <div className="home-cta__icon"><Compass aria-hidden="true" /><Sparkles aria-hidden="true" /></div>
            <span className="eyebrow eyebrow--light">Your next property move</span>
            <h2>Start with a better question.</h2>
            <p>Tell us what you are trying to achieve. We will help organize the next conversation around the decisions that matter.</p>
            <Button asChild className="brand-button brand-button--light"><Link href="/contact">Start a conversation <ArrowRight aria-hidden="true" /></Link></Button>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

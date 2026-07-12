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
import { company, operatingProcess } from "@/lib/company-data";
import { createMetadata } from "@/lib/seo";
import { areas, insights, proofPoints, services } from "@/lib/site-data";

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
              <span>Property</span>
              <span className="home-hero__title-row">
                <span className="home-hero__title-image" aria-hidden="true">
                  <Image src="/properties/joypurhat-residence.jpg" alt="" fill preload sizes="180px" />
                </span>
                decisions,
              </span>
              <span>made clear.</span>
            </h1>
          </div>

          <Reveal className="hero-stage">
            <Image
              className="hero-stage__image"
              src="/properties/joypurhat-residence.jpg"
              alt="Contemporary Abdullah Properties residential entrance"
              fill
              preload
              sizes="(max-width: 760px) 100vw, 1240px"
            />
            <div className="hero-stage__veil" />
            <div className="hero-search-panel">
              <span className="eyebrow eyebrow--light">Housing support / Joypurhat</span>
              <h2>Looking for a home, land partner, or project route?</h2>
              <form action="/properties" className="hero-search-panel__form" role="search">
                <label>
                  <span className="sr-only">Search by location or property type</span>
                  <input name="q" placeholder="Search by location or property type" />
                </label>
                <button type="submit" aria-label="Search properties"><Search aria-hidden="true" /></button>
              </form>
              <nav className="hero-search-panel__chips" aria-label="Popular property filters">
                <Link href="/properties?type=Residential">Residential</Link>
                <Link href="/properties?type=Commercial">Commercial</Link>
                <Link href="/properties?type=Mixed-use">Mixed-use</Link>
              </nav>
            </div>
            <div className="hero-stage__index">
              <span>AP / 01</span>
              <span>Illustrative property study</span>
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
                <strong>{point.value}</strong>
                <span>{point.label}</span>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="services-section">
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

      <section className="featured-section">
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
          <SectionHeading eyebrow="The working process" title="Five visible steps from inquiry to handover." description="The published operating sequence keeps scope, evidence, decisions, and responsibilities understandable." />
          <ol className="process-list">
            {operatingProcess.map((step) => (
              <li key={step.id}><span>{step.id}</span><h3>{step.title}</h3><p>{step.summary}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="brand-principles">
        <div className="site-shell brand-principles__grid">
          <div className="brand-principles__mark"><ShieldCheck aria-hidden="true" /><span>Housing Base / AP</span></div>
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

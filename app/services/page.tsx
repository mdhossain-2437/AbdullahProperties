import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, KeyRound, Landmark, Ruler } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { services } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Services",
  description: "Connected property sales, development advisory, design delivery, and property management services in Joypurhat.",
};

const serviceIcons = { building: Building2, landmark: Landmark, ruler: Ruler, key: KeyRound } as const;

const faqs = [
  ["Where does a new property conversation begin?", "With the intended outcome, the known facts, and the uncertainties. The team can then recommend the most useful first verification step."],
  ["Are the property images live listings?", "The current site uses branded visual studies to demonstrate direction. Live availability, price, ownership, and programme must be confirmed directly."],
  ["Can Abdullah Properties support only one phase?", "Yes. A focused scope can be agreed, but interfaces with other phases are made visible so important decisions are not lost."],
  ["When are fees and timelines confirmed?", "Only after discovery clarifies the property context, scope, dependencies, evidence required, and decision owners."],
] as const;

export default function ServicesPage() {
  return (
    <main>
      <PageHero eyebrow="Housing Base Total Solutions" index="04" title="One team around the decisions that matter." description="Choose a focused service or connect the full journey. Scope, evidence, responsibilities, and handoffs stay explicit." />

      <section className="content-section">
        <div className="site-shell service-suite">
          {services.map((service) => {
            const Icon = serviceIcons[service.icon];
            return (
              <article className="service-suite__item" key={service.id}>
                <div className="service-suite__index"><span>{service.id}</span><Icon aria-hidden="true" /></div>
                <div><h2>{service.title}</h2><p>{service.summary}</p></div>
                <Link href="/contact">Discuss this service <ArrowRight aria-hidden="true" /></Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="content-section content-section--tint">
        <div className="site-shell editorial-grid">
          <div className="editorial-copy"><span className="eyebrow">Scope discipline</span><h2>Production starts after the assumptions are named.</h2><p>A project brief should state the outcome, users, information quality, dependencies, constraints, and decision rights. This protects time and improves accountability.</p></div>
          <ol className="editorial-list">
            <li><span>01</span><div><h3>Discover</h3><p>Clarify the need, context, stakeholders, and evidence already available.</p></div></li>
            <li><span>02</span><div><h3>Define</h3><p>Agree scope, exclusions, decision gates, responsibilities, and outputs.</p></div></li>
            <li><span>03</span><div><h3>Deliver</h3><p>Work through visible progress, issues, decisions, and controlled change.</p></div></li>
            <li><span>04</span><div><h3>Review</h3><p>Confirm the outcome, handover knowledge, open items, and next operating rhythm.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="content-section">
        <div className="site-shell faq-grid">
          <div className="editorial-copy"><span className="eyebrow">Frequently asked</span><h2>Clarity before commitment.</h2><p>These answers describe the operating approach. Final scope depends on the verified property and business context.</p></div>
          <Accordion type="single" collapsible className="faq-list">
            {faqs.map(([question, answer], index) => (
              <AccordionItem value={`item-${index}`} key={question}>
                <AccordionTrigger>{question}</AccordionTrigger>
                <AccordionContent>{answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="detail-cta"><div className="site-shell detail-cta__inner"><div><span className="eyebrow eyebrow--light">Start with discovery</span><h2>Frame the right service together.</h2></div><Button asChild className="brand-button brand-button--light"><Link href="/contact">Plan a consultation <ArrowRight aria-hidden="true" /></Link></Button></div></section>
    </main>
  );
}

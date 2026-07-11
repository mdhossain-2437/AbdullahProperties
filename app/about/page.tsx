import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Eye, Home, Shield } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { AppImage as Image } from "@/components/ui/app-image";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Abdullah Properties, its Joypurhat focus, Avenue Legacy identity, and direct approach to property decisions.",
};

export default function AboutPage() {
  return (
    <main>
      <PageHero eyebrow="About Abdullah Properties" index="05" title="Local trust, rebuilt for what comes next." description="The identity moves from traditional real-estate symbolism toward a direct, modern system grounded in protection, progress, and clear service." />

      <section className="content-section">
        <div className="site-shell about-story">
          <div className="about-story__logo"><Image src="/brand/logo-primary.png" alt="Abdullah Properties AP house logo and wordmark" fill priority sizes="(max-width: 760px) 100vw, 48vw" /></div>
          <div className="editorial-copy"><span className="eyebrow">The mark</span><h2>A home frame with AP at the foundation.</h2><p>The outer structure represents shelter and investment security. The integrated A and P form the foundation. The orange window keeps warmth, life, and opportunity visible inside a sturdy silhouette.</p><Button asChild className="brand-button brand-button--outline"><Link href="/projects">See the system in context <ArrowRight aria-hidden="true" /></Link></Button></div>
        </div>
      </section>

      <section className="content-section content-section--dark">
        <div className="site-shell values-grid">
          {[
            { icon: Shield, title: "Sturdy", copy: "Strength is expressed through clear scope, durable decisions, and follow-through—not visual weight alone." },
            { icon: Eye, title: "Visionary", copy: "Every property is considered as part of changing local life, infrastructure, and long-term opportunity." },
            { icon: Home, title: "Direct", copy: "Complexity is translated into plain decisions, visible responsibilities, and the next useful action." },
          ].map((value) => <article key={value.title}><value.icon aria-hidden="true" /><h2>{value.title}</h2><p>{value.copy}</p></article>)}
        </div>
      </section>

      <section className="content-section content-section--tint">
        <div className="site-shell editorial-grid">
          <div className="editorial-copy"><span className="eyebrow">Joypurhat first</span><h2>Scale begins with understanding one place well.</h2><p>The initial market focus is Joypurhat. Local relationships, movement patterns, services, land context, and real operating needs inform better property conversations.</p></div>
          <div className="media-panel"><Image src="/projects/office-identity.jpg" alt="Abdullah Properties office wall identity" fill sizes="(max-width: 760px) 100vw, 58vw" /><div className="media-panel__label"><span>Avenue Legacy</span><span>Brand environment</span></div></div>
        </div>
      </section>
    </main>
  );
}

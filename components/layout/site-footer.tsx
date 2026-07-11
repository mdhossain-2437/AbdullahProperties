import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { siteNavigation } from "@/lib/site-data";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-shell">
        <div className="site-footer__lead">
          <div>
            <span className="eyebrow eyebrow--light">Joypurhat / Bangladesh</span>
            <h2>Build the next move<br />with clarity.</h2>
          </div>
          <Link className="circle-link" href="/contact" aria-label="Start a conversation">
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
        <div className="site-footer__grid">
          <BrandLogo tone="dark" />
          <nav aria-label="Footer navigation">
            {siteNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          </nav>
          <div className="site-footer__note">
            <p>Sturdy. Visionary. Direct.</p>
            <p>Contact details and enquiry delivery are connected during production onboarding.</p>
          </div>
        </div>
        <div className="site-footer__legal">
          <span>© {new Date().getFullYear()} Abdullah Properties</span>
          <span>Housing Base Total Solutions</span>
        </div>
      </div>
    </footer>
  );
}

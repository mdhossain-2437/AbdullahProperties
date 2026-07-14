import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { company } from "@/lib/company-data";
import { siteNavigation } from "@/lib/site-data";

const supportLinks = [
  { href: "/buyers", label: "Buyer journey" },
  { href: "/landowners", label: "Landowner journey" },
  { href: "/area-guides", label: "Area guides" },
  { href: "/insights", label: "Insights" },
  { href: "/faq", label: "FAQ" },
  { href: "/brand-kit", label: "Brand kit" },
  { href: "/accessibility", label: "Accessibility" },
] as const;

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookies", label: "Cookies" },
  { href: "/property-disclaimer", label: "Property disclaimer" },
] as const;

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
            {supportLinks.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          </nav>
          <div className="site-footer__note">
            <p>Sturdy. Visionary. Direct.</p>
            <address>
              {company.address.line1}<br />
              {company.address.line2}, {company.address.country}<br />
              <a href={company.phones[0].href}>{company.phones[0].display}</a><br />
              <a href={`mailto:${company.email}`}>{company.email}</a>
            </address>
            <p>{company.hours.display}</p>
          </div>
        </div>
        <div className="site-footer__legal">
          <span>© {new Date().getFullYear()} Abdullah Properties</span>
          <nav aria-label="Legal navigation">
            {legalLinks.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          </nav>
        </div>
      </div>
    </footer>
  );
}

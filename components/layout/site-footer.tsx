"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { FooterGhostMarquee } from "@/components/layout/footer-ghost-marquee";
import { company } from "@/lib/company-data";
import { getPublicNavigation, publicShellCopy } from "@/lib/i18n/public-navigation";
import { localeFromPathname, localizedPublicHref, type PublicLocale } from "@/lib/i18n/public-locale";

const supportLinks = [
  { href: "/buyers", en: "Buyer journey", bn: "ক্রেতার পথ" },
  { href: "/landowners", en: "Landowner journey", bn: "জমির মালিকের পথ" },
  { href: "/joint-venture", en: "Joint-venture pathway", bn: "যৌথ উদ্যোগ" },
  { href: "/process", en: "Working process", bn: "কাজের প্রক্রিয়া" },
  { href: "/quality", en: "Quality gates", bn: "মান ও যাচাই" },
  { href: "/client-care", en: "Client care", bn: "গ্রাহকসেবা" },
  { href: "/area-guides", en: "Area guides", bn: "এলাকা নির্দেশিকা" },
  { href: "/resources", en: "Resources", bn: "সহায়িকা" },
  { href: "/property-planner", en: "Property planner", bn: "সিদ্ধান্ত-পরিকল্পক" },
  { href: "/insights", en: "Insights", bn: "অন্তর্দৃষ্টি" },
  { href: "/faq", en: "FAQ", bn: "সাধারণ প্রশ্ন" },
  { href: "/brand-kit", en: "Brand kit", bn: "ব্র্যান্ড কিট" },
  { href: "/accessibility", en: "Accessibility", bn: "ব্যবহারযোগ্যতা" },
] as const;

const legalLinks = [
  { href: "/privacy", en: "Privacy", bn: "গোপনীয়তা" },
  { href: "/terms", en: "Terms", bn: "ব্যবহারের শর্ত" },
  { href: "/cookies", en: "Cookies", bn: "কুকি" },
  { href: "/property-disclaimer", en: "Property disclaimer", bn: "সম্পত্তি-তথ্যের সীমা" },
] as const;

function localLabel(locale: PublicLocale, item: { readonly en: string; readonly bn: string }) {
  return locale === "bn-BD" ? item.bn : item.en;
}

type FooterLink = {
  readonly href: string;
  readonly label: string;
};

type FooterLinkGroup = {
  readonly key: "explore" | "journeys" | "guides" | "company";
  readonly title: string;
  readonly links: readonly FooterLink[];
};

type SiteFooterProps = {
  readonly year: number;
};

export function SiteFooter({ year }: SiteFooterProps) {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  const isBengali = locale === "bn-BD";
  const copy = publicShellCopy[locale];
  const navigation = getPublicNavigation(locale);
  const homeHref = localizedPublicHref("/", locale);
  const contactHref = localizedPublicHref("/contact", locale);
  const localizedSupportLinks = supportLinks.map((item) => ({
    href: localizedPublicHref(item.href, locale),
    label: localLabel(locale, item),
  }));
  const footerLinkGroups: readonly FooterLinkGroup[] = [
    {
      key: "explore",
      title: isBengali ? "সম্পত্তি ও সেবা" : "Explore",
      links: navigation.slice(0, 4),
    },
    {
      key: "journeys",
      title: isBengali ? "সিদ্ধান্তের পথ" : "Journeys",
      links: localizedSupportLinks.slice(0, 6),
    },
    {
      key: "guides",
      title: isBengali ? "সহায়িকা ও ধারণা" : "Guides & insight",
      links: localizedSupportLinks.slice(6, 11),
    },
    {
      key: "company",
      title: isBengali ? "প্রতিষ্ঠান ও নীতিমালা" : "Company & standards",
      links: [
        ...navigation.slice(4),
        { href: contactHref, label: isBengali ? "যোগাযোগ" : "Contact" },
        ...localizedSupportLinks.slice(11),
        { href: "/office", label: isBengali ? "কর্মীদের প্রবেশ" : "Office sign in" },
      ],
    },
  ];

  return (
    <footer className="site-footer" lang={locale}>
      <div className="site-shell">
        <div className="site-footer__lead">
          <div>
            <span className="eyebrow eyebrow--light">{isBengali ? "জয়পুরহাট / বাংলাদেশ" : "Joypurhat / Bangladesh"}</span>
            <h2>{isBengali ? <>পরবর্তী পদক্ষেপটি নিন<br />পূর্ণ স্বচ্ছতায়।</> : <>Build the next move<br />with clarity.</>}</h2>
          </div>
          <Link className="circle-link" href={contactHref} aria-label={isBengali ? "আলোচনা শুরু করুন" : "Start a conversation"}>
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
        <div className="site-footer__grid">
          <div className="site-footer__identity">
            <BrandLogo className="site-footer__logo" tone="dark" homeHref={homeHref} homeLabel={copy.logoLabel} />
            <div className="site-footer__note">
              <p>{isBengali ? "দৃঢ়। দূরদর্শী। সরাসরি।" : "Sturdy. Visionary. Direct."}</p>
              <address>
                {isBengali ? "পৌর মার্কেটের ২য় তলা" : company.address.line1}<br />
                {isBengali ? "পূর্ব বাজার, জয়পুরহাট, বাংলাদেশ" : `${company.address.line2}, ${company.address.country}`}<br />
                <a href={company.phones[0].href}>{company.phones[0].display}</a><br />
                <a href={`mailto:${company.email}`}>{company.email}</a>
              </address>
              <p>{isBengali ? "শনিবার–বৃহস্পতিবার, সকাল ১০টা–রাত ৮টা" : company.hours.display}</p>
            </div>
          </div>
          <div className="site-footer__nav-groups">
            {footerLinkGroups.map((group) => {
              const headingId = `footer-${group.key}-${isBengali ? "bn" : "en"}`;

              return (
                <section className="site-footer__nav-group" key={group.key}>
                  <h3 id={headingId}>{group.title}</h3>
                  <nav aria-labelledby={headingId}>
                    <ul>
                      {group.links.map((item) => (
                        <li key={item.href}>
                          <Link href={item.href}>{item.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </section>
              );
            })}
          </div>
        </div>
        <div className="site-footer__legal">
          <span>© {year} {isBengali ? company.nameBn : company.name}</span>
          <nav aria-label={isBengali ? "আইনগত তথ্য" : "Legal navigation"}>
            {legalLinks.map((item) => (
              <Link key={item.href} href={localizedPublicHref(item.href, locale)}>{localLabel(locale, item)}</Link>
            ))}
          </nav>
        </div>
      </div>
      <FooterGhostMarquee locale={locale} />
    </footer>
  );
}

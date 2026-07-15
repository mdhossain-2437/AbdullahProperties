import { siteNavigation } from "@/lib/site-data";
import { localizedPublicHref, type PublicLocale } from "@/lib/i18n/public-locale";

const bengaliSiteNavigation = [
  { href: "/properties", label: "সম্পত্তি" },
  { href: "/projects", label: "প্রকল্প" },
  { href: "/solutions", label: "সমাধান" },
  { href: "/services", label: "সেবাসমূহ" },
  { href: "/about", label: "আমাদের সম্পর্কে" },
] as const;

export const publicShellCopy = {
  "en-BD": {
    primaryNavigation: "Primary navigation",
    explore: "Explore",
    talk: "Talk to us",
    logoLabel: "Abdullah Properties home",
    skip: "Skip to content",
  },
  "bn-BD": {
    primaryNavigation: "প্রধান নেভিগেশন",
    explore: "আরও দেখুন",
    talk: "কথা বলুন",
    logoLabel: "আব্দুল্লাহ প্রোপার্টিজ বাংলা হোম",
    skip: "মূল তথ্যে যান",
  },
} as const satisfies Record<PublicLocale, Record<string, string>>;

export function getPublicNavigation(locale: PublicLocale) {
  const navigation = locale === "bn-BD" ? bengaliSiteNavigation : siteNavigation;
  return navigation.map((item) => ({
    ...item,
    href: localizedPublicHref(item.href, locale),
  }));
}


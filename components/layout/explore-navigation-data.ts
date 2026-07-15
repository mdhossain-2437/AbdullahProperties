export type ExploreNavigationLink = {
  href: string;
  label: string;
  description: string;
};

export type ExploreNavigationGroup = {
  id: string;
  label: string;
  links: readonly ExploreNavigationLink[];
};

export const exploreNavigationGroups = [
  {
    id: "01",
    label: "Discover",
    links: [
      { href: "/properties", label: "Properties", description: "Browse property and project studies." },
      { href: "/projects", label: "Projects", description: "Review project stories and published evidence." },
      { href: "/area-guides", label: "Areas", description: "Read location context before comparing options." },
    ],
  },
  {
    id: "02",
    label: "Decisions",
    links: [
      { href: "/solutions", label: "Solutions", description: "Choose the decision path that fits." },
      { href: "/buyers", label: "Buyers", description: "Prepare viewing and verification questions." },
      { href: "/landowners", label: "Landowners", description: "Frame the first land conversation." },
      { href: "/joint-venture", label: "Joint venture", description: "Review evidence, scope, and responsibility." },
      { href: "/property-planner", label: "Planner", description: "Prepare a local, unsent decision summary." },
    ],
  },
  {
    id: "03",
    label: "Delivery",
    links: [
      { href: "/services", label: "Services", description: "See the connected service lines." },
      { href: "/process", label: "Process", description: "Follow the published working sequence." },
      { href: "/quality", label: "Quality", description: "Understand the review and evidence gates." },
      { href: "/client-care", label: "Client care", description: "Prepare handover and after-sales records." },
    ],
  },
  {
    id: "04",
    label: "Company",
    links: [
      { href: "/about", label: "About", description: "Read the company context and principles." },
      { href: "/insights", label: "Insights", description: "Use practical property decision guides." },
      { href: "/resources", label: "Resources", description: "Open checklists and preparation tools." },
      { href: "/contact", label: "Contact", description: "Choose a direct conversation channel." },
      { href: "/brand-kit", label: "Brand kit", description: "Review Abdullah Properties brand assets." },
    ],
  },
] as const satisfies readonly ExploreNavigationGroup[];

export const protectedNavigationLinks = [
  { href: "/office", label: "Office", description: "Protected operations workspace." },
  { href: "/studio", label: "Studio", description: "Protected content workspace." },
] as const satisfies readonly ExploreNavigationLink[];

const bengaliExploreNavigationGroups = [
  {
    id: "01",
    label: "খুঁজে দেখুন",
    links: [
      { href: "/properties", label: "সম্পত্তি", description: "প্রকাশিত নকশা-উপস্থাপনা দেখুন এবং বর্তমান তথ্য যাচাই করুন।" },
      { href: "/projects", label: "প্রকল্প", description: "পরিকল্পনা, অগ্রগতি ও হস্তান্তরের কাজের গল্প পড়ুন।" },
      { href: "/area-guides", label: "এলাকা", description: "সম্পত্তির আগে স্থানীয় প্রেক্ষাপট ও প্রশ্নগুলো বুঝুন।" },
    ],
  },
  {
    id: "02",
    label: "সিদ্ধান্ত",
    links: [
      { href: "/solutions", label: "সমাধান", description: "আপনার ভূমিকা অনুযায়ী সঠিক সিদ্ধান্তের পথ বেছে নিন।" },
      { href: "/buyers", label: "ক্রেতা", description: "দেখা ও প্রতিশ্রুতির আগে প্রয়োজন ও প্রমাণ গুছিয়ে নিন।" },
      { href: "/landowners", label: "জমির মালিক", description: "যৌথ উদ্যোগের প্রথম আলোচনাটি প্রস্তুত করুন।" },
      { href: "/joint-venture", label: "যৌথ উদ্যোগ", description: "প্রমাণ, পরিধি ও দায়িত্বের লিখিত কাঠামো জানুন।" },
      { href: "/property-planner", label: "পরিকল্পক", description: "সংবেদনশীল তথ্য ছাড়াই আলোচনার সারাংশ তৈরি করুন।" },
    ],
  },
  {
    id: "03",
    label: "বাস্তবায়ন",
    links: [
      { href: "/services", label: "সেবাসমূহ", description: "ছয়টি সংযুক্ত আবাসন সেবার ভূমিকা দেখুন।" },
      { href: "/process", label: "কাজের প্রক্রিয়া", description: "প্রথম প্রশ্ন থেকে হস্তান্তর পর্যন্ত প্রকাশিত ধাপগুলো জানুন।" },
      { href: "/quality", label: "মান ও যাচাই", description: "প্রতিটি ধাপে প্রমাণ ও অনুমোদনের ভূমিকা বুঝুন।" },
      { href: "/client-care", label: "গ্রাহকসেবা", description: "হস্তান্তরের দলিল, অসম্পূর্ণ বিষয় ও পরবর্তী সহায়তা গুছিয়ে নিন।" },
    ],
  },
  {
    id: "04",
    label: "প্রতিষ্ঠান",
    links: [
      { href: "/about", label: "আমাদের সম্পর্কে", description: "প্রতিষ্ঠানের পরিচয়, কাজের নীতি ও প্রমাণের সীমা জানুন।" },
      { href: "/insights", label: "অন্তর্দৃষ্টি", description: "সম্পত্তি সিদ্ধান্তের ব্যবহারিক বাংলা পাঠ পড়ুন।" },
      { href: "/resources", label: "সহায়িকা", description: "চেকলিস্ট ও প্রস্তুতির কাঠামো ব্যবহার করুন।" },
      { href: "/contact", label: "যোগাযোগ", description: "জয়পুরহাট অফিসের সঙ্গে সরাসরি কথা বলুন।" },
      { href: "/brand-kit", label: "ব্র্যান্ড কিট", description: "লোগো, রঙ ও অনুমোদিত ব্যবহারের নির্দেশিকা দেখুন।" },
    ],
  },
] as const satisfies readonly ExploreNavigationGroup[];

const bengaliProtectedNavigationLinks = [
  { href: "/office", label: "অফিস", description: "অনুমোদিত কর্মীদের সুরক্ষিত কার্যক্রমের জায়গা।" },
  { href: "/studio", label: "স্টুডিও", description: "অনুমোদিত সম্পাদকদের সুরক্ষিত কনটেন্ট কর্মক্ষেত্র।" },
] as const satisfies readonly ExploreNavigationLink[];

export function getExploreNavigationGroups(locale: PublicLocale) {
  const groups = locale === "bn-BD" ? bengaliExploreNavigationGroups : exploreNavigationGroups;
  return groups.map((group) => ({
    ...group,
    links: group.links.map((link) => ({ ...link, href: localizedPublicHref(link.href, locale) })),
  }));
}

export function getProtectedNavigationLinks(locale: PublicLocale) {
  return locale === "bn-BD" ? bengaliProtectedNavigationLinks : protectedNavigationLinks;
}

export function isPathCurrent(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}
import { localizedPublicHref, type PublicLocale } from "@/lib/i18n/public-locale";


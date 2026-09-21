const FALLBACK_SITE_URL = "https://abdullah-properties-joypurhat.zedamorello0079.chatgpt.site";

function toHttpsOrigin(value: string | undefined): string | null {
  if (!value?.trim()) return null;

  try {
    const candidate = value.trim();
    const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * A canonical origin is deliberately an environment concern rather than a
 * source edit. `VERCEL_PROJECT_PRODUCTION_URL` keeps preview and production
 * metadata pointed at one Vercel production host when Vercel system variables
 * are enabled; an explicit public URL always wins for a business custom domain.
 */
function resolveSiteUrl(): string {
  const environment: Record<string, string | undefined> =
    typeof process === "undefined" ? {} : process.env;
  return (
    toHttpsOrigin(environment.NEXT_PUBLIC_SITE_URL) ??
    toHttpsOrigin(environment.SITE_URL) ??
    toHttpsOrigin(environment.VERCEL_PROJECT_PRODUCTION_URL) ??
    toHttpsOrigin(environment.VERCEL_URL) ??
    FALLBACK_SITE_URL
  );
}

export const SITE_URL = resolveSiteUrl();

export const company = {
  name: "Abdullah Properties",
  nameBn: "আব্দুল্লাহ প্রোপার্টিজ",
  slogan: "Your housing base, a total solution point.",
  shortSlogan: "Housing Base Total Solutions",
  description:
    "Joypurhat-focused real estate development, joint-venture housing, land and documentation support, project consultation, and after-sales guidance.",
  email: "abdullahproperties.24@gmail.com",
  phones: [
    { label: "Primary", display: "+880 1735-877654", href: "tel:+8801735877654", e164: "+8801735877654" },
    { label: "Secondary", display: "+880 1955-169930", href: "tel:+8801955169930", e164: "+8801955169930" },
  ],
  whatsapp: "https://wa.me/8801735877654",
  address: {
    line1: "2nd Floor, Pouro Market",
    line2: "Purbo Bazar, Joypurhat",
    country: "Bangladesh",
    locality: "Joypurhat",
    region: "Rajshahi Division",
    countryCode: "BD",
  },
  hours: {
    display: "Saturday–Thursday, 10:00 AM–8:00 PM",
    days: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
    opens: "10:00",
    closes: "20:00",
  },
  areaServed: "Joypurhat, Bangladesh",
} as const;

export const verifiedServiceLines = [
  {
    id: "01",
    title: "Residential development",
    summary: "Planning and development support for residential flats and housing projects in Joypurhat.",
  },
  {
    id: "02",
    title: "Joint-venture housing",
    summary: "A partnership route for landowners and project stakeholders, structured through verified scope and written agreements.",
  },
  {
    id: "03",
    title: "Land & documentation support",
    summary: "Coordination for land review, title and document checks, mutation, registration, and professional legal follow-through.",
  },
  {
    id: "04",
    title: "Project consultation",
    summary: "Early guidance on housing requirements, planning direction, delivery scope, and the evidence needed before commitment.",
  },
  {
    id: "05",
    title: "Design & project planning",
    summary: "Coordination of residential or commercial briefs with architectural, technical, and delivery considerations.",
  },
  {
    id: "06",
    title: "Handover & after-sales",
    summary: "Inspection, document handover, transition guidance, and structured follow-up after project completion.",
  },
] as const;

export const operatingProcess = [
  {
    id: "01",
    title: "Inquiry",
    summary: "Understand the property need, location, intended outcome, budget context, and known constraints.",
  },
  {
    id: "02",
    title: "Site visit",
    summary: "Review the site or project context, access, plans, surroundings, and the questions that require evidence.",
  },
  {
    id: "03",
    title: "Verification & agreement",
    summary: "Coordinate document review, confirm scope, responsibilities, exclusions, commercial terms, and written approvals.",
  },
  {
    id: "04",
    title: "Delivery updates",
    summary: "Track agreed milestones, quality questions, decisions, changes, and supporting records throughout delivery.",
  },
  {
    id: "05",
    title: "Inspection & handover",
    summary: "Complete final review, document transfer, open-item tracking, key handover, and after-sales coordination.",
  },
] as const;

export const companyFaqs = [
  {
    question: "Where is Abdullah Properties located?",
    answer: "The office is on the 2nd Floor of Pouro Market, Purbo Bazar, Joypurhat, Bangladesh.",
  },
  {
    question: "When is the office open?",
    answer: "Published office hours are Saturday through Thursday, 10:00 AM to 8:00 PM.",
  },
  {
    question: "What services does Abdullah Properties provide?",
    answer:
      "The company focuses on residential development, joint-venture housing, land and documentation support, consultation, project planning, and after-sales coordination.",
  },
  {
    question: "How does a new project conversation begin?",
    answer:
      "Start with an inquiry and site visit. Scope and commercial commitments follow only after the relevant property and documents have been checked.",
  },
  {
    question: "Are the images on this website current property listings?",
    answer:
      "Unless a page explicitly says otherwise, project imagery is illustrative brand or design material. Availability, ownership, specifications, pricing, and approvals must be confirmed directly.",
  },
] as const;

export const contentVerification = {
  legacySource: "https://remix-of-demo.vercel.app/",
  reviewedOn: "2026-07-12",
  note:
    "Contact, service, and operating information is migrated from the supplied legacy website. Leadership names, portraits, ratings, rankings, project specifications, coordinates, and performance guarantees are intentionally withheld until approved evidence is supplied.",
} as const;

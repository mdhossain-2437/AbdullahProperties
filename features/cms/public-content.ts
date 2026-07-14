import { getManagedContent, getManagedContentBySlug } from "@/features/cms/repository";
import type { CmsContentEntry, CmsContentType } from "@/features/cms/types";
import { companyFaqs } from "@/lib/company-data";
import { areaGuides as curatedAreaGuides } from "@/lib/experience-data";
import { getInsight as getCuratedInsight, insights as curatedInsights, type Insight } from "@/lib/site-data";

export type PublicInsight = Insight & {
  seoTitle?: string;
  seoDescription?: string;
};

export type PublicAreaGuide = {
  slug: string;
  index: string;
  name: string;
  title: string;
  dek: string;
  updatedAt: string;
  facts: ReadonlyArray<{ title: string; body: string }>;
  seoTitle?: string;
  seoDescription?: string;
};

export type PublicFaq = {
  slug: string;
  question: string;
  answer: string;
};

export type PublicAnnouncement = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
};

type ManagedEntry = Awaited<ReturnType<typeof getManagedContent>>[number];

const seedPrefixByType: Partial<Record<CmsContentType, string>> = {
  insight: "seed-insight-",
  area_guide: "seed-area-",
};

function estimateReadTime(sections: ReadonlyArray<{ heading: string; body: string }>) {
  const words = sections.reduce((total, section) => total + `${section.heading} ${section.body}`.trim().split(/\s+/).length, 0);
  return `${Math.max(2, Math.ceil(words / 190))} min read`;
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function seededSourceSlug(entry: CmsContentEntry) {
  const prefix = seedPrefixByType[entry.type];
  return prefix && entry.id.startsWith(prefix) ? entry.id.slice(prefix.length) : null;
}

function removeManagedFallback<T>(entries: Map<string, T>, entry: CmsContentEntry) {
  const sourceSlug = seededSourceSlug(entry);
  if (sourceSlug) entries.delete(sourceSlug);
  entries.delete(entry.slug);
}

function cmsInsight(entry: ManagedEntry): PublicInsight {
  return {
    slug: entry.slug,
    category: "Property guidance",
    title: entry.title,
    dek: entry.excerpt,
    readTime: estimateReadTime(entry.payload.sections),
    publishedAt: entry.publishedAt ?? entry.createdAt.slice(0, 10),
    updatedAt: entry.updatedAt.slice(0, 10),
    sections: entry.payload.sections,
    seoTitle: entry.seoTitle,
    seoDescription: entry.seoDescription,
  };
}

function cmsAreaGuide(entry: ManagedEntry, index: number): PublicAreaGuide {
  return {
    slug: entry.slug,
    index: `AREA / ${String(index + 1).padStart(2, "0")}`,
    name: entry.title,
    title: entry.title,
    dek: entry.excerpt,
    updatedAt: entry.updatedAt.slice(0, 10),
    facts: entry.payload.sections.map((section) => ({ title: section.heading, body: section.body })),
    seoTitle: entry.seoTitle,
    seoDescription: entry.seoDescription,
  };
}

function cmsFaq(entry: ManagedEntry): PublicFaq {
  return {
    slug: entry.slug,
    question: entry.title,
    answer: entry.payload.sections.map((section) => section.body).join("\n\n") || entry.excerpt,
  };
}

function curatedFaqs(): PublicFaq[] {
  return companyFaqs.map((faq) => ({ slug: slugify(faq.question), question: faq.question, answer: faq.answer }));
}

export async function listPublicInsights(): Promise<readonly PublicInsight[]> {
  const managed = await getManagedContent("insight");
  const bySlug = new Map<string, PublicInsight>(curatedInsights.map((entry) => [entry.slug, entry]));

  for (const entry of managed) {
    removeManagedFallback(bySlug, entry);
    if (entry.status === "published") bySlug.set(entry.slug, cmsInsight(entry));
  }

  return [...bySlug.values()];
}

export async function getPublicInsight(slug: string): Promise<PublicInsight | undefined> {
  const managed = await getManagedContentBySlug("insight", slug);
  if (managed) return managed.status === "published" && managed.slug === slug ? cmsInsight(managed) : undefined;
  return getCuratedInsight(slug);
}

export async function listPublicAreaGuides(): Promise<readonly PublicAreaGuide[]> {
  const curated: PublicAreaGuide[] = curatedAreaGuides.map((guide) => ({ ...guide, facts: guide.facts.map((fact) => ({ ...fact })) }));
  const managed = await getManagedContent("area_guide");
  const bySlug = new Map(curated.map((entry) => [entry.slug, entry]));

  managed.forEach((entry, index) => {
    removeManagedFallback(bySlug, entry);
    if (entry.status === "published") bySlug.set(entry.slug, cmsAreaGuide(entry, index));
  });

  return [...bySlug.values()];
}

export async function getPublicAreaGuide(slug: string): Promise<PublicAreaGuide | undefined> {
  const managed = await getManagedContentBySlug("area_guide", slug);
  if (managed) return managed.status === "published" && managed.slug === slug ? cmsAreaGuide(managed, 0) : undefined;
  const curated = curatedAreaGuides.find((guide) => guide.slug === slug);
  return curated ? { ...curated, facts: curated.facts.map((fact) => ({ ...fact })) } : undefined;
}

export async function listPublicFaqs(): Promise<readonly PublicFaq[]> {
  const managed = await getManagedContent("faq");
  const bySlug = new Map(curatedFaqs().map((entry) => [entry.slug, entry]));

  for (const entry of managed) {
    removeManagedFallback(bySlug, entry);
    if (entry.status === "published") bySlug.set(entry.slug, cmsFaq(entry));
  }

  return [...bySlug.values()];
}

export async function listPublicAnnouncements(): Promise<readonly PublicAnnouncement[]> {
  const managed = await getManagedContent("announcement");
  return managed
    .filter((entry) => entry.status === "published")
    .map((entry) => ({
      slug: entry.slug,
      title: entry.title,
      summary: entry.excerpt,
      publishedAt: entry.publishedAt ?? entry.updatedAt,
    }));
}

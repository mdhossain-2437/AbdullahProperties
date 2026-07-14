import { getD1, getOptionalD1 } from "@/db";
import { areaGuides } from "@/lib/experience-data";
import { insights } from "@/lib/site-data";
import { cmsContentInputSchema, contentPayloadSchema, type CmsContentEntry, type CmsContentInput, type CmsContentType, type CmsRevision } from "@/features/cms/types";

type ContentEntryRow = {
  id: string;
  type: string;
  slug: string;
  title: string;
  excerpt: string;
  payload: string;
  status: string;
  verification: string;
  seo_title: string;
  seo_description: string;
  featured: number;
  published_at: string | null;
  version: number;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

type RevisionRow = {
  id: string;
  entry_id: string;
  version: number;
  snapshot: string;
  actor_email: string;
  created_at: string;
};

const reportedPublicReadFallbacks = new Set<string>();

function reportPublicReadFallback(operation: string, type: CmsContentType, error: unknown) {
  const key = `${operation}:${type}`;
  if (reportedPublicReadFallbacks.has(key)) return;
  reportedPublicReadFallbacks.add(key);

  console.warn("CMS public read fell back to curated content.", {
    operation,
    contentType: type,
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
}

function seededEntryId(type: CmsContentType, slug: string) {
  if (type === "insight") return `seed-insight-${slug}`;
  if (type === "area_guide") return `seed-area-${slug}`;
  return null;
}

function toEntry(row: ContentEntryRow): CmsContentEntry {
  const parsed = cmsContentInputSchema.parse({
    id: row.id,
    type: row.type,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    payload: contentPayloadSchema.parse(JSON.parse(row.payload)),
    status: row.status,
    verification: row.verification,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    featured: row.featured === 1,
    version: row.version,
  });

  return {
    ...parsed,
    id: row.id,
    publishedAt: row.published_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function snapshot(entry: CmsContentEntry) {
  return JSON.stringify(entry);
}

export function isCmsDatabaseAvailable() {
  return getOptionalD1().then((database) => database !== null);
}

export async function listContentEntries(): Promise<CmsContentEntry[]> {
  const result = await (await getD1()).prepare(
    "SELECT id, type, slug, title, excerpt, payload, status, verification, seo_title, seo_description, featured, published_at, version, created_by, updated_by, created_at, updated_at FROM content_entries ORDER BY updated_at DESC",
  ).all<ContentEntryRow>();
  return result.results.map(toEntry);
}

export async function getContentEntry(id: string): Promise<CmsContentEntry | null> {
  const row = await (await getD1()).prepare(
    "SELECT id, type, slug, title, excerpt, payload, status, verification, seo_title, seo_description, featured, published_at, version, created_by, updated_by, created_at, updated_at FROM content_entries WHERE id = ? LIMIT 1",
  ).bind(id).first<ContentEntryRow>();
  return row ? toEntry(row) : null;
}

export async function getManagedContent(type: CmsContentType): Promise<CmsContentEntry[]> {
  const database = await getOptionalD1();
  if (!database) return [];
  try {
    const result = await database.prepare(
      "SELECT id, type, slug, title, excerpt, payload, status, verification, seo_title, seo_description, featured, published_at, version, created_by, updated_by, created_at, updated_at FROM content_entries WHERE type = ? ORDER BY featured DESC, published_at DESC, updated_at DESC",
    ).bind(type).all<ContentEntryRow>();
    return result.results.map(toEntry);
  } catch (error) {
    reportPublicReadFallback("list", type, error);
    return [];
  }
}

export async function getManagedContentBySlug(type: CmsContentType, slug: string): Promise<CmsContentEntry | null> {
  const database = await getOptionalD1();
  if (!database) return null;
  try {
    const sourceId = seededEntryId(type, slug);
    const row = sourceId
      ? await database.prepare(
          "SELECT id, type, slug, title, excerpt, payload, status, verification, seo_title, seo_description, featured, published_at, version, created_by, updated_by, created_at, updated_at FROM content_entries WHERE type = ? AND (slug = ? OR id = ?) ORDER BY CASE WHEN slug = ? THEN 0 ELSE 1 END LIMIT 1",
        ).bind(type, slug, sourceId, slug).first<ContentEntryRow>()
      : await database.prepare(
          "SELECT id, type, slug, title, excerpt, payload, status, verification, seo_title, seo_description, featured, published_at, version, created_by, updated_by, created_at, updated_at FROM content_entries WHERE type = ? AND slug = ? LIMIT 1",
        ).bind(type, slug).first<ContentEntryRow>();
    return row ? toEntry(row) : null;
  } catch (error) {
    reportPublicReadFallback("detail", type, error);
    return null;
  }
}

export async function getPublishedContent(type: CmsContentType): Promise<CmsContentEntry[]> {
  const entries = await getManagedContent(type);
  return entries.filter((entry) => entry.status === "published");
}

export async function getPublishedContentBySlug(type: CmsContentType, slug: string): Promise<CmsContentEntry | null> {
  const entry = await getManagedContentBySlug(type, slug);
  return entry?.status === "published" && entry.slug === slug ? entry : null;
}

export async function listContentRevisions(entryId: string): Promise<CmsRevision[]> {
  const result = await (await getD1()).prepare(
    "SELECT id, entry_id, version, snapshot, actor_email, created_at FROM content_revisions WHERE entry_id = ? ORDER BY version DESC",
  ).bind(entryId).all<RevisionRow>();
  return result.results.map((row) => ({ id: row.id, entryId: row.entry_id, version: row.version, snapshot: row.snapshot, actorEmail: row.actor_email, createdAt: row.created_at }));
}

export async function createContentEntry(input: CmsContentInput, actorEmail: string) {
  const database = await getD1();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const entry: CmsContentEntry = {
    ...input,
    id,
    version: 1,
    publishedAt: input.status === "published" ? now : null,
    createdBy: actorEmail,
    updatedBy: actorEmail,
    createdAt: now,
    updatedAt: now,
  };

  await database.batch([
    database.prepare("INSERT INTO content_entries (id, type, slug, title, excerpt, payload, status, verification, seo_title, seo_description, featured, published_at, version, created_by, updated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(entry.id, entry.type, entry.slug, entry.title, entry.excerpt, JSON.stringify(entry.payload), entry.status, entry.verification, entry.seoTitle, entry.seoDescription, entry.featured ? 1 : 0, entry.publishedAt, entry.version, actorEmail, actorEmail, now, now),
    database.prepare("INSERT INTO content_revisions (id, entry_id, version, snapshot, actor_email, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), id, 1, snapshot(entry), actorEmail, now),
    database.prepare("INSERT INTO audit_events (id, actor_email, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), actorEmail, "content.created", "content_entry", id, JSON.stringify({ status: entry.status, verification: entry.verification, type: entry.type, slug: entry.slug }), now),
  ]);
  return entry;
}

export async function updateContentEntry(input: CmsContentInput & { id: string }, actorEmail: string) {
  const database = await getD1();
  const current = await getContentEntry(input.id);
  if (!current || current.version !== input.version) return null;

  const now = new Date().toISOString();
  const nextVersion = current.version + 1;
  const entry: CmsContentEntry = {
    ...input,
    version: nextVersion,
    publishedAt: input.status === "published" ? current.publishedAt ?? now : null,
    createdBy: current.createdBy,
    updatedBy: actorEmail,
    createdAt: current.createdAt,
    updatedAt: now,
  };

  try {
    await database.batch([
      database.prepare("UPDATE content_entries SET type = ?, slug = ?, title = ?, excerpt = ?, payload = ?, status = ?, verification = ?, seo_title = ?, seo_description = ?, featured = ?, published_at = ?, version = ?, updated_by = ?, updated_at = ? WHERE id = ? AND version = ?")
        .bind(entry.type, entry.slug, entry.title, entry.excerpt, JSON.stringify(entry.payload), entry.status, entry.verification, entry.seoTitle, entry.seoDescription, entry.featured ? 1 : 0, entry.publishedAt, nextVersion, actorEmail, now, entry.id, current.version),
      database.prepare("INSERT INTO content_revisions (id, entry_id, version, snapshot, actor_email, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(crypto.randomUUID(), entry.id, nextVersion, snapshot(entry), actorEmail, now),
      database.prepare("INSERT INTO audit_events (id, actor_email, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(crypto.randomUUID(), actorEmail, "content.updated", "content_entry", entry.id, JSON.stringify({ fromStatus: current.status, toStatus: entry.status, fromVerification: current.verification, toVerification: entry.verification, version: nextVersion }), now),
    ]);
    return entry;
  } catch (error) {
    if (error instanceof Error && /content_revisions_entry_version_unique|UNIQUE constraint/i.test(error.message)) return null;
    throw error;
  }
}

export async function seedCuratedContent(actorEmail: string) {
  const database = await getD1();
  const now = new Date().toISOString();
  const curated: CmsContentEntry[] = [
    ...insights.map((insight) => ({
      id: `seed-insight-${insight.slug}`,
      type: "insight" as const,
      slug: insight.slug,
      title: insight.title,
      excerpt: insight.dek,
      payload: { sections: insight.sections.map((section) => ({ ...section })) },
      status: "published" as const,
      verification: "source_reviewed" as const,
      seoTitle: insight.title.slice(0, 70),
      seoDescription: insight.dek.slice(0, 170),
      featured: false,
      version: 1,
      publishedAt: insight.publishedAt,
      createdBy: actorEmail,
      updatedBy: actorEmail,
      createdAt: insight.publishedAt,
      updatedAt: insight.updatedAt,
    })),
    ...areaGuides.map((guide) => ({
      id: `seed-area-${guide.slug}`,
      type: "area_guide" as const,
      slug: guide.slug,
      title: guide.title,
      excerpt: guide.dek,
      payload: { sections: guide.facts.map((fact) => ({ heading: fact.title, body: fact.body })) },
      status: "published" as const,
      verification: "source_reviewed" as const,
      seoTitle: guide.title.slice(0, 70),
      seoDescription: guide.dek.slice(0, 170),
      featured: false,
      version: 1,
      publishedAt: guide.updatedAt,
      createdBy: actorEmail,
      updatedBy: actorEmail,
      createdAt: guide.updatedAt,
      updatedAt: guide.updatedAt,
    })),
  ];

  let createdCount = 0;

  for (const entry of curated) {
    const existing = await database.prepare(
      "SELECT id FROM content_entries WHERE type = ? AND slug = ? LIMIT 1",
    ).bind(entry.type, entry.slug).first<{ id: string }>();
    if (existing) continue;

    try {
      await database.batch([
        database.prepare("INSERT INTO content_entries (id, type, slug, title, excerpt, payload, status, verification, seo_title, seo_description, featured, published_at, version, created_by, updated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .bind(entry.id, entry.type, entry.slug, entry.title, entry.excerpt, JSON.stringify(entry.payload), entry.status, entry.verification, entry.seoTitle, entry.seoDescription, entry.featured ? 1 : 0, entry.publishedAt, entry.version, actorEmail, actorEmail, entry.createdAt, entry.updatedAt),
        database.prepare("INSERT INTO content_revisions (id, entry_id, version, snapshot, actor_email, created_at) VALUES (?, ?, ?, ?, ?, ?)")
          .bind(`revision-${entry.id}-1`, entry.id, 1, snapshot(entry), actorEmail, now),
      ]);
      createdCount += 1;
    } catch (error) {
      if (error instanceof Error && /UNIQUE constraint/i.test(error.message)) continue;
      throw error;
    }
  }

  await database.prepare("INSERT INTO audit_events (id, actor_email, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), actorEmail, "content.seeded", "content_collection", "curated-content", JSON.stringify({ attempted: curated.length, created: createdCount }), now)
    .run();
  return createdCount;
}

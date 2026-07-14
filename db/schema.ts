import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const contentEntries = sqliteTable(
  "content_entries",
  {
    id: text("id").primaryKey(),
    type: text("type", { enum: ["insight", "area_guide", "faq", "announcement"] }).notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(),
    payload: text("payload").notNull(),
    status: text("status", { enum: ["draft", "in_review", "published", "archived"] }).notNull().default("draft"),
    verification: text("verification", { enum: ["editorial", "source_reviewed", "owner_approved"] }).notNull().default("editorial"),
    seoTitle: text("seo_title").notNull(),
    seoDescription: text("seo_description").notNull(),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    publishedAt: text("published_at"),
    version: integer("version").notNull().default(1),
    createdBy: text("created_by").notNull(),
    updatedBy: text("updated_by").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("content_entries_type_slug_unique").on(table.type, table.slug),
    index("content_entries_publication_idx").on(table.type, table.status, table.publishedAt),
    index("content_entries_featured_idx").on(table.status, table.featured, table.publishedAt),
  ],
);

export const contentRevisions = sqliteTable(
  "content_revisions",
  {
    id: text("id").primaryKey(),
    entryId: text("entry_id").notNull().references(() => contentEntries.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    snapshot: text("snapshot").notNull(),
    actorEmail: text("actor_email").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("content_revisions_entry_version_unique").on(table.entryId, table.version)],
);

export const auditEvents = sqliteTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    actorEmail: text("actor_email").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    metadata: text("metadata").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("audit_events_entity_created_idx").on(table.entityType, table.entityId, table.createdAt)],
);

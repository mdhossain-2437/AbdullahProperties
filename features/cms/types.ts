import { z } from "zod";

export const contentTypeSchema = z.enum(["insight", "area_guide", "faq", "announcement"]);
export const contentStatusSchema = z.enum(["draft", "in_review", "published", "archived"]);
export const verificationSchema = z.enum(["editorial", "source_reviewed", "owner_approved"]);

export const contentSectionSchema = z.object({
  heading: z.string().trim().min(3, "Section headings need at least 3 characters.").max(120),
  body: z.string().trim().min(20, "Section body needs at least 20 characters.").max(2000),
});

export const contentPayloadSchema = z.object({
  sections: z.array(contentSectionSchema).min(1, "Add at least one complete section.").max(8),
});

export const cmsContentInputSchema = z.object({
  id: z.string().trim().min(1).max(80).optional(),
  type: contentTypeSchema,
  slug: z.string().trim().min(3).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
  title: z.string().trim().min(8).max(140),
  excerpt: z.string().trim().min(20).max(320),
  payload: contentPayloadSchema,
  status: contentStatusSchema,
  verification: verificationSchema,
  seoTitle: z.string().trim().min(8).max(70),
  seoDescription: z.string().trim().min(40).max(170),
  featured: z.boolean(),
  version: z.number().int().positive().default(1),
});

export type CmsContentType = z.infer<typeof contentTypeSchema>;
export type CmsContentStatus = z.infer<typeof contentStatusSchema>;
export type CmsVerification = z.infer<typeof verificationSchema>;
export type CmsContentPayload = z.infer<typeof contentPayloadSchema>;
export type CmsContentInput = z.infer<typeof cmsContentInputSchema>;

export type CmsContentEntry = CmsContentInput & {
  id: string;
  publishedAt: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CmsRevision = {
  id: string;
  entryId: string;
  version: number;
  snapshot: string;
  actorEmail: string;
  createdAt: string;
};

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function parseCmsContentForm(formData: FormData) {
  const headings = formData.getAll("sectionHeading").map((value) => typeof value === "string" ? value.trim() : "");
  const bodies = formData.getAll("sectionBody").map((value) => typeof value === "string" ? value.trim() : "");
  const sections = headings
    .map((heading, index) => ({ heading, body: bodies[index] ?? "" }))
    .filter((section) => section.heading.length > 0 || section.body.length > 0);

  return cmsContentInputSchema.safeParse({
    id: formValue(formData, "id") || undefined,
    type: formValue(formData, "type"),
    slug: formValue(formData, "slug"),
    title: formValue(formData, "title"),
    excerpt: formValue(formData, "excerpt"),
    payload: { sections },
    status: formValue(formData, "status"),
    verification: formValue(formData, "verification"),
    seoTitle: formValue(formData, "seoTitle"),
    seoDescription: formValue(formData, "seoDescription"),
    featured: formData.get("featured") === "on",
    version: Number(formValue(formData, "version") || "1"),
  });
}

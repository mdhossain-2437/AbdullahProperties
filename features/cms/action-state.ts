/**
 * Serializable state exchanged between the Content Studio client form and its
 * server action. Keeping data here (rather than in the `"use server"` module)
 * satisfies Next.js' server-action export contract on every supported host.
 */
export type CmsFormField =
  | "type"
  | "slug"
  | "title"
  | "excerpt"
  | "sections"
  | "status"
  | "verification"
  | "seoTitle"
  | "seoDescription";

export type CmsActionState = {
  status: "idle" | "error" | "success";
  message: string;
  entryId?: string;
  version?: number;
  fieldErrors?: Partial<Record<CmsFormField, string>>;
};

export const initialCmsActionState: CmsActionState = {
  status: "idle",
  message: "",
};

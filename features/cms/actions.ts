"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthorizedCmsActor } from "@/features/cms/auth";
import { createContentEntry, getContentEntry, seedCuratedContent, updateContentEntry } from "@/features/cms/repository";
import { parseCmsContentForm, type CmsContentType } from "@/features/cms/types";
import { validateCmsSubmission, validateCmsTransition } from "@/features/cms/workflow";

export type CmsActionState = {
  status: "idle" | "error" | "success";
  message: string;
  entryId?: string;
  version?: number;
  fieldErrors?: Partial<Record<CmsFormField, string>>;
};

export const initialCmsActionState: CmsActionState = { status: "idle", message: "" };

type CmsFormField = "type" | "slug" | "title" | "excerpt" | "sections" | "status" | "verification" | "seoTitle" | "seoDescription";

function revalidateContentPaths(type: CmsContentType, slug: string) {
  revalidatePath("/");
  revalidatePath("/studio");
  if (type === "insight") {
    revalidatePath("/insights");
    revalidatePath(`/insights/${slug}`);
  }
  if (type === "area_guide") {
    revalidatePath("/area-guides");
    revalidatePath(`/area-guides/${slug}`);
  }
  if (type === "faq") revalidatePath("/faq");
}

function submittedIdentity(previous: CmsActionState, formData: FormData) {
  const submittedId = formData.get("id");
  const submittedVersion = Number(formData.get("version"));
  return {
    entryId: typeof submittedId === "string" && submittedId.length > 0 ? submittedId : previous.entryId,
    version: Number.isInteger(submittedVersion) && submittedVersion > 0 ? submittedVersion : previous.version,
  };
}

function formFieldErrors(issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>) {
  const errors: Partial<Record<CmsFormField, string>> = {};
  for (const issue of issues) {
    const root = String(issue.path[0] ?? "");
    const field: CmsFormField | null = root === "payload" ? "sections" : (
      ["type", "slug", "title", "excerpt", "status", "verification", "seoTitle", "seoDescription"] as const
    ).find((candidate) => candidate === root) ?? null;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}

function actionError(message: string, identity: ReturnType<typeof submittedIdentity>, fieldErrors?: CmsActionState["fieldErrors"]): CmsActionState {
  return { status: "error", message, ...identity, fieldErrors };
}

export async function saveContentAction(previous: CmsActionState, formData: FormData): Promise<CmsActionState> {
  const identity = submittedIdentity(previous, formData);
  const actor = await getAuthorizedCmsActor();
  if (!actor) return actionError("Your session is not authorized to change content.", identity);

  const parsed = parseCmsContentForm(formData);
  if (!parsed.success) {
    const message = parsed.error.issues.slice(0, 4).map((issue) => issue.message).join(" ");
    return actionError(message || "Review the highlighted content fields.", identity, formFieldErrors(parsed.error.issues));
  }

  const input = parsed.data;
  const submissionError = validateCmsSubmission(actor.role, input.type, input.status, input.verification);
  if (submissionError) {
    return actionError(submissionError.message, identity, { [submissionError.field]: submissionError.message });
  }

  try {
    if (!input.id) {
      if (input.status === "published") {
        return actionError("New content must pass through draft or review before publication.", identity, { status: "Save as draft or in review first." });
      }
      const created = await createContentEntry(input, actor.email);
      revalidateContentPaths(created.type, created.slug);
      return { status: "success", message: "Draft saved with revision 1.", entryId: created.id, version: created.version };
    }

    const current = await getContentEntry(input.id);
    if (!current) return actionError("This entry no longer exists.", identity);
    const transitionError = validateCmsTransition(actor.role, current.status, input.status);
    if (transitionError) {
      return actionError(transitionError.message, identity, { [transitionError.field]: transitionError.message });
    }
    const updated = await updateContentEntry({ ...input, id: input.id }, actor.email);
    if (!updated) return actionError("A newer revision was saved first. Reload before applying your changes.", identity);
    revalidateContentPaths(current.type, current.slug);
    revalidateContentPaths(updated.type, updated.slug);
    return { status: "success", message: `Revision ${updated.version} saved as ${updated.status.replace("_", " ")}.`, entryId: updated.id, version: updated.version };
  } catch (error) {
    if (error instanceof Error && /content_entries_type_slug_unique|UNIQUE constraint/i.test(error.message)) {
      return actionError("That content type already uses this slug.", identity, { slug: "Choose a unique slug for this content type." });
    }
    return actionError("The content could not be saved. No partial revision was published.", identity);
  }
}

export async function seedCuratedContentAction() {
  const actor = await getAuthorizedCmsActor();
  if (!actor) redirect("/studio?access=denied");
  if (actor.role !== "owner") redirect("/studio?access=owner-required");
  await seedCuratedContent(actor.email);
  revalidatePath("/");
  revalidatePath("/insights");
  revalidatePath("/area-guides");
  revalidatePath("/studio");
  redirect("/studio?seeded=1");
}

import type { CmsRole } from "@/features/cms/auth";
import type { CmsContentStatus, CmsContentType, CmsVerification } from "@/features/cms/types";

export type CmsWorkflowError = {
  field: "status" | "verification";
  message: string;
};

const allowedTransitions: Record<CmsContentStatus, readonly CmsContentStatus[]> = {
  draft: ["draft", "in_review", "archived"],
  in_review: ["draft", "in_review", "published", "archived"],
  published: ["published", "archived"],
  archived: ["draft", "in_review", "archived"],
};

export function validateCmsSubmission(role: CmsRole, type: CmsContentType, status: CmsContentStatus, verification: CmsVerification): CmsWorkflowError | null {
  if (verification === "owner_approved" && role !== "owner") {
    return { field: "verification", message: "Only an owner can record owner approval." };
  }
  if (status !== "published") return null;
  if (role !== "owner") return { field: "status", message: "Only an owner can publish content." };
  if (verification === "editorial") {
    return { field: "verification", message: "Published entries must be source reviewed or owner approved." };
  }
  if ((type === "faq" || type === "announcement") && verification !== "owner_approved") {
    return { field: "verification", message: "FAQ and announcement entries require owner approval before publication." };
  }
  return null;
}

export function validateCmsTransition(role: CmsRole, current: CmsContentStatus, next: CmsContentStatus): CmsWorkflowError | null {
  if (current === "published" && role !== "owner") {
    return { field: "status", message: "Published entries are read-only for editors. Ask an owner to create the next revision." };
  }
  if (!allowedTransitions[current].includes(next)) {
    return { field: "status", message: `The workflow cannot move directly from ${current} to ${next}.` };
  }
  return null;
}

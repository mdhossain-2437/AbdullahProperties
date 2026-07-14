import assert from "node:assert/strict";
import test from "node:test";
import { validateCmsSubmission, validateCmsTransition } from "../features/cms/workflow.ts";

test("keeps owner approval and publication owner-only", () => {
  assert.match(
    validateCmsSubmission("editor", "insight", "in_review", "owner_approved")?.message ?? "",
    /Only an owner/,
  );
  assert.match(
    validateCmsSubmission("editor", "insight", "published", "source_reviewed")?.message ?? "",
    /Only an owner can publish/,
  );
  assert.equal(validateCmsSubmission("owner", "insight", "published", "source_reviewed"), null);
});

test("requires explicit owner approval for FAQs and announcements", () => {
  for (const type of ["faq", "announcement"]) {
    assert.match(
      validateCmsSubmission("owner", type, "published", "source_reviewed")?.message ?? "",
      /require owner approval/,
    );
    assert.equal(validateCmsSubmission("owner", type, "published", "owner_approved"), null);
  }
});

test("enforces guarded workflow transitions", () => {
  assert.match(validateCmsTransition("owner", "draft", "published")?.message ?? "", /cannot move directly/);
  assert.match(validateCmsTransition("editor", "published", "archived")?.message ?? "", /read-only for editors/);
  assert.equal(validateCmsTransition("owner", "published", "archived"), null);
  assert.equal(validateCmsTransition("editor", "draft", "in_review"), null);
});

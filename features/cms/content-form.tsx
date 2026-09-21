"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, ExternalLink, Save, ShieldCheck } from "lucide-react";
import { saveContentAction } from "@/features/cms/actions";
import { initialCmsActionState } from "@/features/cms/action-state";
import type { CmsRole } from "@/features/cms/auth";
import type { CmsContentEntry } from "@/features/cms/types";

type ContentFormProps = {
  entry?: CmsContentEntry | null;
  role: CmsRole;
};

function SubmitButton({ readOnly }: { readOnly: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="studio-button studio-button--primary" type="submit" disabled={pending || readOnly}>
      <Save aria-hidden="true" />
      {readOnly ? "Owner required" : pending ? "Saving revision…" : "Save revision"}
    </button>
  );
}

export function ContentForm({ entry, role }: ContentFormProps) {
  const [state, formAction] = useActionState(saveContentAction, initialCmsActionState);
  const summaryRef = useRef<HTMLDivElement>(null);
  const readOnly = role === "editor" && entry?.status === "published";
  const savedEntryId = state.entryId ?? entry?.id ?? "";
  const savedVersion = state.version ?? entry?.version ?? 1;
  const verification = role === "editor" && entry?.verification === "owner_approved" ? "source_reviewed" : entry?.verification ?? "editorial";
  const sections = entry?.payload.sections.length ? entry.payload.sections : [
    { heading: "", body: "" }, { heading: "", body: "" }, { heading: "", body: "" },
  ];

  useEffect(() => {
    if (state.status !== "idle") summaryRef.current?.focus();
  }, [state.message, state.status, state.version]);

  const invalid = (field: keyof NonNullable<typeof state.fieldErrors>) => Boolean(state.fieldErrors?.[field]);
  const describedBy = (field: keyof NonNullable<typeof state.fieldErrors>) => invalid(field) ? "cms-form-summary" : undefined;

  return (
    <form action={formAction} className="studio-form" noValidate>
      <input type="hidden" name="id" value={savedEntryId} />
      <input type="hidden" name="version" value={savedVersion} />

      {state.status !== "idle" && (
        <div id="cms-form-summary" ref={summaryRef} className={`studio-alert studio-alert--${state.status}`} role={state.status === "error" ? "alert" : "status"} tabIndex={-1}>
          {state.status === "success" ? <CheckCircle2 aria-hidden="true" /> : <AlertCircle aria-hidden="true" />}
          <div>
            <strong>{state.status === "success" ? "Saved" : "Could not save"}</strong>
            <p>{state.message}</p>
            {state.entryId && !entry ? <Link href={`/studio/content/${state.entryId}`}>Open the saved entry <ExternalLink aria-hidden="true" /></Link> : null}
          </div>
        </div>
      )}

      {role === "editor" ? (
        <aside className="studio-alert" aria-label="Editor permissions">
          <ShieldCheck aria-hidden="true" />
          <div>
            <strong>{readOnly ? "Published entry is read-only" : "Editor workflow"}</strong>
            <p>{readOnly ? "Only an owner can revise or archive published content." : "Editors can prepare drafts and reviews. Owner approval and publication remain owner-only actions."}</p>
          </div>
        </aside>
      ) : null}

      <fieldset className="studio-panel" disabled={readOnly}>
        <legend>Entry identity</legend>
        <div className="studio-form__grid">
          <label>
            <span>Content type</span>
            <select name="type" defaultValue={entry?.type ?? "insight"} aria-invalid={invalid("type")} aria-describedby={describedBy("type")}>
              <option value="insight">Insight</option><option value="area_guide">Area guide</option><option value="faq">FAQ</option><option value="announcement">Announcement</option>
            </select>
          </label>
          <label>
            <span>Slug</span>
            <input name="slug" defaultValue={entry?.slug ?? ""} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="joypurhat-property-guide" aria-invalid={invalid("slug")} aria-describedby={describedBy("slug")} />
          </label>
          <label className="studio-form__wide">
            <span>Title</span>
            <input name="title" defaultValue={entry?.title ?? ""} required minLength={8} maxLength={140} aria-invalid={invalid("title")} aria-describedby={describedBy("title")} />
          </label>
          <label className="studio-form__wide">
            <span>Excerpt</span>
            <textarea name="excerpt" defaultValue={entry?.excerpt ?? ""} required minLength={20} maxLength={320} rows={3} aria-invalid={invalid("excerpt")} aria-describedby={describedBy("excerpt")} />
          </label>
        </div>
      </fieldset>

      <fieldset className="studio-panel" disabled={readOnly} aria-invalid={invalid("sections")} aria-describedby={describedBy("sections")}>
        <legend>Structured content</legend>
        <p className="studio-panel__note">Only structured text blocks are accepted; arbitrary HTML and scripts are never stored.</p>
        <div className="studio-sections">
          {sections.map((section, index) => (
            <div className="studio-section-editor" key={`${entry?.id ?? "new"}-${index}`}>
              <span>Block {String(index + 1).padStart(2, "0")}</span>
              <label><span>Heading</span><input name="sectionHeading" defaultValue={section.heading} aria-invalid={invalid("sections")} aria-describedby={describedBy("sections")} /></label>
              <label><span>Body</span><textarea name="sectionBody" defaultValue={section.body} rows={6} aria-invalid={invalid("sections")} aria-describedby={describedBy("sections")} /></label>
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="studio-panel" disabled={readOnly}>
        <legend>Workflow & search</legend>
        <div className="studio-form__grid">
          <label>
            <span>Status</span>
            <select name="status" defaultValue={entry?.status ?? "draft"} aria-invalid={invalid("status")} aria-describedby={describedBy("status")}>
              <option value="draft">Draft</option><option value="in_review">In review</option>
              {role === "owner" ? <option value="published">Published</option> : entry?.status === "published" ? <option value="published" disabled>Published — owner only</option> : null}
              <option value="archived">Archived</option>
            </select>
          </label>
          <label>
            <span>Verification</span>
            <select name="verification" defaultValue={verification} aria-invalid={invalid("verification")} aria-describedby={describedBy("verification")}>
              <option value="editorial">Editorial</option><option value="source_reviewed">Source reviewed</option>
              {role === "owner" ? <option value="owner_approved">Owner approved</option> : null}
            </select>
          </label>
          <label className="studio-form__wide">
            <span>SEO title</span>
            <input name="seoTitle" defaultValue={entry?.seoTitle ?? ""} required minLength={8} maxLength={70} aria-invalid={invalid("seoTitle")} aria-describedby={describedBy("seoTitle")} />
          </label>
          <label className="studio-form__wide">
            <span>SEO description</span>
            <textarea name="seoDescription" defaultValue={entry?.seoDescription ?? ""} required minLength={40} maxLength={170} rows={3} aria-invalid={invalid("seoDescription")} aria-describedby={describedBy("seoDescription")} />
          </label>
          <label className="studio-check"><input type="checkbox" name="featured" defaultChecked={entry?.featured ?? false} /><span>Feature this entry in eligible editorial placements</span></label>
        </div>
      </fieldset>

      <div className="studio-form__actions"><SubmitButton readOnly={readOnly} /><Link className="studio-button" href="/studio">Return to dashboard</Link></div>
    </form>
  );
}

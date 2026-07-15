"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FileCheck2, Send } from "lucide-react";
import { OfficeActionFeedback } from "@/components/office/action-feedback";
import type { OfficeActionState } from "@/features/office/actions";
import {
  createOfficeNoticeAction,
  issueOfficeNoticeAction,
} from "@/features/office/notices/actions";

type NoticeOption = Readonly<{
  id: string;
  label: string;
  detail: string;
}>;

const initialState: OfficeActionState = { status: "idle", message: "" };

function FieldError({ message }: { message?: string }) {
  return message ? <span className="office-field-error">{message}</span> : null;
}

export function OfficeNoticeForm({
  contacts,
  projects,
  issueDate,
}: {
  contacts: readonly NoticeOption[];
  projects: readonly NoticeOption[];
  issueDate: string;
}) {
  const [state, action, pending] = useActionState(createOfficeNoticeAction, initialState);

  return (
    <form className="office-form" action={action} noValidate>
      <OfficeActionFeedback state={state} />
      {state.createdId ? (
        <Link className="office-button office-button--accent" href={`/office/notices/${state.createdId}`}>
          Review created notice <FileCheck2 aria-hidden="true" />
        </Link>
      ) : null}

      <fieldset className="office-form-section" disabled={pending}>
        <legend>Notice purpose</legend>
        <p className="office-form-section__note">
          Save plain, reviewable language. Issuing later assigns the controlled number and verification code.
        </p>
        <div className="office-form-grid">
          <label>
            <span>Notice type</span>
            <select name="kind" defaultValue="general">
              <option value="general">General notice</option>
              <option value="payment_reminder">Payment reminder</option>
              <option value="project_update">Project update</option>
              <option value="appointment">Appointment</option>
              <option value="handover">Handover</option>
              <option value="other">Other</option>
            </select>
            <FieldError message={state.fieldErrors?.kind} />
          </label>
          <label>
            <span>Document language</span>
            <select name="locale" defaultValue="bn">
              <option value="bn">বাংলা</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="office-field--wide">
            <span>Title</span>
            <input name="title" required minLength={3} maxLength={180} placeholder="A clear subject for the recipient" />
            <FieldError message={state.fieldErrors?.title} />
          </label>
          <label className="office-field--wide">
            <span>Notice content</span>
            <textarea
              name="body"
              required
              minLength={10}
              maxLength={12_000}
              rows={12}
              placeholder="Write the final notice in clear, respectful language. Use a blank line between paragraphs."
            />
            <FieldError message={state.fieldErrors?.body} />
          </label>
        </div>
      </fieldset>

      <fieldset className="office-form-section" disabled={pending}>
        <legend>Recipient and record context</legend>
        <p className="office-form-section__note">
          Leave the recipient empty only for general circulation. Payment reminders always require a named contact.
        </p>
        <div className="office-form-grid">
          <label>
            <span>Recipient <small>optional</small></span>
            <select name="contactId" defaultValue="">
              <option value="">General circulation</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>{contact.label} · {contact.detail}</option>
              ))}
            </select>
            <FieldError message={state.fieldErrors?.contactId} />
          </label>
          <label>
            <span>Project <small>optional</small></span>
            <select name="projectId" defaultValue="">
              <option value="">No linked project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.detail} · {project.label}</option>
              ))}
            </select>
            <FieldError message={state.fieldErrors?.projectId} />
          </label>
          <label>
            <span>Issue date</span>
            <input name="issueDate" type="date" defaultValue={issueDate} />
            <FieldError message={state.fieldErrors?.issueDate} />
          </label>
          <label>
            <span>Effective date <small>optional</small></span>
            <input name="effectiveDate" type="date" />
            <FieldError message={state.fieldErrors?.effectiveDate} />
          </label>
          <label>
            <span>Valid until <small>optional</small></span>
            <input name="expiresAt" type="date" />
            <FieldError message={state.fieldErrors?.expiresAt} />
          </label>
        </div>
      </fieldset>

      <div className="office-form-actions">
        <span className="office-form-note">Creating a draft does not send or publish it.</span>
        <button className="office-button office-button--accent" type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create notice draft"}
        </button>
      </div>
    </form>
  );
}

export function OfficeIssueNoticeForm({
  noticeId,
  version,
  fiscalYear,
}: {
  noticeId: string;
  version: number;
  fiscalYear: string;
}) {
  const [state, action, pending] = useActionState(issueOfficeNoticeAction, initialState);
  return (
    <form className="office-inline-form office-print-hide" action={action}>
      <input type="hidden" name="noticeId" value={noticeId} />
      <input type="hidden" name="version" value={version} />
      <input type="hidden" name="fiscalYear" value={fiscalYear} />
      <input type="hidden" name="branchCode" value="JOY" />
      <OfficeActionFeedback state={state} />
      <p>
        Issuing locks this version, assigns the next controlled notice number, and activates privacy-preserving verification. It does not send email or SMS.
      </p>
      <button className="office-button office-button--accent" type="submit" disabled={pending}>
        <Send aria-hidden="true" /> {pending ? "Issuing…" : "Issue controlled notice"}
      </button>
    </form>
  );
}

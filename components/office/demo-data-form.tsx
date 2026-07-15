"use client";

import { useActionState } from "react";
import { FlaskConical } from "lucide-react";
import { OfficeActionFeedback } from "@/components/office/action-feedback";
import { initialOfficeActionState } from "@/features/office/actions";
import { OFFICE_DEMO_CONFIRMATION } from "@/features/office/demo-data-contract";
import { loadOfficeDemoDataAction } from "@/features/office/demo-data-action";

export function OfficeDemoDataForm({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState(loadOfficeDemoDataAction, initialOfficeActionState);
  return (
    <form className="office-form" action={action}>
      <OfficeActionFeedback state={state} />
      <label>
        <span>Confirmation phrase</span>
        <input name="confirmation" autoComplete="off" placeholder={OFFICE_DEMO_CONFIRMATION} disabled={!enabled || pending} aria-invalid={Boolean(state.fieldErrors?.confirmation)} />
        <small>Creates only clearly marked fictional records; no live phone number or deliverable email address is included.</small>
        {state.fieldErrors?.confirmation ? <span className="office-field-error">{state.fieldErrors.confirmation}</span> : null}
      </label>
      <div className="office-form-actions">
        <span className="office-form-note">The seed can be run again safely; existing exact [DEMO] records are reused.</span>
        <button className="office-button office-button--accent" type="submit" disabled={!enabled || pending}>
          <FlaskConical aria-hidden="true" /> {pending ? "Loading…" : "Load demo dataset"}
        </button>
      </div>
    </form>
  );
}

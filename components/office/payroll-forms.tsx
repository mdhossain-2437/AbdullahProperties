"use client";

import { useActionState } from "react";
import { OfficeActionFeedback } from "@/components/office/action-feedback";
import { initialOfficeActionState, type OfficeActionState } from "@/features/office/actions";
import {
  approvePayrollRunAction,
  createPayrollEmployeeAction,
  createPayrollRunAction,
  postPayrollRunAction,
  submitPayrollRunAction,
} from "@/features/office/payroll/actions";
import type { OfficePayrollRunStatus } from "@/features/office/payroll/types";

type MemberOption = Readonly<{ id: string; label: string }>;
type TransitionAction = (
  previous: OfficeActionState,
  formData: FormData,
) => Promise<OfficeActionState>;

function fieldError(state: OfficeActionState, name: string) {
  const message = state.fieldErrors?.[name];
  return message ? <small className="office-field-error">{message}</small> : null;
}

export function PayrollEmployeeForm({
  members,
  joinDate,
}: {
  members: readonly MemberOption[];
  joinDate: string;
}) {
  const [state, action, pending] = useActionState(
    createPayrollEmployeeAction,
    initialOfficeActionState,
  );

  return (
    <form className="office-form" action={action}>
      <OfficeActionFeedback state={state} />
      <fieldset className="office-form-section" disabled={pending}>
        <legend>Employment record</legend>
        <p className="office-form-section__note">
          Link a workspace member only when this employee also needs Office OS access. Payroll
          identity remains separate from login identity.
        </p>
        <div className="office-form-grid">
          <label>
            <span>Employee code</span>
            <input name="employeeCode" required maxLength={32} placeholder="AP-001" aria-invalid={Boolean(state.fieldErrors?.employeeCode)} />
            {fieldError(state, "employeeCode")}
          </label>
          <label>
            <span>Employee name</span>
            <input name="displayName" required maxLength={120} autoComplete="name" aria-invalid={Boolean(state.fieldErrors?.displayName)} />
            {fieldError(state, "displayName")}
          </label>
          <label>
            <span>Designation</span>
            <input name="designation" required maxLength={120} placeholder="Property consultant" aria-invalid={Boolean(state.fieldErrors?.designation)} />
            {fieldError(state, "designation")}
          </label>
          <label>
            <span>Department</span>
            <input name="department" required maxLength={120} placeholder="Sales & client care" aria-invalid={Boolean(state.fieldErrors?.department)} />
            {fieldError(state, "department")}
          </label>
          <label>
            <span>Employment type</span>
            <select name="employmentType" defaultValue="permanent" aria-invalid={Boolean(state.fieldErrors?.employmentType)}>
              <option value="permanent">Permanent</option>
              <option value="probation">Probation</option>
              <option value="contract">Contract</option>
              <option value="part_time">Part time</option>
            </select>
            {fieldError(state, "employmentType")}
          </label>
          <label>
            <span>Join date</span>
            <input name="joinDate" type="date" required defaultValue={joinDate} aria-invalid={Boolean(state.fieldErrors?.joinDate)} />
            {fieldError(state, "joinDate")}
          </label>
          <label className="office-field--wide">
            <span>Linked Office OS member (optional)</span>
            <select name="memberId" defaultValue="">
              <option value="">No login identity linked</option>
              {members.map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className="office-form-section" disabled={pending}>
        <legend>Effective compensation</legend>
        <p className="office-form-section__note">
          Values are contractual configuration, not statutory advice. No tax, provident-fund,
          overtime, or Bangladesh regulatory rate is inserted automatically.
        </p>
        <div className="office-form-grid">
          <label>
            <span>Monthly base salary</span>
            <input name="baseSalary" required inputMode="decimal" placeholder="30000.00" aria-invalid={Boolean(state.fieldErrors?.baseSalary)} />
            {fieldError(state, "baseSalary")}
          </label>
          <label>
            <span>Currency</span>
            <input name="currency" required defaultValue="BDT" minLength={3} maxLength={3} autoCapitalize="characters" />
          </label>
          <label>
            <span>Allowance label</span>
            <input name="allowanceName" maxLength={120} placeholder="Transport allowance" />
          </label>
          <label>
            <span>Fixed allowance</span>
            <input name="allowanceAmount" inputMode="decimal" defaultValue="0.00" aria-invalid={Boolean(state.fieldErrors?.allowanceAmount)} />
          </label>
          <label>
            <span>Deduction label</span>
            <input name="deductionName" maxLength={120} placeholder="Authorized advance recovery" />
          </label>
          <label>
            <span>Fixed deduction</span>
            <input name="deductionAmount" inputMode="decimal" defaultValue="0.00" aria-invalid={Boolean(state.fieldErrors?.deductionAmount)} />
          </label>
        </div>
      </fieldset>
      <div className="office-form-actions">
        <span className="office-form-note">Server calculation uses integer minor units and a versioned rule engine.</span>
        <button className="office-button office-button--accent" type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create employee profile"}
        </button>
      </div>
    </form>
  );
}

export function PayrollRunForm({
  periodStart,
  periodEnd,
}: {
  periodStart: string;
  periodEnd: string;
}) {
  const [state, action, pending] = useActionState(createPayrollRunAction, initialOfficeActionState);
  return (
    <form className="office-form" action={action}>
      <OfficeActionFeedback state={state} />
      <fieldset className="office-form-section" disabled={pending}>
        <legend>Calculation period</legend>
        <p className="office-form-section__note">
          The draft snapshots every included employee and active compensation component. Later
          profile edits cannot silently rewrite a historical run.
        </p>
        <div className="office-form-grid">
          <label><span>Period start</span><input name="periodStart" type="date" required defaultValue={periodStart} /></label>
          <label><span>Period end</span><input name="periodEnd" type="date" required defaultValue={periodEnd} /></label>
          <label><span>Currency</span><input name="currency" required defaultValue="BDT" minLength={3} maxLength={3} /></label>
          <label className="office-field--wide"><span>Preparation note (optional)</span><textarea name="note" maxLength={1000} placeholder="Coverage, exclusions, or source evidence…" /></label>
        </div>
      </fieldset>
      <div className="office-form-actions">
        <span className="office-form-note">Maximum 100 employees per reviewed run; larger teams must use explicit operating-unit runs.</span>
        <button className="office-button office-button--accent" type="submit" disabled={pending}>
          {pending ? "Calculating…" : "Calculate draft run"}
        </button>
      </div>
    </form>
  );
}

function PayrollTransitionForm({
  action,
  runId,
  version,
  label,
  tone = "ghost",
}: {
  action: TransitionAction;
  runId: string;
  version: number;
  label: string;
  tone?: "ghost" | "accent";
}) {
  const [state, formAction, pending] = useActionState(action, initialOfficeActionState);
  return (
    <form className="payroll-transition" action={formAction}>
      <input type="hidden" name="runId" value={runId} />
      <input type="hidden" name="version" value={version} />
      <button className={`office-button office-button--${tone}`} type="submit" disabled={pending}>
        {pending ? "Working…" : label}
      </button>
      {state.status !== "idle" ? <span className={`payroll-transition__${state.status}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</span> : null}
    </form>
  );
}

export function PayrollRunControl({
  runId,
  version,
  status,
  canWrite,
  canApprove,
  canPost,
}: {
  runId: string;
  version: number;
  status: OfficePayrollRunStatus;
  canWrite: boolean;
  canApprove: boolean;
  canPost: boolean;
}) {
  if (status === "draft" && canWrite) {
    return <PayrollTransitionForm action={submitPayrollRunAction} runId={runId} version={version} label="Submit for approval" />;
  }
  if (status === "pending_approval" && canApprove) {
    return <PayrollTransitionForm action={approvePayrollRunAction} runId={runId} version={version} label="Approve run" tone="accent" />;
  }
  if (status === "approved" && canPost) {
    return <PayrollTransitionForm action={postPayrollRunAction} runId={runId} version={version} label="Post payroll" tone="accent" />;
  }
  return <span className="office-form-note">No available action for this role and state.</span>;
}

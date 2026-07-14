"use client";

import { useActionState, useId, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  createOfficeContactAction,
  createOfficeLandAction,
  createOfficeLeadAction,
  createOfficeProjectAction,
  createOfficeTaskAction,
  initialOfficeActionState,
  type OfficeActionState,
} from "@/features/office/actions";

export type OfficeSelectOption = Readonly<{
  value: string;
  label: string;
  detail?: string;
}>;

type AssignmentProps = Readonly<{
  canAssign: boolean;
  teamMembers: readonly OfficeSelectOption[];
}>;

function SubmitButton({ children, disabled = false }: { children: ReactNode; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="office-button office-button--accent" type="submit" disabled={disabled || pending}>
      {pending ? "Saving securely…" : children}
    </button>
  );
}

function ActionFeedback({ state, id }: { state: OfficeActionState; id: string }) {
  if (state.status === "idle") return null;
  const fieldErrors = Object.entries(state.fieldErrors ?? {});
  return (
    <div
      id={id}
      className={`office-alert office-alert--${state.status}`}
      role={state.status === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <div>
        <strong>{state.status === "success" ? "Record saved" : "The record needs attention"}</strong>
        <p>{state.message}</p>
        {fieldErrors.length > 0 ? (
          <ul className="office-field-error-list">
            {fieldErrors.map(([field, message]) => <li key={field}><span>{field.replaceAll(/([A-Z])/g, " $1").replace(/^./, (character) => character.toUpperCase())}:</span> {message}</li>)}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function FieldError({ state, name, id }: { state: OfficeActionState; name: string; id: string }) {
  const message = state.fieldErrors?.[name];
  return message ? <span className="office-field-error" id={id}>{message}</span> : null;
}

function SelectOptions({ options }: { options: readonly OfficeSelectOption[] }) {
  return options.map((option) => (
    <option key={option.value} value={option.value}>
      {option.label}{option.detail ? ` — ${option.detail}` : ""}
    </option>
  ));
}

function AssignmentField({
  state,
  id,
  canAssign,
  teamMembers,
  label = "Assigned team member",
}: AssignmentProps & { state: OfficeActionState; id: string; label?: string }) {
  if (!canAssign) return null;
  const errorId = `${id}-error`;
  return (
    <label>
      <span>{label}</span>
      <select name="assigneeMemberId" aria-invalid={Boolean(state.fieldErrors?.assigneeMemberId)} aria-describedby={state.fieldErrors?.assigneeMemberId ? errorId : undefined}>
        <option value="">Leave unassigned</option>
        <SelectOptions options={teamMembers} />
      </select>
      <FieldError state={state} name="assigneeMemberId" id={errorId} />
    </label>
  );
}

function FormIntro({ title, description }: { title: string; description: string }) {
  return (
    <div className="office-form-intro">
      <span className="office-eyebrow">New protected record</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

export function OfficeContactForm({ canAssign, teamMembers }: AssignmentProps) {
  const [state, action] = useActionState(createOfficeContactAction, initialOfficeActionState);
  const formId = useId();
  const feedbackId = `${formId}-feedback`;
  return (
    <section className="office-create-panel" id="new-contact" aria-labelledby={`${formId}-title`}>
      <FormIntro title="Add a relationship" description="Store the minimum useful contact context. A phone number or email is required so the record can support an accountable next step." />
      <form className="office-form" action={action} aria-describedby={state.status !== "idle" ? feedbackId : undefined}>
        <ActionFeedback state={state} id={feedbackId} />
        <fieldset className="office-form-section">
          <legend id={`${formId}-title`}>Contact profile</legend>
          <div className="office-form-grid">
            <label>
              <span>Relationship type</span>
              <select name="kind" defaultValue="customer" required>
                <option value="customer">Customer</option><option value="landowner">Landowner</option><option value="buyer">Buyer</option>
                <option value="seller">Seller</option><option value="vendor">Vendor</option><option value="partner">Partner</option><option value="other">Other</option>
              </select>
            </label>
            <label>
              <span>Full name</span>
              <input name="displayName" autoComplete="name" minLength={2} maxLength={160} required aria-invalid={Boolean(state.fieldErrors?.displayName)} aria-describedby={state.fieldErrors?.displayName ? `${formId}-displayName-error` : undefined} />
              <FieldError state={state} name="displayName" id={`${formId}-displayName-error`} />
            </label>
            <label>
              <span>Email</span>
              <input name="email" type="email" autoComplete="email" maxLength={320} aria-invalid={Boolean(state.fieldErrors?.email)} aria-describedby={state.fieldErrors?.email ? `${formId}-email-error` : undefined} />
              <FieldError state={state} name="email" id={`${formId}-email-error`} />
            </label>
            <label>
              <span>Phone</span>
              <input name="phone" type="tel" autoComplete="tel" maxLength={40} placeholder="+880…" aria-invalid={Boolean(state.fieldErrors?.phone)} aria-describedby={state.fieldErrors?.phone ? `${formId}-phone-error` : undefined} />
              <FieldError state={state} name="phone" id={`${formId}-phone-error`} />
            </label>
            <label>
              <span>Organization</span>
              <input name="organizationName" autoComplete="organization" maxLength={160} />
            </label>
            {canAssign ? (
              <label>
                <span>Relationship owner</span>
                <select name="assignedMemberId"><option value="">Leave unassigned</option><SelectOptions options={teamMembers} /></select>
              </label>
            ) : null}
            <label className="office-field--wide">
              <span>Address</span>
              <textarea name="address" autoComplete="street-address" maxLength={600} rows={3} />
            </label>
            <label className="office-field--wide">
              <span>Internal notes</span>
              <textarea name="notes" maxLength={2000} rows={4} placeholder="Relevant context only—avoid unnecessary sensitive data." />
            </label>
          </div>
        </fieldset>
        <div className="office-form-actions"><SubmitButton>Save contact</SubmitButton></div>
      </form>
    </section>
  );
}

export function OfficeLeadForm({ contacts, canAssign, teamMembers }: AssignmentProps & { contacts: readonly OfficeSelectOption[] }) {
  const [state, action] = useActionState(createOfficeLeadAction, initialOfficeActionState);
  const formId = useId();
  const feedbackId = `${formId}-feedback`;
  const missingContacts = contacts.length === 0;
  return (
    <section className="office-create-panel" id="new-lead" aria-labelledby={`${formId}-title`}>
      <FormIntro title="Qualify a new opportunity" description="Connect every opportunity to a real contact, a visible stage, and a dated next action so the pipeline reflects work—not wishful counts." />
      {missingContacts ? <div className="office-alert office-alert--warning"><div><strong>A contact is required first.</strong><p>Add the client, landowner, buyer, or partner in Contacts before creating this opportunity.</p></div></div> : null}
      <form className="office-form" action={action} aria-describedby={state.status !== "idle" ? feedbackId : undefined}>
        <ActionFeedback state={state} id={feedbackId} />
        <fieldset className="office-form-section" disabled={missingContacts}>
          <legend id={`${formId}-title`}>Opportunity profile</legend>
          <div className="office-form-grid">
            <label>
              <span>Contact</span>
              <select name="contactId" defaultValue="" required aria-invalid={Boolean(state.fieldErrors?.contactId)} aria-describedby={state.fieldErrors?.contactId ? `${formId}-contactId-error` : undefined}>
                <option value="" disabled>Choose a contact</option><SelectOptions options={contacts} />
              </select>
              <FieldError state={state} name="contactId" id={`${formId}-contactId-error`} />
            </label>
            <label>
              <span>Opportunity title</span>
              <input name="title" minLength={4} maxLength={180} required placeholder="e.g. North Joypurhat land partnership" aria-invalid={Boolean(state.fieldErrors?.title)} aria-describedby={state.fieldErrors?.title ? `${formId}-title-error` : undefined} />
              <FieldError state={state} name="title" id={`${formId}-title-error`} />
            </label>
            <label><span>Service</span><select name="serviceType" defaultValue="consultation" required><option value="buy">Buy</option><option value="sell">Sell</option><option value="rent">Rent</option><option value="land_development">Land development</option><option value="construction">Construction</option><option value="consultation">Consultation</option><option value="other">Other</option></select></label>
            <label><span>Source</span><input name="source" maxLength={120} placeholder="Referral, website, walk-in…" /></label>
            <label><span>Stage</span><select name="stage" defaultValue="new"><option value="new">New</option><option value="qualified">Qualified</option><option value="site_visit">Site visit</option><option value="proposal">Proposal</option><option value="negotiation">Negotiation</option><option value="won">Won</option><option value="lost">Lost</option></select></label>
            <label><span>Priority</span><select name="priority" defaultValue="normal"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
            <label><span>Estimated value</span><input name="estimatedValue" inputMode="decimal" placeholder="0.00" aria-invalid={Boolean(state.fieldErrors?.estimatedValue)} aria-describedby={state.fieldErrors?.estimatedValue ? `${formId}-estimatedValue-error` : undefined} /><FieldError state={state} name="estimatedValue" id={`${formId}-estimatedValue-error`} /></label>
            <label><span>Currency</span><input name="currency" defaultValue="BDT" minLength={3} maxLength={3} required /></label>
            <label><span>Next action date</span><input name="nextActionAt" type="date" /></label>
            <AssignmentField state={state} id={`${formId}-assigneeMemberId`} canAssign={canAssign} teamMembers={teamMembers} />
          </div>
        </fieldset>
        <div className="office-form-actions"><SubmitButton disabled={missingContacts}>Save lead</SubmitButton></div>
      </form>
    </section>
  );
}

export function OfficeLandForm({ contacts, canAssign, teamMembers }: AssignmentProps & { contacts: readonly OfficeSelectOption[] }) {
  const [state, action] = useActionState(createOfficeLandAction, initialOfficeActionState);
  const formId = useId();
  const feedbackId = `${formId}-feedback`;
  return (
    <section className="office-create-panel" id="new-land" aria-labelledby={`${formId}-title`}>
      <FormIntro title="Open a land review file" description="This record coordinates evidence gathering and review status. It does not certify title, mutation, tax, possession, or legal approval." />
      <form className="office-form" action={action} aria-describedby={state.status !== "idle" ? feedbackId : undefined}>
        <ActionFeedback state={state} id={feedbackId} />
        <fieldset className="office-form-section">
          <legend id={`${formId}-title`}>Parcel identity</legend>
          <div className="office-form-grid">
            <label><span>Reference code</span><input name="referenceCode" minLength={3} maxLength={40} pattern="[A-Za-z0-9-]+" placeholder="JOY-LAND-001" required aria-invalid={Boolean(state.fieldErrors?.referenceCode)} aria-describedby={state.fieldErrors?.referenceCode ? `${formId}-referenceCode-error` : undefined} /><FieldError state={state} name="referenceCode" id={`${formId}-referenceCode-error`} /></label>
            <label><span>Working title</span><input name="title" minLength={4} maxLength={180} required /></label>
            <label><span>Primary landowner</span><select name="primaryLandownerContactId" defaultValue=""><option value="">Not linked yet</option><SelectOptions options={contacts} /></select></label>
            <label><span>Pipeline stage</span><select name="stage" defaultValue="lead"><option value="lead">Lead</option><option value="document_intake">Document intake</option><option value="due_diligence">Due diligence</option><option value="survey_feasibility">Survey & feasibility</option><option value="proposal">Proposal</option><option value="negotiation">Negotiation</option><option value="legal_owner_approval">Legal / owner approval</option><option value="agreement">Agreement</option><option value="project_gates">Project gates</option><option value="handover">Handover</option><option value="closed">Closed</option><option value="rejected">Rejected</option></select></label>
            <label><span>Review status</span><select name="reviewStatus" defaultValue="not_started"><option value="not_started">Not started</option><option value="in_review">In review</option><option value="needs_information">Needs information</option><option value="reviewed">Reviewed</option><option value="rejected">Rejected</option></select></label>
            <AssignmentField state={state} id={`${formId}-assigneeMemberId`} canAssign={canAssign} teamMembers={teamMembers} label="Review owner" />
            <label className="office-field--wide"><span>Address / location description</span><textarea name="address" minLength={5} maxLength={600} required rows={3} /></label>
            <label><span>District</span><input name="district" defaultValue="Joypurhat" minLength={2} maxLength={100} required /></label>
            <label><span>Upazila</span><input name="upazila" maxLength={100} /></label>
            <label><span>Union or ward</span><input name="unionOrWard" maxLength={100} /></label>
            <label><span>Mouza</span><input name="mouza" maxLength={120} /></label>
            <label><span>JL number</span><input name="jlNumber" maxLength={80} /></label>
            <label><span>Area (square feet)</span><input name="areaSquareFeet" type="number" min={1} max={2000000000} inputMode="numeric" /></label>
            <label><span>Area (decimal, as recorded)</span><input name="areaDecimal" maxLength={50} placeholder="e.g. 12.50" /></label>
            <label className="office-field--wide"><span>Dag numbers</span><textarea name="dagNumbers" maxLength={500} rows={2} placeholder="Comma or line separated" /></label>
            <label className="office-field--wide"><span>Khatian numbers</span><textarea name="khatianNumbers" maxLength={500} rows={2} placeholder="Comma or line separated" /></label>
          </div>
        </fieldset>
        <fieldset className="office-form-section">
          <legend>Review evidence</legend>
          <div className="office-form-grid">
            <label><span>Mutation status</span><input name="mutationStatus" maxLength={160} placeholder="Unverified / pending / checked…" /></label>
            <label><span>Land tax status</span><input name="landTaxStatus" maxLength={160} /></label>
            <label><span>Possession status</span><input name="possessionStatus" maxLength={160} /></label>
            <label className="office-field--wide"><span>Verification notes</span><textarea name="verificationNotes" maxLength={3000} rows={5} placeholder="Record the source, date, reviewer, and unresolved questions." /></label>
          </div>
        </fieldset>
        <div className="office-form-actions"><SubmitButton>Save land file</SubmitButton></div>
      </form>
    </section>
  );
}

export function OfficeProjectForm({
  landParcels,
  contacts,
  canAssign,
  teamMembers,
}: AssignmentProps & { landParcels: readonly OfficeSelectOption[]; contacts: readonly OfficeSelectOption[] }) {
  const [state, action] = useActionState(createOfficeProjectAction, initialOfficeActionState);
  const formId = useId();
  const feedbackId = `${formId}-feedback`;
  return (
    <section className="office-create-panel" id="new-project" aria-labelledby={`${formId}-title`}>
      <FormIntro title="Create a delivery record" description="Define scope, ownership, risk, and the target window before project activity is reported as delivery progress." />
      <form className="office-form" action={action} aria-describedby={state.status !== "idle" ? feedbackId : undefined}>
        <ActionFeedback state={state} id={feedbackId} />
        <fieldset className="office-form-section">
          <legend id={`${formId}-title`}>Project charter</legend>
          <div className="office-form-grid">
            <label><span>Project code</span><input name="code" minLength={3} maxLength={40} pattern="[A-Za-z0-9-]+" placeholder="AP-JOY-001" required /></label>
            <label><span>Project name</span><input name="name" minLength={4} maxLength={180} required /></label>
            <label><span>Project type</span><select name="projectType" defaultValue="residential"><option value="residential">Residential</option><option value="commercial">Commercial</option><option value="mixed_use">Mixed use</option><option value="land_development">Land development</option><option value="construction">Construction</option><option value="other">Other</option></select></label>
            <label><span>Status</span><select name="status" defaultValue="feasibility"><option value="feasibility">Feasibility</option><option value="secured">Secured</option><option value="design">Design</option><option value="approval">Approval</option><option value="delivery">Delivery</option><option value="inspection">Inspection</option><option value="handover">Handover</option><option value="defect_follow_up">Defect follow-up</option><option value="closed">Closed</option><option value="on_hold">On hold</option><option value="cancelled">Cancelled</option></select></label>
            <label><span>Land record</span><select name="landParcelId" defaultValue=""><option value="">No linked land record</option><SelectOptions options={landParcels} /></select></label>
            <label><span>Customer / client</span><select name="customerContactId" defaultValue=""><option value="">No linked customer</option><SelectOptions options={contacts} /></select></label>
            {canAssign ? <label><span>Project manager</span><select name="managerMemberId" defaultValue=""><option value="">Leave unassigned</option><SelectOptions options={teamMembers} /></select></label> : null}
            <label><span>Risk level</span><select name="riskLevel" defaultValue="low"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label>
            <label className="office-field--wide"><span>Project address</span><textarea name="address" minLength={5} maxLength={600} required rows={3} /></label>
            <label><span>District</span><input name="district" defaultValue="Joypurhat" minLength={2} maxLength={100} required /></label>
            <label><span>Upazila</span><input name="upazila" maxLength={100} /></label>
            <label><span>Budget</span><input name="budget" inputMode="decimal" placeholder="0.00" /></label>
            <label><span>Currency</span><input name="currency" defaultValue="BDT" minLength={3} maxLength={3} required /></label>
            <label><span>Start date</span><input name="startAt" type="date" /></label>
            <label><span>Target completion</span><input name="targetEndAt" type="date" /></label>
            <label className="office-field--wide"><span>Scope summary</span><textarea name="summary" maxLength={2000} rows={5} /></label>
          </div>
        </fieldset>
        <div className="office-form-actions"><SubmitButton>Save project</SubmitButton></div>
      </form>
    </section>
  );
}

export function OfficeTaskForm({
  contacts,
  leads,
  landParcels,
  projects,
  canAssign,
  teamMembers,
}: AssignmentProps & {
  contacts: readonly OfficeSelectOption[];
  leads: readonly OfficeSelectOption[];
  landParcels: readonly OfficeSelectOption[];
  projects: readonly OfficeSelectOption[];
}) {
  const [state, action] = useActionState(createOfficeTaskAction, initialOfficeActionState);
  const formId = useId();
  const feedbackId = `${formId}-feedback`;
  return (
    <section className="office-create-panel" id="new-task" aria-labelledby={`${formId}-title`}>
      <FormIntro title="Create accountable work" description="Give the task one owner, one due date, and only the relationship links needed to understand why the work exists." />
      <form className="office-form" action={action} aria-describedby={state.status !== "idle" ? feedbackId : undefined}>
        <ActionFeedback state={state} id={feedbackId} />
        <fieldset className="office-form-section">
          <legend id={`${formId}-title`}>Task definition</legend>
          <div className="office-form-grid">
            <label className="office-field--wide"><span>Task title</span><input name="title" minLength={4} maxLength={180} required aria-invalid={Boolean(state.fieldErrors?.title)} aria-describedby={state.fieldErrors?.title ? `${formId}-title-error` : undefined} /><FieldError state={state} name="title" id={`${formId}-title-error`} /></label>
            <label><span>Status</span><select name="status" defaultValue="open"><option value="open">Open</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="done">Done</option><option value="cancelled">Cancelled</option></select></label>
            <label><span>Priority</span><select name="priority" defaultValue="normal"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
            <label><span>Due date</span><input name="dueAt" type="date" /></label>
            <AssignmentField state={state} id={`${formId}-assigneeMemberId`} canAssign={canAssign} teamMembers={teamMembers} />
            <label className="office-field--wide"><span>Description / completion criteria</span><textarea name="description" maxLength={2000} rows={4} /></label>
          </div>
        </fieldset>
        <fieldset className="office-form-section">
          <legend>Relationship links</legend>
          <p className="office-form-section__note">Optional. Link only the records needed to explain and find the work.</p>
          <div className="office-form-grid">
            <label><span>Contact</span><select name="contactId" defaultValue=""><option value="">No linked contact</option><SelectOptions options={contacts} /></select></label>
            <label><span>Lead</span><select name="leadId" defaultValue=""><option value="">No linked lead</option><SelectOptions options={leads} /></select></label>
            <label><span>Land file</span><select name="landParcelId" defaultValue=""><option value="">No linked land file</option><SelectOptions options={landParcels} /></select></label>
            <label><span>Project</span><select name="projectId" defaultValue=""><option value="">No linked project</option><SelectOptions options={projects} /></select></label>
          </div>
        </fieldset>
        <div className="office-form-actions"><SubmitButton>Save task</SubmitButton></div>
      </form>
    </section>
  );
}

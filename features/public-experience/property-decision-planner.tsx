"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { ArrowRight, Check, CheckCircle2, Copy, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildPlannerOutcome,
  plannerBudgetValues,
  plannerJourneyValues,
  plannerPriorityValues,
  plannerSchema,
  plannerTimelineValues,
  plannerUseValues,
  type PlannerOutcome,
  type PlannerValues,
} from "@/features/public-experience/planner";
import styles from "@/features/public-experience/public-experience.module.css";

type CopyState = "idle" | "copied" | "error";

const journeyOptions: ReadonlyArray<{ value: (typeof plannerJourneyValues)[number]; label: string }> = [
  { value: "buyer", label: "Buyer decision" },
  { value: "landowner", label: "Landowner / joint-venture discussion" },
  { value: "project-client", label: "Project planning discussion" },
];

const useOptions: ReadonlyArray<{ value: (typeof plannerUseValues)[number]; label: string }> = [
  { value: "home", label: "Home / residential use" },
  { value: "commercial", label: "Commercial use" },
  { value: "mixed-use", label: "Mixed-use" },
  { value: "land-development", label: "Land development" },
  { value: "not-sure", label: "Use still being framed" },
];

const timelineOptions: ReadonlyArray<{ value: (typeof plannerTimelineValues)[number]; label: string }> = [
  { value: "exploring", label: "Exploring and gathering evidence" },
  { value: "within-six-months", label: "A decision may be needed within six months" },
  { value: "later", label: "The decision is likely later" },
  { value: "not-sure", label: "Timeline not yet defined" },
];

const budgetOptions: ReadonlyArray<{ value: (typeof plannerBudgetValues)[number]; label: string }> = [
  { value: "not-framed", label: "Budget context not yet framed" },
  { value: "under-review", label: "Budget context is under review" },
  { value: "range-ready", label: "A working range is ready to discuss" },
  { value: "requires-guidance", label: "Guidance is needed to frame the cost conversation" },
];

const priorityOptions: ReadonlyArray<{ value: (typeof plannerPriorityValues)[number]; label: string }> = [
  { value: "location", label: "Location and daily movement" },
  { value: "documentation", label: "Documents and verification" },
  { value: "whole-cost", label: "Whole cost and responsibilities" },
  { value: "timeline", label: "Decision and delivery timing" },
  { value: "design-fit", label: "Design and use fit" },
  { value: "handover", label: "Handover and after-sales" },
];

const plannerDefaults = {
  locationContext: "",
  priorities: [],
  notes: "",
} satisfies Partial<PlannerValues>;

export function PropertyDecisionPlanner() {
  const id = useId();
  const resultRef = useRef<HTMLDivElement>(null);
  const [outcome, setOutcome] = useState<PlannerOutcome | null>(null);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const {
    register,
    handleSubmit,
    control,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<PlannerValues>({
    resolver: zodResolver(plannerSchema),
    defaultValues: plannerDefaults,
    mode: "onBlur",
  });

  const selectedPriorities = useWatch({ control, name: "priorities" }) ?? [];
  const notes = useWatch({ control, name: "notes" }) ?? "";

  useEffect(() => {
    if (outcome) resultRef.current?.focus();
  }, [outcome]);

  function preparePlan(values: PlannerValues) {
    setCopyState("idle");
    setOutcome(buildPlannerOutcome(values));
  }

  async function copySummary() {
    if (!outcome) return;

    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(outcome.preparedEnquiry);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  function prepareAnother() {
    setOutcome(null);
    setCopyState("idle");
    reset(plannerDefaults);
    requestAnimationFrame(() => setFocus("journey"));
  }

  return (
    <section className={styles.section}>
      <div className={`${styles.shell} ${styles.plannerLayout}`}>
        <div className={styles.plannerIntro}>
          <span className={styles.sectionEyebrow}>Local decision planner</span>
          <h2 className={styles.sectionTitle}>Prepare the questions before the enquiry.</h2>
          <p>
            Choose the closest context and priorities. The planner prepares a reviewable summary and suggested next questions without verifying a property or sending data.
          </p>
          <div className={styles.plannerPrivacy}>
            <ShieldCheck aria-hidden="true" />
            <span>Your entries stay in this browser view. Nothing is transmitted by this planner.</span>
          </div>
        </div>

        {outcome ? (
          <div className={styles.plannerResult} ref={resultRef} tabIndex={-1}>
            <p className={styles.visuallyHidden} role="status">Your local decision-planning summary is ready.</p>
            <div className={styles.resultHeader}>
              <CheckCircle2 aria-hidden="true" />
              <div>
                <h3>{outcome.title}</h3>
                <p>{outcome.summary}</p>
              </div>
            </div>
            <ul className={styles.resultActions}>
              {outcome.actions.map((action) => (
                <li key={action}><Check aria-hidden="true" /><span>{action}</span></li>
              ))}
            </ul>
            <label className={styles.visuallyHidden} htmlFor={`${id}-prepared-summary`}>Prepared enquiry summary</label>
            <textarea
              id={`${id}-prepared-summary`}
              className={styles.summaryTextarea}
              value={outcome.preparedEnquiry}
              readOnly
              rows={18}
            />
            <div className={styles.resultButtons}>
              <Button className={styles.primaryButton} type="button" onClick={copySummary}>
                <Copy aria-hidden="true" /> Copy summary
              </Button>
              <Button className={styles.secondaryButton} asChild>
                <Link href="/contact">Open contact options <ArrowRight aria-hidden="true" /></Link>
              </Button>
              <Button className={styles.secondaryButton} type="button" onClick={prepareAnother}>
                <RotateCcw aria-hidden="true" /> Prepare another
              </Button>
            </div>
            <p className={styles.copyStatus} aria-live="polite">
              {copyState === "copied" ? "Summary copied. Review it before choosing any external contact channel." : null}
              {copyState === "error" ? "Copy was unavailable. Select the summary text and copy it manually." : null}
            </p>
          </div>
        ) : (
          <div className={styles.plannerPanel}>
            <form className={styles.plannerForm} onSubmit={handleSubmit(preparePlan)} noValidate>
              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label htmlFor={`${id}-journey`}>Conversation to prepare</label>
                  <select
                    id={`${id}-journey`}
                    defaultValue=""
                    aria-invalid={Boolean(errors.journey)}
                    aria-describedby={errors.journey ? `${id}-journey-error` : undefined}
                    required
                    {...register("journey")}
                  >
                    <option value="" disabled>Choose one</option>
                    {journeyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  {errors.journey ? <p className={styles.fieldError} id={`${id}-journey-error`} role="alert">{errors.journey.message}</p> : null}
                </div>

                <div className={styles.field}>
                  <label htmlFor={`${id}-use`}>Closest intended use</label>
                  <select
                    id={`${id}-use`}
                    defaultValue=""
                    aria-invalid={Boolean(errors.propertyUse)}
                    aria-describedby={errors.propertyUse ? `${id}-use-error` : undefined}
                    required
                    {...register("propertyUse")}
                  >
                    <option value="" disabled>Choose one</option>
                    {useOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  {errors.propertyUse ? <p className={styles.fieldError} id={`${id}-use-error`} role="alert">{errors.propertyUse.message}</p> : null}
                </div>

                <div className={`${styles.field} ${styles.fieldWide}`}>
                  <label htmlFor={`${id}-location`}>Location context</label>
                  <input
                    id={`${id}-location`}
                    type="text"
                    placeholder="For example: Joypurhat, a locality, or location still open"
                    autoComplete="off"
                    aria-invalid={Boolean(errors.locationContext)}
                    aria-describedby={errors.locationContext ? `${id}-location-error` : `${id}-location-hint`}
                    required
                    {...register("locationContext")}
                  />
                  <p className={styles.fieldHint} id={`${id}-location-hint`}>Do not enter a full private address or sensitive ownership information here.</p>
                  {errors.locationContext ? <p className={styles.fieldError} id={`${id}-location-error`} role="alert">{errors.locationContext.message}</p> : null}
                </div>

                <div className={styles.field}>
                  <label htmlFor={`${id}-timeline`}>Decision timeline</label>
                  <select
                    id={`${id}-timeline`}
                    defaultValue=""
                    aria-invalid={Boolean(errors.timeline)}
                    aria-describedby={errors.timeline ? `${id}-timeline-error` : undefined}
                    required
                    {...register("timeline")}
                  >
                    <option value="" disabled>Choose one</option>
                    {timelineOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  {errors.timeline ? <p className={styles.fieldError} id={`${id}-timeline-error`} role="alert">{errors.timeline.message}</p> : null}
                </div>

                <div className={styles.field}>
                  <label htmlFor={`${id}-budget`}>Budget readiness</label>
                  <select
                    id={`${id}-budget`}
                    defaultValue=""
                    aria-invalid={Boolean(errors.budgetReadiness)}
                    aria-describedby={errors.budgetReadiness ? `${id}-budget-error` : undefined}
                    required
                    {...register("budgetReadiness")}
                  >
                    <option value="" disabled>Choose one</option>
                    {budgetOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  {errors.budgetReadiness ? <p className={styles.fieldError} id={`${id}-budget-error`} role="alert">{errors.budgetReadiness.message}</p> : null}
                </div>
              </div>

              <fieldset className={styles.fieldset} aria-describedby={`${id}-priorities-hint${errors.priorities ? ` ${id}-priorities-error` : ""}`}>
                <legend>Conversation priorities</legend>
                <p className={styles.fieldHint} id={`${id}-priorities-hint`}>Choose two to four. Selected: {selectedPriorities.length}.</p>
                <div className={styles.checkboxGrid}>
                  {priorityOptions.map((option) => {
                    const checked = selectedPriorities.includes(option.value);
                    const disabled = !checked && selectedPriorities.length >= 4;

                    return (
                      <label className={styles.checkboxLabel} key={option.value}>
                        <input type="checkbox" value={option.value} disabled={disabled} {...register("priorities")} />
                        <span className={styles.checkboxMark}><Check aria-hidden="true" /></span>
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.priorities ? <p className={styles.fieldError} id={`${id}-priorities-error`} role="alert">{errors.priorities.message}</p> : null}
              </fieldset>

              <div className={styles.field}>
                <label htmlFor={`${id}-notes`}>Additional context <span aria-hidden="true">·</span> optional</label>
                <textarea
                  id={`${id}-notes`}
                  rows={5}
                  maxLength={600}
                  placeholder="Add the decision you need help framing—without private identifiers or sensitive document details."
                  aria-invalid={Boolean(errors.notes)}
                  aria-describedby={`${id}-notes-count${errors.notes ? ` ${id}-notes-error` : ""}`}
                  {...register("notes")}
                />
                <p className={styles.fieldCount} id={`${id}-notes-count`}>{notes.length} / 600 characters</p>
                {errors.notes ? <p className={styles.fieldError} id={`${id}-notes-error`} role="alert">{errors.notes.message}</p> : null}
              </div>

              <div className={styles.formFooter}>
                <p>Preparing the summary is not an enquiry submission, property verification, quotation, or agreement.</p>
                <Button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
                  Prepare summary <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

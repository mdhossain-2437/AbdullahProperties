"use client";

export default function PayrollError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="office-empty" role="alert">
      <span className="office-alert__mark" aria-hidden="true">!</span>
      <span className="office-eyebrow">No payroll mutation was confirmed</span>
      <h1>Payroll needs a controlled retry.</h1>
      <p>Retry this view. If the problem continues, verify migration 0005 and the protected database binding before preparing another run.</p>
      <button className="office-button" type="button" onClick={reset}>Retry payroll</button>
    </section>
  );
}

"use client";

export default function DesktopInboxError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="office-empty" role="alert">
      <span className="office-alert__mark" aria-hidden="true">!</span>
      <span className="office-eyebrow">No native acknowledgement was changed</span>
      <h1>The desktop inbox needs a controlled retry.</h1>
      <p>Retry this view. Local device work remains durable and no server draft is silently discarded.</p>
      <button className="office-button" type="button" onClick={reset}>Retry inbox</button>
    </section>
  );
}

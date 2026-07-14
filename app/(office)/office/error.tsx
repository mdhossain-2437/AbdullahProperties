"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function OfficeError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    console.error("Office workspace error", { message: error.message, digest: error.digest });
    headingRef.current?.focus();
  }, [error]);

  return (
    <main className="office-main">
      <section className="office-empty" role="alert">
        <AlertTriangle aria-hidden="true" />
        <span className="office-eyebrow">No partial action was confirmed</span>
        <h1 ref={headingRef} tabIndex={-1}>The office workspace needs another look.</h1>
        <p>Retry the current view. If the problem continues, an owner should verify the database migration and access configuration before entering records again.</p>
        <button className="office-button" type="button" onClick={reset}><RotateCcw aria-hidden="true" />Try again</button>
      </section>
    </main>
  );
}

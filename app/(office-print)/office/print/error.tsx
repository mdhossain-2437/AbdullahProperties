"use client";

import Link from "next/link";
import { useEffect } from "react";
import styles from "./print-layout.module.css";

export default function OfficePrintError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Protected Office document rendering failed.", { digest: error.digest ?? null });
  }, [error.digest]);

  return (
    <section className={styles.state} role="alert">
      <span>Protected document</span>
      <h1>The document could not be prepared.</h1>
      <p>No recipient or financial detail is shown in this error state. Retry once, or return to the protected Office workspace.</p>
      <div className={styles.stateActions}>
        <button type="button" onClick={reset}>Try again</button>
        <Link href="/office">Return to Office OS</Link>
      </div>
    </section>
  );
}

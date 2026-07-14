"use client";

import { useEffect, useRef } from "react";

export default function StudioError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return <main className="studio-page"><div className="studio-shell"><div className="studio-state" role="alert"><span className="eyebrow">Content Studio / error</span><h1 ref={headingRef} tabIndex={-1}>The protected workspace could not load.</h1><p>No partial content change is assumed. Retry the request; if the problem continues, verify the D1 binding and migration state.</p><button className="studio-button studio-button--primary" type="button" onClick={reset}>Try again</button></div></div></main>;
}

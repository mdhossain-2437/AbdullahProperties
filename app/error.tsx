"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    console.error("Route error", { message: error.message, digest: error.digest });
    headingRef.current?.focus();
  }, [error]);

  return (
    <main className="state-page">
      <section className="state-page__inner" role="alert" aria-labelledby="route-error-title">
        <span className="state-page__code" aria-hidden="true">!</span>
        <h1 id="route-error-title" ref={headingRef} tabIndex={-1}>The route needs another look.</h1>
        <p>No enquiry or form data was sent. Retry the page, or return to the property overview.</p>
        <Button className="brand-button" onClick={reset}>Try again</Button>
      </section>
    </main>
  );
}

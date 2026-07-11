"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Route error", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <main className="state-page">
      <div className="state-page__inner"><span className="state-page__code">!</span><h1>The route needs another look.</h1><p>No enquiry or form data was sent. Retry the page, or return to the property overview.</p><Button className="brand-button" onClick={reset}>Try again</Button></div>
    </main>
  );
}

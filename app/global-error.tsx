"use client";

import { useEffect, useRef, type CSSProperties } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const mainStyle: CSSProperties = {
  display: "grid",
  minHeight: "100vh",
  placeItems: "center",
  background: "#fbf9f8",
  color: "#0c0c0c",
  padding: "24px",
  fontFamily: "system-ui, sans-serif",
};

const sectionStyle: CSSProperties = { maxWidth: "680px" };
const labelStyle: CSSProperties = { color: "#802900", fontWeight: 700, textTransform: "uppercase" };
const buttonStyle: CSSProperties = {
  minHeight: "44px",
  marginTop: "20px",
  border: "1px solid #0c0c0c",
  borderRadius: "999px",
  background: "#ff6b2c",
  color: "#0c0c0c",
  padding: "10px 20px",
  font: "inherit",
  fontWeight: 700,
  cursor: "pointer",
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    console.error("Application error", { message: error.message, digest: error.digest });
    headingRef.current?.focus();
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main style={mainStyle}>
          <section role="alert" aria-labelledby="application-error-title" style={sectionStyle}>
            <p style={labelStyle}>Abdullah Properties</p>
            <h1 id="application-error-title" ref={headingRef} tabIndex={-1}>
              The application needs another look.
            </h1>
            <p>No enquiry or form data was sent. Retry the page to restore the experience.</p>
            <button
              type="button"
              onClick={reset}
              style={buttonStyle}
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}

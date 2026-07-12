import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The requested Abdullah Properties page could not be found.",
  robots: { index: false, follow: true },
};

const helpfulRoutes = [
  { href: "/services", label: "Explore our services" },
  { href: "/projects", label: "View project work" },
  { href: "/contact", label: "Contact the team" },
] as const;

export default function NotFound() {
  return (
    <main className="not-found-page">
      <section className="site-shell not-found" aria-labelledby="not-found-title">
        <div className="not-found__copy">
          <p className="not-found__eyebrow">
            <span className="not-found__status-dot" aria-hidden="true" />
            Error 404 · Address not found
          </p>

          <p className="not-found__code" aria-hidden="true">
            404
          </p>

          <h1 id="not-found-title">This address is not in the site plan.</h1>
          <p className="not-found__lede">
            The page may have moved, or the property reference is no longer
            available. Let&apos;s guide you back to Abdullah Properties.
          </p>

          <nav className="not-found__actions" aria-label="404 recovery actions">
            <Link className="not-found__action not-found__action--primary" href="/">
              Return home
              <span aria-hidden="true">↗</span>
            </Link>
            <Link
              className="not-found__action not-found__action--secondary"
              href="/properties"
            >
              Browse properties
            </Link>
          </nav>

          <nav className="not-found__routes" aria-label="Helpful destinations">
            <p>Or continue your search</p>
            <ul>
              {helpfulRoutes.map((route) => (
                <li key={route.href}>
                  <Link href={route.href}>
                    {route.label}
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="not-found__visual" aria-hidden="true">
          <p className="not-found__visual-kicker">Site plan · Joypurhat</p>
          <svg
            className="not-found__blueprint"
            viewBox="0 0 640 560"
            fill="none"
            focusable="false"
          >
            <rect className="not-found__plot" x="38" y="38" width="564" height="484" rx="30" />
            <path className="not-found__grid-line" d="M38 178H602M38 330H602M208 38V522M438 38V522" />
            <path className="not-found__route-line" d="M72 454C168 424 220 476 306 434C392 392 435 420 542 352" />

            <g className="not-found__building">
              <path className="not-found__building-roof" d="M178 264L320 146L462 264" />
              <path className="not-found__building-shell" d="M206 250H434V426H206V250Z" />
              <path className="not-found__building-detail" d="M246 294H294V342H246V294ZM346 294H394V342H346V294ZM294 368H346V426H294V368Z" />
              <path className="not-found__building-ground" d="M166 426H474" />
            </g>

            <g className="not-found__location-pin">
              <path d="M542 178C542 138.236 509.764 106 470 106C430.236 106 398 138.236 398 178C398 229.5 470 302 470 302C470 302 542 229.5 542 178Z" />
              <circle className="not-found__location-pin-dot" cx="470" cy="178" r="22" />
            </g>

            <circle className="not-found__route-point not-found__route-point--start" cx="78" cy="452" r="9" />
            <circle className="not-found__route-point not-found__route-point--end" cx="542" cy="352" r="9" />
          </svg>
          <div className="not-found__visual-caption">
            <span>Plot reference</span>
            <strong>Not mapped</strong>
          </div>
        </div>
      </section>
    </main>
  );
}

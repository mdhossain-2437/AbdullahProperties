import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CircleAlert, MapPin, ShieldX } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { getPublicTrackingResult } from "@/features/office/public-tracking";
import { company } from "@/lib/company-data";
import trackingCss from "./tracking.css?raw";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Document verification | Abdullah Properties",
  description: "Verify an Abdullah Properties invoice, receipt, or issued notice.",
  robots: { index: false, follow: false, noarchive: true, nocache: true },
};

type TrackingPageProps = { params: Promise<{ trackingCode: string }> };

const labels = {
  invoice: "Invoice",
  receipt: "Payment receipt",
  notice: "Issued notice",
} as const;

export default async function TrackingPage({ params }: TrackingPageProps) {
  const { trackingCode } = await params;
  const result = await getPublicTrackingResult(trackingCode);
  const verified = result.state === "verified";
  const revoked = result.state === "revoked";

  return (
    <>
      <style>{trackingCss}</style>
      <main className="tracking-page">
      <div className="tracking-page__shell">
        <header className="tracking-page__header">
          <BrandLogo tone="dark" />
          <span>Public document verification</span>
        </header>

        <section className="tracking-card" data-state={result.state}>
          <div className="tracking-card__status">
            {verified ? <BadgeCheck aria-hidden="true" /> : revoked ? <ShieldX aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
            <span>{verified ? "Verified office record" : revoked ? "Public access revoked" : result.state === "unavailable" ? "Verification temporarily unavailable" : "Record not found"}</span>
          </div>

          {verified || revoked ? (
            <>
              <div className="tracking-card__title">
                <span>{labels[result.documentType]}</span>
                <h1>{result.number}</h1>
                <p>This page confirms that the identifier belongs to an Abdullah Properties office record. It intentionally hides private financial and contact details.</p>
              </div>
              <dl className="tracking-card__facts">
                <div><dt>Document</dt><dd>{labels[result.documentType]}</dd></div>
                <div><dt>Date</dt><dd>{result.documentDate ?? "Not recorded"}</dd></div>
                <div><dt>Status</dt><dd>{result.status.replaceAll("_", " ")}</dd></div>
                <div><dt>Recipient</dt><dd>{result.recipientMasked}</dd></div>
              </dl>
            </>
          ) : (
            <div className="tracking-card__title">
              <span>Verification result</span>
              <h1>{result.state === "unavailable" ? "Please try again shortly." : "Check the printed code."}</h1>
              <p>{result.state === "unavailable" ? "The verification store is not reachable right now. No conclusion should be drawn from this temporary state." : "The identifier is invalid, expired, mistyped, or was not issued by this system. Contact the office before relying on the document."}</p>
            </div>
          )}
        </section>

        <footer className="tracking-page__footer">
          <div><MapPin aria-hidden="true" /><span>{company.address.line1}, {company.address.line2}</span></div>
          <a href={company.phones[0].href}>{company.phones[0].display}</a>
          <Link href="/contact">Contact the Joypurhat office</Link>
        </footer>
      </div>
      </main>
    </>
  );
}

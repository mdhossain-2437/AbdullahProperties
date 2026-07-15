"use client";

import { QRCodeSVG } from "qrcode.react";
import { AppImage as Image } from "@/components/ui/app-image";
import { formatOfficeDate, formatOfficeMoney, formatOfficePercent } from "@/features/office/presentation";
import { trackingUrl } from "@/features/office/tracking";
import type {
  OfficeInvoiceDetail,
  OfficeInvoicePartySnapshot,
  OfficeNoticeView,
  OfficePaymentView,
} from "@/features/office/repository";
import styles from "./branded-document.module.css";

type DocumentFrameProps = Readonly<{
  typeLabel: string;
  purpose: string;
  number: string;
  status: string;
  primaryDateLabel: string;
  primaryDate: string | null;
  secondaryDateLabel?: string;
  secondaryDate?: string | null;
  company: OfficeInvoicePartySnapshot;
  recipient: OfficeInvoicePartySnapshot | null;
  trackingCode: string | null;
  children: React.ReactNode;
  footerNote: string;
}>;

function Party({ label, party }: { label: string; party: OfficeInvoicePartySnapshot | null }) {
  if (!party) return <div className={styles.party}><span>{label}</span><strong>General circulation</strong><p>No named recipient is printed on this document.</p></div>;
  return (
    <div className={styles.party}>
      <span>{label}</span>
      <strong>{party.name}</strong>
      <p>{party.address}</p>
      {party.phone ? <p>{party.phone}</p> : null}
      {party.email ? <p>{party.email}</p> : null}
      {party.taxIdentifier ? <p>Tax ID: {party.taxIdentifier}</p> : null}
    </div>
  );
}

function BrandedDocumentFrame({
  typeLabel,
  purpose,
  number,
  status,
  primaryDateLabel,
  primaryDate,
  secondaryDateLabel,
  secondaryDate,
  company,
  recipient,
  trackingCode,
  children,
  footerNote,
}: DocumentFrameProps) {
  const verificationUrl = trackingCode ? trackingUrl(trackingCode) : null;
  return (
    <article className={styles.sheet} aria-label={`${typeLabel} ${number}`}>
      <Image className={styles.watermark} src="/brand/logo-mark.png" alt="" aria-hidden="true" width={512} height={512} />
      <div className={styles.accent} aria-hidden="true" />
      <header className={styles.header}>
        <div className={styles.identity}>
          <Image src="/brand/logo-primary.png" alt="Abdullah Properties" width={942} height={316} />
          <p>Your housing base, a total solution point.</p>
        </div>
        <div className={styles.documentTitle}>
          <span>{typeLabel}</span>
          <h1>{number}</h1>
          <p>{purpose}</p>
        </div>
      </header>

      <section className={styles.summary} aria-label="Document summary">
        <div><span>Status</span><strong>{status.replaceAll("_", " ")}</strong></div>
        <div><span>{primaryDateLabel}</span><strong>{formatOfficeDate(primaryDate)}</strong></div>
        {secondaryDateLabel ? <div><span>{secondaryDateLabel}</span><strong>{formatOfficeDate(secondaryDate ?? null)}</strong></div> : null}
        <div><span>Office</span><strong>Joypurhat / Bangladesh</strong></div>
      </section>

      <section className={styles.parties}>
        <Party label="Issued by" party={company} />
        <Party label="Issued to" party={recipient} />
      </section>

      <div className={styles.body}>{children}</div>

      <section className={styles.verification}>
        <div>
          <span>Document integrity</span>
          <h2>{verificationUrl ? "Scan to verify this office record." : "Draft — public tracking is not active."}</h2>
          <p>{verificationUrl ? "The QR opens a privacy-preserving verification page. It does not expose customer contact details or financial values." : "A controlled number and public tracking code are assigned only when the record is officially issued or posted."}</p>
          {trackingCode ? <code>{trackingCode}</code> : null}
        </div>
        {verificationUrl ? <QRCodeSVG className={styles.qr} value={verificationUrl} size={132} level="M" marginSize={2} title={`Verify ${typeLabel} ${number}`} /> : <div className={styles.draftMark}>DRAFT</div>}
      </section>

      <footer className={styles.footer}>
        <div><strong>{company.name}</strong><span>{company.address}</span></div>
        <div>{company.phone ? <span>{company.phone}</span> : null}{company.email ? <span>{company.email}</span> : null}</div>
        <p>{footerNote}</p>
      </footer>
    </article>
  );
}

export function BrandedInvoiceDocument({ invoice }: { invoice: OfficeInvoiceDetail }) {
  return (
    <BrandedDocumentFrame
      typeLabel={invoice.kind === "installment" ? "Installment invoice" : "Commercial invoice"}
      purpose={invoice.purpose}
      number={invoice.number ?? "DRAFT — NOT ISSUED"}
      status={invoice.status}
      primaryDateLabel="Issue date"
      primaryDate={invoice.issueDate}
      secondaryDateLabel="Due date"
      secondaryDate={invoice.dueDate}
      company={invoice.companySnapshot}
      recipient={invoice.customerSnapshot}
      trackingCode={invoice.trackingCode}
      footerNote="This commercial record is not represented as an NBR VAT invoice. Confirm applicable tax treatment, scope, approvals, and payment terms against the signed agreement."
    >
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Unit price</th><th>Discount</th><th>Tax</th><th>Total</th></tr></thead>
          <tbody>{invoice.items.map((item) => <tr key={item.id}><td>{item.position}</td><td><strong>{item.description}</strong></td><td>{(item.quantityMillis / 1_000).toLocaleString("en-BD", { maximumFractionDigits: 3 })}</td><td>{formatOfficeMoney(item.unitPriceMinor, invoice.currency)}</td><td>{formatOfficeMoney(item.discountMinor, invoice.currency)}</td><td>{formatOfficePercent(item.taxRateBps)}</td><td><strong>{formatOfficeMoney(item.totalMinor, invoice.currency)}</strong></td></tr>)}</tbody>
        </table>
      </div>
      <section className={styles.financialSummary}>
        <div className={styles.terms}><span>Terms</span><p>{invoice.termsSnapshot}</p>{invoice.notes ? <><span>Notes</span><p>{invoice.notes}</p></> : null}</div>
        <dl>
          <div><dt>Subtotal</dt><dd>{formatOfficeMoney(invoice.subtotalMinor, invoice.currency)}</dd></div>
          <div><dt>Discount</dt><dd>− {formatOfficeMoney(invoice.discountMinor, invoice.currency)}</dd></div>
          <div><dt>Tax</dt><dd>{formatOfficeMoney(invoice.taxMinor, invoice.currency)}</dd></div>
          <div><dt>Total</dt><dd>{formatOfficeMoney(invoice.totalMinor, invoice.currency)}</dd></div>
          <div><dt>Paid</dt><dd>{formatOfficeMoney(invoice.paidMinor, invoice.currency)}</dd></div>
          <div><dt>Balance due</dt><dd>{formatOfficeMoney(invoice.balanceMinor, invoice.currency)}</dd></div>
        </dl>
      </section>
    </BrandedDocumentFrame>
  );
}

export function BrandedReceiptDocument({ payment, invoice }: { payment: OfficePaymentView; invoice: OfficeInvoiceDetail }) {
  return (
    <BrandedDocumentFrame
      typeLabel="Payment receipt"
      purpose={`Collection against ${invoice.number ?? "linked invoice"}`}
      number={payment.receiptNumber ?? "PROVISIONAL — NOT POSTED"}
      status={payment.status}
      primaryDateLabel="Payment date"
      primaryDate={payment.paidAt}
      secondaryDateLabel="Invoice due"
      secondaryDate={invoice.dueDate}
      company={invoice.companySnapshot}
      recipient={invoice.customerSnapshot}
      trackingCode={payment.trackingCode}
      footerNote="This receipt records the payment allocation shown above. Retain it with the related agreement and invoice. Contact the Joypurhat office if any printed detail differs from your records."
    >
      <section className={styles.receiptAmount}>
        <span>Amount received</span>
        <strong>{formatOfficeMoney(payment.amountMinor, payment.currency)}</strong>
        <p>{payment.method.replaceAll("_", " ")} · {payment.reference ?? "No external reference"}</p>
      </section>
      <dl className={styles.receiptFacts}>
        <div><dt>Related invoice</dt><dd>{invoice.number ?? invoice.id.slice(0, 8)}</dd></div>
        <div><dt>Payment note</dt><dd>{payment.note ?? "No additional note."}</dd></div>
        <div><dt>Allocated amount</dt><dd>{formatOfficeMoney(payment.allocatedMinor ?? payment.amountMinor, payment.currency)}</dd></div>
        <div><dt>Current invoice balance</dt><dd>{formatOfficeMoney(invoice.balanceMinor, invoice.currency)}</dd></div>
      </dl>
    </BrandedDocumentFrame>
  );
}

export function BrandedNoticeDocument({ notice }: { notice: OfficeNoticeView }) {
  return (
    <BrandedDocumentFrame
      typeLabel={notice.kind.replaceAll("_", " ")}
      purpose={notice.title}
      number={notice.number ?? "DRAFT — NOT ISSUED"}
      status={notice.status}
      primaryDateLabel="Issue date"
      primaryDate={notice.issueDate}
      secondaryDateLabel="Effective date"
      secondaryDate={notice.effectiveDate}
      company={notice.companySnapshot}
      recipient={notice.recipientSnapshot}
      trackingCode={notice.trackingCode}
      footerNote="This notice should be read with the referenced agreement, project record, or office correspondence. Contact Abdullah Properties to clarify any ambiguity before acting."
    >
      <section className={styles.noticeBody}>
        <span>Notice</span>
        <h2>{notice.title}</h2>
        {notice.body.split(/\n{2,}/).map((paragraph, index) => <p key={`${index}-${paragraph}`}>{paragraph}</p>)}
        {notice.expiresAt ? <p className={styles.noticeExpiry}>Valid until {formatOfficeDate(notice.expiresAt)}</p> : null}
      </section>
    </BrandedDocumentFrame>
  );
}

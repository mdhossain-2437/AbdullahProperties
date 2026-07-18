import { FileCheck2, ShieldCheck } from "lucide-react";
import {
  formatBdt,
  provisionalDocumentNumber,
  recordAmountMinor,
  recordDisplayName,
  type LocalOfficeRecord,
  type OfficeLocale,
} from "../offline/model";

type BrandedDocumentProps = {
  readonly record: LocalOfficeRecord;
};

type DocumentFact = Readonly<{
  label: string;
  value: string;
  emphasis?: boolean;
}>;

function translated(locale: OfficeLocale, english: string, bangla: string) {
  return locale === "bn" ? bangla : english;
}

function documentLocale(record: LocalOfficeRecord): OfficeLocale {
  return record.kind === "lead" ? "en" : record.payload.locale;
}

function formatDocumentDate(value: string, locale: OfficeLocale) {
  if (!value) return translated(locale, "Not scheduled", "নির্ধারিত নয়");
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function paymentMethod(method: "cash" | "bank_transfer" | "mobile_financial_service" | "cheque", locale: OfficeLocale) {
  const methods = {
    cash: translated(locale, "Cash", "নগদ"),
    bank_transfer: translated(locale, "Bank transfer", "ব্যাংক ট্রান্সফার"),
    mobile_financial_service: translated(locale, "Mobile financial service", "মোবাইল ফাইন্যান্সিয়াল সার্ভিস"),
    cheque: translated(locale, "Cheque", "চেক"),
  } as const;
  return methods[method];
}

function DocumentIdentity({ record }: BrandedDocumentProps) {
  const locale = documentLocale(record);
  const number = provisionalDocumentNumber(record);

  return (
    <header className="document-header">
      <div className="document-brand-lockup">
        <img src="/brand/logo-primary.png" alt="Abdullah Properties" />
        <p>
          <strong>{translated(locale, "Property services & land solutions", "প্রপার্টি সার্ভিস ও ভূমি সমাধান")}</strong>
          <span>{translated(locale, "Joypurhat, Bangladesh", "জয়পুরহাট, বাংলাদেশ")}</span>
        </p>
      </div>
      <div className="document-identity">
        <span className="document-status-chip">
          <i aria-hidden="true" />
          {translated(locale, "Local · provisional", "লোকাল · খসড়া")}
        </span>
        <strong>{number}</strong>
        <small>{translated(locale, "Not a server-issued number", "এটি সার্ভার থেকে ইস্যু করা নম্বর নয়")}</small>
      </div>
    </header>
  );
}

function DocumentFacts({ facts }: Readonly<{ facts: readonly DocumentFact[] }>) {
  return (
    <dl className="document-facts">
      {facts.map((fact) => (
        <div className={fact.emphasis ? "is-emphasis" : undefined} key={`${fact.label}-${fact.value}`}>
          <dt>{fact.label}</dt>
          <dd>{fact.value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function DocumentParty({
  eyebrow,
  name,
  lines,
}: Readonly<{ eyebrow: string; name: string; lines: readonly string[] }>) {
  return (
    <section className="document-party">
      <span>{eyebrow}</span>
      <h4>{name}</h4>
      {lines.filter(Boolean).map((line) => <p key={line}>{line}</p>)}
      {lines.every((line) => !line) ? <p>—</p> : null}
    </section>
  );
}

function DocumentTracking({ record }: BrandedDocumentProps) {
  const locale = documentLocale(record);

  return (
    <section className="local-reference-panel" aria-label={translated(locale, "Local tracking information", "লোকাল ট্র্যাকিং তথ্য")}>
      <div className="local-reference-mark" aria-hidden="true">
        <img src="/brand/logo-mark.png" alt="" />
      </div>
      <div>
        <span>{translated(locale, "Local tracking reference", "লোকাল ট্র্যাকিং রেফারেন্স")}</span>
        <code>{provisionalDocumentNumber(record)}</code>
        <p>{translated(
          locale,
          "The official number, verifiable QR and delivery notifications are generated only after secure server acceptance.",
          "নিরাপদ সার্ভারে অনুমোদনের পর অফিসিয়াল নম্বর, যাচাইযোগ্য QR এবং ডেলিভারি নোটিফিকেশন তৈরি হবে।",
        )}</p>
      </div>
    </section>
  );
}

function DocumentFooter({ record }: BrandedDocumentProps) {
  const locale = documentLocale(record);

  return (
    <footer className="document-footer">
      <div className="document-footer__contact">
        <strong>Abdullah Properties</strong>
        <span>2nd Floor, Pouro Market, Purbo Bazar, Joypurhat</span>
        <span>+880 1735-877654 · abdullahproperties.24@gmail.com</span>
      </div>
      <div className="document-footer__status">
        <strong>{translated(locale, "DRAFT · SERVER CONFIRMATION REQUIRED", "খসড়া · সার্ভার অনুমোদন প্রয়োজন")}</strong>
        <span>{translated(locale, "Local office copy · Page 1 of 1", "লোকাল অফিস কপি · পৃষ্ঠা ১ / ১")}</span>
      </div>
    </footer>
  );
}

function ProvisionalRibbon({ record }: BrandedDocumentProps) {
  const locale = documentLocale(record);

  return (
    <div className="document-status-ribbon" role="note">
      <span><FileCheck2 aria-hidden="true" />{translated(locale, "Prepared on this device", "এই ডিভাইসে প্রস্তুতকৃত")}</span>
      <span><ShieldCheck aria-hidden="true" />{translated(locale, "Awaiting secure server confirmation", "নিরাপদ সার্ভার অনুমোদনের অপেক্ষায়")}</span>
    </div>
  );
}

function DocumentFrame({
  record,
  children,
}: BrandedDocumentProps & Readonly<{ children: React.ReactNode }>) {
  const locale = documentLocale(record);

  return (
    <article
      className={`invoice-preview branded-document ${locale === "bn" ? "lang-bn" : "lang-en"}`}
      data-document-kind={record.kind}
      data-print-document="true"
      lang={locale}
    >
      <div className="document-accent-bar" aria-hidden="true"><span /></div>
      <img className="invoice-watermark" src="/brand/logo-mark.png" alt="" aria-hidden="true" />
      <DocumentIdentity record={record} />
      <ProvisionalRibbon record={record} />
      <div className="document-content">{children}</div>
      <DocumentTracking record={record} />
      <DocumentFooter record={record} />
    </article>
  );
}

function LeadDocument({ record }: Readonly<{ record: Extract<LocalOfficeRecord, { kind: "lead" }> }>) {
  return (
    <DocumentFrame record={record}>
      <div className="document-title-row">
        <div className="invoice-title">
          <span>Internal enquiry / অভ্যন্তরীণ অনুসন্ধান</span>
          <h3>Lead brief</h3>
          <p>Customer requirement and follow-up summary</p>
        </div>
        <div className={`document-priority is-${record.payload.priority}`}>
          <span>Priority</span>
          <strong>{record.payload.priority === "high" ? "High" : "Normal"}</strong>
        </div>
      </div>
      <div className="document-parties">
        <DocumentParty
          eyebrow="Prospective customer / সম্ভাব্য গ্রাহক"
          name={record.payload.customerName}
          lines={[record.payload.phone, record.payload.location]}
        />
        <DocumentParty
          eyebrow="Requirement / প্রয়োজন"
          name={record.payload.interest}
          lines={[record.payload.followUpDate ? `Follow-up · ${formatDocumentDate(record.payload.followUpDate, "en")}` : "Follow-up not scheduled"]}
        />
      </div>
      <DocumentFacts facts={[
        { label: "Lead status", value: "Saved locally" },
        { label: "Preferred location", value: record.payload.location || "Not provided" },
        { label: "Follow-up date", value: formatDocumentDate(record.payload.followUpDate, "en") },
      ]} />
      <section className="document-notes-block">
        <span>Office notes / অফিস নোট</span>
        <p>{record.payload.notes || "No additional office notes were recorded."}</p>
      </section>
    </DocumentFrame>
  );
}

type InvoiceCopyKind = "customer" | "office";

const invoicePrintNoteLimit = 180;

function compactInvoiceNote(value: string) {
  if (value.length <= invoicePrintNoteLimit) return { text: value, truncated: false } as const;
  return {
    text: `${value.slice(0, invoicePrintNoteLimit - 1).trimEnd()}…`,
    truncated: true,
  } as const;
}

function InvoiceCopy({
  record,
  copyKind,
}: Readonly<{
  record: Extract<LocalOfficeRecord, { kind: "invoice_draft" }>;
  copyKind: InvoiceCopyKind;
}>) {
  const locale = record.payload.locale;
  const documentNumber = provisionalDocumentNumber(record);
  const copyLabel = copyKind === "customer"
    ? translated(locale, "Customer copy / গ্রাহক কপি", "গ্রাহক কপি / Customer copy")
    : translated(locale, "Office copy / অফিস কপি", "অফিস কপি / Office copy");
  const copyInstruction = copyKind === "customer"
    ? translated(locale, "For the customer after staff review", "কর্মীর পর্যালোচনার পর গ্রাহকের জন্য")
    : translated(locale, "Retain with the local office record", "লোকাল অফিস রেকর্ডের সঙ্গে সংরক্ষণ করুন");
  const titleId = `${copyKind}-${record.draft.draftId}-invoice-title`;
  const compactNote = compactInvoiceNote(record.payload.notes);

  return (
    <article
      className={`invoice-preview branded-document invoice-copy ${locale === "bn" ? "lang-bn" : "lang-en"}`}
      data-document-kind={record.kind}
      data-invoice-copy={copyKind}
      data-print-document="true"
      aria-labelledby={titleId}
      lang={locale}
    >
      <div className="document-accent-bar" aria-hidden="true"><span /></div>
      <img className="invoice-watermark" src="/brand/logo-mark-print.svg" alt="" aria-hidden="true" />

      <header className="invoice-copy__header">
        <div className="invoice-copy__brand">
          <img src="/brand/logo-primary.png" alt="Abdullah Properties" width="942" height="316" />
          <div>
            <strong>{translated(locale, "Property services & land solutions", "প্রপার্টি সার্ভিস ও ভূমি সমাধান")}</strong>
            <span>{translated(locale, "Joypurhat, Bangladesh", "জয়পুরহাট, বাংলাদেশ")}</span>
          </div>
        </div>
        <div className="invoice-copy__copy-label">
          <strong>{copyLabel}</strong>
          <span>{copyInstruction}</span>
        </div>
      </header>

      <div className="invoice-copy__status" role="note">
        <strong>{translated(locale, "PROVISIONAL DRAFT · NOT A RECEIPT", "খসড়া ডকুমেন্ট · রসিদ নয়")}</strong>
        <span>{translated(locale, "Server confirmation and official number pending", "সার্ভার অনুমোদন ও অফিসিয়াল নম্বর অপেক্ষমাণ")}</span>
        <code>{documentNumber}</code>
      </div>

      <div className="invoice-copy__title-row">
        <div className="invoice-title">
          <span>{translated(locale, "Invoice / হিসাব বিবরণী", "হিসাব বিবরণী / Invoice")}</span>
          <h3 id={titleId}>{translated(locale, "Provisional invoice", "খসড়া ইনভয়েস")}</h3>
        </div>
        <div className="invoice-copy__amount" aria-label={translated(locale, "Provisional total amount", "খসড়া সর্বমোট অর্থ")}>
          <span>{translated(locale, "Provisional total", "খসড়া সর্বমোট")}</span>
          <strong>{formatBdt(record.payload.amountMinor)}</strong>
          <small>BDT</small>
        </div>
      </div>

      <dl className="invoice-copy__facts">
        <div>
          <dt>{translated(locale, "Customer", "গ্রাহক")}</dt>
          <dd>{record.payload.customerName}</dd>
          <span>{[record.payload.phone, record.payload.email].filter(Boolean).join(" · ") || "—"}</span>
        </div>
        <div>
          <dt>{translated(locale, "Issue date", "ইস্যুর তারিখ")}</dt>
          <dd>{formatDocumentDate(record.payload.issueDate, locale)}</dd>
        </div>
        <div>
          <dt>{translated(locale, "Due date", "পরিশোধের তারিখ")}</dt>
          <dd>{formatDocumentDate(record.payload.dueDate, locale)}</dd>
        </div>
      </dl>

      <table className="document-line-items invoice-copy__items">
        <caption className="sr-only">{translated(locale, "Recorded invoice item and amount", "রেকর্ডকৃত ইনভয়েস বিবরণ ও অর্থ")}</caption>
        <thead>
          <tr>
            <th>{translated(locale, "Recorded service / details", "রেকর্ডকৃত সেবা / বিবরণ")}</th>
            <th>{translated(locale, "Qty", "পরিমাণ")}</th>
            <th>{translated(locale, "Rate", "একক মূল্য")}</th>
            <th>{translated(locale, "Amount", "মোট")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{record.payload.purpose}</td>
            <td>1</td>
            <td>{formatBdt(record.payload.amountMinor)}</td>
            <td>{formatBdt(record.payload.amountMinor)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th colSpan={3}>{translated(locale, "Subtotal / provisional total", "উপমোট / খসড়া সর্বমোট")}</th>
            <td>{formatBdt(record.payload.amountMinor)}</td>
          </tr>
        </tfoot>
      </table>
      <p className="invoice-copy__amount-boundary">{translated(
        locale,
        "Only the amount recorded in this local draft is shown; no additional charge, tax, discount or prior balance is implied.",
        "এই লোকাল খসড়ায় রেকর্ড করা অর্থই শুধু দেখানো হয়েছে; অতিরিক্ত চার্জ, কর, ছাড় বা আগের বকেয়া ধরে নেওয়া হয়নি।",
      )}</p>

      {record.payload.notes ? (
        <section className="invoice-copy__notes">
          <strong>{translated(locale, "Recorded note", "রেকর্ডকৃত নোট")}</strong>
          <p>{compactNote.text}</p>
          {compactNote.truncated ? <span>{translated(locale, "Full note retained in the local digital record.", "সম্পূর্ণ নোট লোকাল ডিজিটাল রেকর্ডে সংরক্ষিত আছে।")}</span> : null}
        </section>
      ) : null}

      <div className="invoice-copy__signatures" aria-label={translated(locale, "Signature fields", "স্বাক্ষরের ঘর")}>
        <div>
          <span aria-hidden="true" />
          <strong>{translated(locale, "Prepared by", "প্রস্তুতকারক")}</strong>
          <small>{translated(locale, "Name, signature & date", "নাম, স্বাক্ষর ও তারিখ")}</small>
        </div>
        <div>
          <span aria-hidden="true" />
          <strong>{translated(locale, "Customer received", "গ্রাহকের প্রাপ্তি")}</strong>
          <small>{translated(locale, "Name, signature & date", "নাম, স্বাক্ষর ও তারিখ")}</small>
        </div>
      </div>

      <footer className="invoice-copy__footer">
        <div>
          <strong>Abdullah Properties</strong>
          <span>2nd Floor, Pouro Market, Purbo Bazar, Joypurhat</span>
          <span>+880 1735-877654 · abdullahproperties.24@gmail.com</span>
        </div>
        <p>{translated(
          locale,
          "A signature acknowledges receipt of this draft only. It does not confirm payment, booking, approval or a binding property transaction.",
          "স্বাক্ষর শুধু এই খসড়া কপি পাওয়ার স্বীকৃতি। এটি পরিশোধ, বুকিং, অনুমোদন বা বাধ্যতামূলক প্রপার্টি লেনদেন নিশ্চিত করে না।",
        )}</p>
      </footer>
    </article>
  );
}

function InvoiceDocument({ record }: Readonly<{ record: Extract<LocalOfficeRecord, { kind: "invoice_draft" }> }>) {
  const locale = record.payload.locale;
  return (
    <section
      className="invoice-print-sheet"
      data-invoice-print-sheet="a4-two-up"
      aria-label={translated(locale, "Two-copy provisional invoice print sheet", "দুই কপির খসড়া ইনভয়েস প্রিন্ট শিট")}
    >
      <InvoiceCopy record={record} copyKind="customer" />
      <div className="invoice-cut-line" role="separator" aria-label={translated(locale, "Cut between customer and office copies", "গ্রাহক ও অফিস কপির মাঝখানে কাটুন")}>
        <span>{translated(locale, "✂ Cut here / এখানে কাটুন", "✂ এখানে কাটুন / Cut here")}</span>
      </div>
      <InvoiceCopy record={record} copyKind="office" />
    </section>
  );
}

function PaymentDocument({ record }: Readonly<{ record: Extract<LocalOfficeRecord, { kind: "payment_acknowledgement" }> }>) {
  const locale = record.payload.locale;
  return (
    <DocumentFrame record={record}>
      <div className="document-title-row">
        <div className="invoice-title">
          <span>{translated(locale, "Payment record / পেমেন্ট রেকর্ড", "পেমেন্ট রেকর্ড / Payment record")}</span>
          <h3>{translated(locale, "Provisional acknowledgement", "খসড়া পরিশোধ স্বীকৃতি")}</h3>
          <p>{translated(locale, "Local entry only — not an official receipt", "শুধু লোকাল এন্ট্রি — অফিসিয়াল রসিদ নয়")}</p>
        </div>
        <div className="document-total-card is-payment">
          <span>{translated(locale, "Amount recorded", "রেকর্ডকৃত অর্থ")}</span>
          <strong>{formatBdt(record.payload.amountMinor)}</strong>
          <small>{translated(locale, "Confirmation pending", "অনুমোদন অপেক্ষমাণ")}</small>
        </div>
      </div>
      <div className="document-parties">
        <DocumentParty
          eyebrow={translated(locale, "Recorded for", "যাঁর নামে রেকর্ড")}
          name={record.payload.customerName}
          lines={[record.payload.phone, record.payload.email]}
        />
        <DocumentParty
          eyebrow={translated(locale, "Payment context", "পেমেন্ট তথ্য")}
          name={record.payload.invoiceReference || translated(locale, "No invoice reference", "ইনভয়েস রেফারেন্স নেই")}
          lines={[`${translated(locale, "Recorded", "রেকর্ডের তারিখ")} · ${formatDocumentDate(record.payload.paidAt, locale)}`]}
        />
      </div>
      <DocumentFacts facts={[
        { label: translated(locale, "Method", "পদ্ধতি"), value: paymentMethod(record.payload.method, locale) },
        { label: translated(locale, "Transaction reference", "লেনদেন রেফারেন্স"), value: record.payload.reference || "—" },
        { label: translated(locale, "Local amount", "লোকাল পরিমাণ"), value: formatBdt(record.payload.amountMinor), emphasis: true },
      ]} />
      <div className="document-verification-note">
        <ShieldCheck aria-hidden="true" />
        <p><strong>{translated(locale, "Receipt status", "রসিদের অবস্থা")}</strong>{translated(
          locale,
          "This acknowledgement does not prove settlement. An authorised receipt is available only after server-side validation and posting.",
          "এই স্বীকৃতি চূড়ান্ত পরিশোধের প্রমাণ নয়। সার্ভারে যাচাই ও পোস্টিংয়ের পর অনুমোদিত রসিদ পাওয়া যাবে।",
        )}</p>
      </div>
      {record.payload.notes ? (
        <section className="document-notes-block">
          <span>{translated(locale, "Notes", "নোট")}</span>
          <p>{record.payload.notes}</p>
        </section>
      ) : null}
    </DocumentFrame>
  );
}

function NoticeDocument({ record }: Readonly<{ record: Extract<LocalOfficeRecord, { kind: "notice_draft" }> }>) {
  const locale = record.payload.locale;
  return (
    <DocumentFrame record={record}>
      <div className="document-title-row notice-title-row">
        <div className="invoice-title">
          <span>{translated(locale, "Notice / নোটিশ", "নোটিশ / Notice")}</span>
          <h3>{translated(locale, "Provisional notice", "খসড়া নোটিশ")}</h3>
          <p>{translated(locale, "Prepared locally for review and approval", "পর্যালোচনা ও অনুমোদনের জন্য লোকালি প্রস্তুত")}</p>
        </div>
      </div>
      <div className="document-parties">
        <DocumentParty
          eyebrow={translated(locale, "Recipient", "প্রাপক")}
          name={record.payload.recipientName}
          lines={[record.payload.phone, record.payload.email]}
        />
        <DocumentParty
          eyebrow={translated(locale, "Effective date", "কার্যকর হওয়ার তারিখ")}
          name={formatDocumentDate(record.payload.effectiveDate, locale)}
          lines={[translated(locale, "Dispatch pending server approval", "সার্ভার অনুমোদনের আগে প্রেরণ করা হবে না")]}
        />
      </div>
      <section className="notice-letter">
        <span>{translated(locale, "Subject", "বিষয়")}</span>
        <h4>{record.payload.subject}</h4>
        <div className="notice-body">
          {record.payload.body.split("\n").map((paragraph, index) => <p key={`${index}-${paragraph}`}>{paragraph || "\u00a0"}</p>)}
        </div>
      </section>
    </DocumentFrame>
  );
}

export function BrandedDocument({ record }: BrandedDocumentProps) {
  switch (record.kind) {
    case "lead":
      return <LeadDocument record={record} />;
    case "invoice_draft":
      return <InvoiceDocument record={record} />;
    case "payment_acknowledgement":
      return <PaymentDocument record={record} />;
    case "notice_draft":
      return <NoticeDocument record={record} />;
  }
}

export function documentAmount(record: LocalOfficeRecord) {
  if (recordAmountMinor(record) > 0) return formatBdt(recordAmountMinor(record));
  if (record.kind === "lead") return record.payload.priority === "high" ? "High priority" : "Normal priority";
  if (record.kind === "notice_draft") return record.payload.effectiveDate;
  return recordDisplayName(record);
}

import Link from "next/link";
import { LegalPage, type LegalPageSection } from "@/components/layout/legal-page";
import { company } from "@/lib/company-data";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Website Terms & Conditions",
  description:
    "Terms for using the Abdullah Properties website, enquiry tools, property information, and linked services.",
  path: "/terms",
  image: "/og/about.jpg",
});

const sections: readonly LegalPageSection[] = [
  {
    id: "acceptance",
    title: "Using this website",
    paragraphs: [
      <>
        These terms apply when you access or use the {company.name} website. If you do not agree with
        them, please stop using the website. Separate signed documents govern any property, development,
        joint-venture, consultancy, or other commercial engagement.
      </>,
    ],
  },
  {
    id: "information-only",
    title: "Information, not an offer",
    paragraphs: [
      <>
        Website content is general information. It is not a sale offer, reservation, title opinion,
        valuation, approval, warranty, financial recommendation, or legal advice. Images may be
        illustrative, and availability, ownership, dimensions, pricing, specifications, approvals, and
        completion dates must be confirmed in current written documents.
      </>,
      <>
        The <Link href="/property-disclaimer">Property Information Disclaimer</Link> explains these
        limits in more detail.
      </>,
    ],
  },
  {
    id: "enquiries",
    title: "Enquiries and communications",
    paragraphs: [
      <>
        Completing the website&apos;s local enquiry-preparation step does not submit a request or create a
        contract. A communication is sent only if you choose an external email, telephone, or WhatsApp
        option and complete that action. A response, site visit, discussion, or proposal does not itself
        reserve a property or bind either party unless an authorised written agreement says so.
      </>,
      <>
        You are responsible for providing accurate, lawful information and for checking the recipient,
        content, and attachments before sending through an external service.
      </>,
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    paragraphs: [<>You must not use the website to:</>],
    items: [
      "break applicable law, misrepresent your identity, or infringe another person's rights;",
      "send malicious code, attempt unauthorised access, probe security controls, or disrupt availability;",
      "scrape, reproduce, or commercially exploit content in a way that is not authorised;",
      "submit unlawful, deceptive, abusive, or unnecessary sensitive information; or",
      "suggest that Abdullah Properties has approved or endorsed a statement without written authority.",
    ],
  },
  {
    id: "ownership",
    title: "Content and brand ownership",
    paragraphs: [
      <>
        Unless another owner is identified, the website&apos;s branding, written content, interface, and
        original visual material belong to Abdullah Properties or are used with permission. You may
        view and share a link for personal, non-commercial purposes. No licence to copy a logo, remove a
        notice, create a confusing brand, or republish substantial content is granted by accessing the
        website.
      </>,
      <>
        Approved logo files and usage guidance, where published, are available through the{" "}
        <Link href="/brand-kit">Brand Kit</Link>. Those files remain subject to the stated brand rules.
      </>,
    ],
  },
  {
    id: "third-parties",
    title: "Third-party services and links",
    paragraphs: [
      <>
        Links to mapping, email, telephone, messaging, social, or other services are provided for
        convenience. Abdullah Properties does not control their availability, security, content, or
        privacy practices and is not responsible for a transaction you enter into with a third party.
      </>,
    ],
  },
  {
    id: "availability",
    title: "Accuracy and availability",
    paragraphs: [
      <>
        Reasonable care is taken when publishing website information, but content may contain an error
        or become outdated. The website may be changed, suspended, or unavailable for maintenance,
        security, provider failure, or circumstances outside reasonable control. Please report a
        material error before relying on it.
      </>,
    ],
  },
  {
    id: "liability",
    title: "Responsibility and liability",
    paragraphs: [
      <>
        To the extent permitted by applicable law, Abdullah Properties is not responsible for a loss
        caused solely by reliance on unconfirmed website content, an external service, unauthorised use,
        or an event outside reasonable control. Nothing in these terms excludes a responsibility that
        cannot lawfully be excluded. Rights and remedies in a signed agreement remain subject to that
        agreement.
      </>,
    ],
  },
  {
    id: "law-changes",
    title: "Applicable terms and changes",
    paragraphs: [
      <>
        These website terms are intended to operate consistently with applicable laws of Bangladesh.
        A property or project agreement may contain separate governing-law, dispute, and notice terms.
        This page may be updated as the website or services change; the effective date identifies the
        version then published.
      </>,
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Website rules"
      index="11"
      title="Website Terms & Conditions"
      description="Clear boundaries for website content, enquiry preparation, brand use, and external services."
      path="/terms"
      effectiveDate="12 July 2026"
      effectiveDateTime="2026-07-12"
      summary={
        <p>
          The website helps people understand Abdullah Properties and prepare a direct enquiry. It does
          not complete a booking, transfer ownership, accept a payment, or replace verified documents
          and a signed agreement.
        </p>
      }
      sections={sections}
      reviewNote={
        <p>
          These are website terms, not a substitute for transaction-specific legal documents. Property
          and project agreements should be reviewed by appropriately qualified advisers before signing.
        </p>
      }
    />
  );
}

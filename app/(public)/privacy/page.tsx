import Link from "next/link";
import { LegalPage, type LegalPageSection } from "@/components/layout/legal-page";
import { company } from "@/lib/company-data";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Privacy Policy",
  description:
    "How Abdullah Properties handles website enquiries, direct communications, hosting data, and privacy requests.",
  path: "/privacy",
  image: "/og/contact.jpg",
});

const sections: readonly LegalPageSection[] = [
  {
    id: "scope",
    title: "Who this policy covers",
    paragraphs: [
      <>
        This policy describes how {company.name} handles personal information connected with this
        website and direct property enquiries. The business contact point is {company.address.line1},{" "}
        {company.address.line2}, {company.address.country}.
      </>,
      <>
        It applies to this website. A third-party website or communication service linked from it has
        its own privacy terms and controls.
      </>,
    ],
  },
  {
    id: "information",
    title: "Information that may be handled",
    paragraphs: [
      <>
        The enquiry planner prepares the details you enter inside your browser. It does not send those
        details to Abdullah Properties merely because you type them or complete the local validation
        step. Information leaves the page only when you choose a direct contact option such as email,
        telephone, or WhatsApp and continue in that external service.
      </>,
      <>
        Once you contact the company, the message may include your name, contact details, property
        interest, location, budget context, preferred time, and any other information you decide to
        provide. Please do not send passwords, payment-card details, or unnecessary identity documents
        through an initial enquiry.
      </>,
      <>
        The website host, content-delivery network, or security provider may process technical records
        such as an IP address, device or browser information, request time, requested URL, and security
        events to deliver and protect the service.
      </>,
    ],
  },
  {
    id: "use",
    title: "Why information is used",
    paragraphs: [
      <>Information received through a direct communication may be used to:</>,
    ],
    items: [
      "understand and respond to an enquiry or arrange a requested follow-up;",
      "review a site, property, project, or documentation request after appropriate checks;",
      "maintain relevant correspondence and records of agreed next steps;",
      "protect the website, prevent misuse, and investigate security incidents; and",
      "meet a legal obligation or establish, exercise, or defend a legal claim where applicable.",
    ],
  },
  {
    id: "sharing",
    title: "Sharing and external services",
    paragraphs: [
      <>
        Abdullah Properties does not sell personal information. Relevant information may be shared with
        personnel or professional advisers involved in an enquiry, or with hosting, email,
        telecommunications, security, and messaging providers that make the chosen service possible.
        It may also be disclosed when required by applicable law or a valid authority request.
      </>,
      <>
        Email, telephone, and WhatsApp are external communication channels. When you select one, that
        provider may process your information under its own terms, potentially in another country.
      </>,
    ],
  },
  {
    id: "retention",
    title: "Retention and deletion",
    paragraphs: [
      <>
        Information prepared only in the browser is not retained by Abdullah Properties through this
        website. Information sent through a direct communication may be kept for as long as reasonably
        needed to manage the enquiry, preserve relevant business records, resolve a dispute, or meet an
        applicable legal obligation. Retention depends on the nature and status of the matter rather
        than a single fixed period.
      </>,
      <>
        A deletion request can be made using the contact details below. Some records may need to be
        retained where deletion would conflict with an applicable obligation or the protection of legal
        rights.
      </>,
    ],
  },
  {
    id: "choices",
    title: "Your choices and requests",
    paragraphs: [
      <>
        Depending on applicable law and the circumstances, you may ask what information is held about
        you, request a correction or deletion, object to certain handling, or withdraw a consent you
        previously gave. Identity may need to be reasonably verified before a request is completed.
      </>,
      <>
        For information about browser storage and third-party services, read the{" "}
        <Link href="/cookies">Cookie Policy</Link>.
      </>,
    ],
  },
  {
    id: "security",
    title: "Security and children",
    paragraphs: [
      <>
        Reasonable technical and organisational safeguards are used in proportion to the website and
        information handled, but no internet or messaging service can be guaranteed completely secure.
      </>,
      <>
        This website is intended for adults making property or business decisions. Abdullah Properties
        does not knowingly seek personal information from children. A parent or guardian who believes a
        child has supplied information may request its review or deletion.
      </>,
    ],
  },
  {
    id: "changes",
    title: "Policy changes",
    paragraphs: [
      <>
        This policy may be updated when the website, contact process, providers, or applicable
        requirements change. The effective date on this page identifies the published version.
      </>,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Trust & data"
      index="10"
      title="Privacy Policy"
      description="A plain-language account of what the website handles, when information leaves your browser, and how to make a privacy request."
      path="/privacy"
      effectiveDate="12 July 2026"
      effectiveDateTime="2026-07-12"
      summary={
        <p>
          The website does not provide accounts, accept payments, or run first-party analytics at the
          date shown. Preparing an enquiry is local; choosing email, telephone, or WhatsApp starts a
          separate, direct communication.
        </p>
      }
      sections={sections}
    />
  );
}

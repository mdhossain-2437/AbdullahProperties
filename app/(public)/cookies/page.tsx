import Link from "next/link";
import { LegalPage, type LegalPageSection } from "@/components/layout/legal-page";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Cookie Policy",
  description:
    "Current cookie and browser-storage practices for the Abdullah Properties website and linked external services.",
  path: "/cookies",
  image: "/og/contact.jpg",
});

const sections: readonly LegalPageSection[] = [
  {
    id: "meaning",
    title: "What cookies are",
    paragraphs: [
      <>
        Cookies are small text records a website or service can place in a browser. Similar technologies
        include local storage, session storage, and security identifiers. They can support core
        operation, remember a preference, measure use, or enable advertising, depending on how they are
        configured.
      </>,
    ],
  },
  {
    id: "current-use",
    title: "Current website use",
    paragraphs: [
      <>
        At the effective date shown, this website does not intentionally set optional first-party
        analytics, advertising, personalisation, account, or payment cookies. The enquiry planner works
        locally in the open page and does not create a website account or transmit a message by itself.
      </>,
      <>
        Hosting, content-delivery, or security infrastructure may use strictly necessary cookies or
        comparable request identifiers to deliver the website, balance traffic, prevent abuse, or
        preserve service integrity. Those controls are operated at the infrastructure boundary and may
        change when providers or security requirements change.
      </>,
    ],
  },
  {
    id: "external-services",
    title: "External communication and links",
    paragraphs: [
      <>
        Choosing an email, telephone, WhatsApp, map, or other external link leaves or opens a service
        outside this website. That service may set its own cookies or use stored account information
        under its own policy. Abdullah Properties does not control those external technologies.
      </>,
    ],
  },
  {
    id: "controls",
    title: "Browser controls",
    paragraphs: [
      <>
        Most browsers let you view, block, or delete cookies and site data. Blocking strictly necessary
        technology may prevent a website or external service from working correctly. Instructions are
        normally available in the browser&apos;s privacy or site-settings menu.
      </>,
      <>
        Clearing page data or closing the browser may also remove locally prepared form information,
        depending on the browser and the page state.
      </>,
    ],
  },
  {
    id: "consent",
    title: "Future optional technologies",
    paragraphs: [
      <>
        If optional analytics, advertising, or comparable non-essential technology is introduced, this
        policy and any required consent controls should be updated before that technology is enabled.
        The absence of a cookie banner currently reflects the published no-optional-cookie setup, not a
        blanket claim that infrastructure never processes technical data.
      </>,
    ],
  },
  {
    id: "privacy",
    title: "More privacy information",
    paragraphs: [
      <>
        Read the <Link href="/privacy">Privacy Policy</Link> for information about direct enquiries,
        hosting records, external providers, retention, and privacy requests.
      </>,
    ],
  },
];

export default function CookiePolicyPage() {
  return (
    <LegalPage
      eyebrow="Browser privacy"
      index="12"
      title="Cookie Policy"
      description="A precise record of the website's current browser-storage approach, without implying technology that is not deployed."
      path="/cookies"
      effectiveDate="12 July 2026"
      effectiveDateTime="2026-07-12"
      summary={
        <p>
          No optional first-party analytics, advertising, account, or payment cookies are intentionally
          used at publication. Essential hosting and security infrastructure may still process technical
          identifiers needed to operate and protect the website.
        </p>
      }
      sections={sections}
    />
  );
}

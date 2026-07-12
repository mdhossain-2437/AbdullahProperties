import { LegalPage, type LegalPageSection } from "@/components/layout/legal-page";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Accessibility Statement",
  description:
    "The Abdullah Properties commitment to accessible website navigation, content, motion, feedback, and alternative support.",
  path: "/accessibility",
  image: "/og/about.jpg",
});

const sections: readonly LegalPageSection[] = [
  {
    id: "commitment",
    title: "Our commitment",
    paragraphs: [
      <>
        Abdullah Properties aims to make its website understandable and usable for as many people as
        reasonably possible, including people who navigate with a keyboard, zoom content, use assistive
        technology, or reduce motion. Accessibility is treated as an ongoing product and content
        responsibility.
      </>,
      <>
        This statement describes the intended standard and support route. It is not a certification that
        every page or third-party service meets a particular conformance level.
      </>,
    ],
  },
  {
    id: "measures",
    title: "Measures used on the website",
    paragraphs: [<>The website is designed to support:</>],
    items: [
      "semantic headings, landmarks, labels, and meaningful link text;",
      "keyboard access and visible focus treatment for interactive controls;",
      "text alternatives for meaningful images and decorative treatment hidden from assistive technology;",
      "responsive layouts, text resizing, and readable contrast;",
      "clear validation and status messages for interactive forms; and",
      "reduced-motion preferences where animation is used.",
    ],
  },
  {
    id: "limitations",
    title: "Known boundaries",
    paragraphs: [
      <>
        Third-party email, telephone, WhatsApp, map, hosting, or linked services are outside direct
        website control and may have different accessibility support. Visual project studies and future
        scanned property documents may also need a text explanation or an alternative format to be fully
        useful.
      </>,
      <>
        If motion or imagery makes content difficult to use, enable the device&apos;s reduced-motion setting
        or ask for the information in text. If a route, control, document, or description creates a
        barrier, report the exact page and task so the issue can be reproduced.
      </>,
    ],
  },
  {
    id: "feedback",
    title: "Accessibility feedback",
    paragraphs: [
      <>
        When reporting a barrier, include the page address, the action you were trying to complete, the
        browser or assistive technology if comfortable sharing it, and the format or adjustment that
        would help. Do not include passwords or unnecessary identity information.
      </>,
      <>
        Abdullah Properties will review a report and aim to provide a practical response or alternative.
        Resolution time depends on the issue, available evidence, and whether an external provider is
        involved; no fixed response time is promised on this page.
      </>,
    ],
  },
  {
    id: "alternatives",
    title: "Alternative access",
    paragraphs: [
      <>
        If you cannot use the website enquiry flow, contact the office by email or telephone using the
        details below. Ask for a plain-text explanation, verbal discussion, or another reasonable format
        for the information you need.
      </>,
    ],
  },
  {
    id: "improvement",
    title: "Ongoing improvement",
    paragraphs: [
      <>
        Accessibility checks should continue as pages, media, forms, and services change. Material
        updates to the approach or known limitations will be reflected here with a new effective date.
      </>,
    ],
  },
];

export default function AccessibilityPage() {
  return (
    <LegalPage
      eyebrow="Inclusive access"
      index="14"
      title="Accessibility Statement"
      description="How the website approaches keyboard access, meaningful content, reduced motion, and practical support when a barrier remains."
      path="/accessibility"
      effectiveDate="12 July 2026"
      effectiveDateTime="2026-07-12"
      summary={
        <p>
          Abdullah Properties aims to provide clear, navigable property information and a usable path to
          direct support. Accessibility feedback is specific, actionable product feedback and is welcomed.
        </p>
      }
      sections={sections}
    />
  );
}

import { LegalPage, type LegalPageSection } from "@/components/layout/legal-page";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Property Information Disclaimer",
  description:
    "Important limits for Abdullah Properties imagery, project descriptions, availability, specifications, approvals, and property decisions.",
  path: "/property-disclaimer",
  image: "/og/projects.jpg",
});

const sections: readonly LegalPageSection[] = [
  {
    id: "illustrative-content",
    title: "Illustrative content",
    paragraphs: [
      <>
        Unless a page expressly identifies an image or plan as an approved, current project record,
        photographs, renders, plans, diagrams, maps, and visual studies are illustrative brand or design
        material. They must not be treated as evidence of a completed project, ownership, availability,
        specification, view, finish, furniture, landscaping, or surrounding development.
      </>,
    ],
  },
  {
    id: "availability-pricing",
    title: "Availability, pricing, and specifications",
    paragraphs: [
      <>
        Property availability, price, payment schedule, area, dimensions, floor plan, parking, utilities,
        materials, facilities, delivery date, and other specifications can change and require current
        written confirmation. Website content does not hold a unit, create priority, or lock a price.
      </>,
      <>
        Measurements may be described using different conventions, such as gross, saleable, common, or
        usable area. The applicable method and exclusions must be identified in the relevant approved
        documents before comparison or commitment.
      </>,
    ],
  },
  {
    id: "ownership-approvals",
    title: "Ownership, title, and approvals",
    paragraphs: [
      <>
        A website statement is not proof of title, authority, mutation, tax status, encumbrance status,
        planning permission, building approval, utility approval, code compliance, or registration.
        Those matters require original or authenticated records, appropriate searches, and review by
        qualified professionals and relevant authorities.
      </>,
      <>
        No specific authority approval, engineering certification, earthquake standard, registration,
        or legal status should be inferred unless it is identified in a current project document that
        can be independently checked.
      </>,
    ],
  },
  {
    id: "due-diligence",
    title: "Independent due diligence",
    paragraphs: [
      <>
        Before paying, reserving, transferring, investing, signing, or beginning work, obtain advice
        appropriate to the decision. This may include independent legal, survey, engineering,
        architectural, tax, financial, environmental, and valuation review. Visit the location and
        verify material statements directly.
      </>,
      <>
        Abdullah Properties may coordinate information or professional follow-through, but that does not
        replace the independent duty of each party and adviser to verify the evidence within their
        scope.
      </>,
    ],
  },
  {
    id: "joint-venture",
    title: "Joint-venture and development discussions",
    paragraphs: [
      <>
        A joint-venture or development conversation is exploratory until land status, authority,
        feasibility, scope, responsibilities, commercial terms, risk allocation, and approvals are
        recorded in signed documents. No return, saving, construction duration, completion date, or
        outcome is guaranteed by general website language.
      </>,
    ],
  },
  {
    id: "written-record",
    title: "The written record controls",
    paragraphs: [
      <>
        Where website content differs from a valid, current, authorised, signed agreement or approved
        project document, that formal record governs to the extent stated in it. Confirm the version,
        signatories, schedules, drawings, specifications, exclusions, change process, payment terms,
        handover conditions, and dispute provisions before signing.
      </>,
    ],
  },
  {
    id: "reporting",
    title: "Report a material error",
    paragraphs: [
      <>
        If you identify an outdated project statement, incorrect location, unauthorised image, or other
        material discrepancy, contact Abdullah Properties with the page address and supporting detail so
        it can be reviewed. Do not rely on the disputed statement while that review is pending.
      </>,
    ],
  },
];

export default function PropertyDisclaimerPage() {
  return (
    <LegalPage
      eyebrow="Verify before commitment"
      index="13"
      title="Property Information Disclaimer"
      description="The evidence standard for imagery, listings, project claims, due diligence, and signed property decisions."
      path="/property-disclaimer"
      effectiveDate="12 July 2026"
      effectiveDateTime="2026-07-12"
      summary={
        <p>
          Website content begins a conversation; it does not prove ownership, approval, availability,
          price, measurement, or delivery. Verify material facts and obtain appropriate independent
          advice before making a property or project commitment.
        </p>
      }
      sections={sections}
      reviewNote={
        <p>
          No page should be read as a guarantee of approval, performance, savings, return, timing,
          structural standard, or legal outcome unless an authorised signed document expressly provides
          it.
        </p>
      }
    />
  );
}

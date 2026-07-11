import type { Metadata } from "next";
import { PageHero } from "@/components/layout/page-hero";
import { EnquiryForm } from "@/features/enquiries/enquiry-form";
import { getProperty } from "@/features/properties/data";

export const metadata: Metadata = {
  title: "Contact",
  description: "Prepare a clear property or development enquiry for Abdullah Properties in Joypurhat.",
};

type ContactPageProps = {
  searchParams: Promise<{ interest?: string }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { interest } = await searchParams;
  const initialInterest = interest ? getProperty(interest)?.title ?? "" : "";

  return (
    <main>
      <PageHero eyebrow="Direct enquiry" index="07" title="Start with the decision in front of you." description="Share the property context, the intended outcome, and what is uncertain. This preview prepares a validated enquiry without transmitting personal data." />
      <section className="content-section content-section--tint">
        <div className="site-shell enquiry-layout">
          <div className="enquiry-layout__intro"><span className="eyebrow">Consultation planner</span><h2>Make the first conversation useful.</h2><p>Production contact details, CRM destination, consent language, and retention policy require business approval. Until then, the form demonstrates validation and success state without silently losing a real enquiry.</p><div className="contact-principles"><span>01 / Clear purpose</span><span>02 / Verified contact</span><span>03 / Useful context</span></div></div>
          <EnquiryForm initialInterest={initialInterest} />
        </div>
      </section>
    </main>
  );
}

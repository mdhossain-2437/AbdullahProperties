import Link from "next/link";
import { Clock3, ExternalLink, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { EnquiryForm } from "@/features/enquiries/enquiry-form";
import { getProperty } from "@/features/properties/data";
import { company } from "@/lib/company-data";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Contact Abdullah Properties in Joypurhat",
  description:
    "Call, email, WhatsApp, or visit Abdullah Properties at Pouro Market, Purbo Bazar, Joypurhat for housing, land, and project enquiries.",
  path: "/contact",
  image: "/og/contact.jpg",
});

type ContactPageProps = {
  searchParams: Promise<{ interest?: string }>;
};

function normalizeInterest(value?: string) {
  if (!value) return "";
  const propertyTitle = getProperty(value)?.title;
  return (propertyTitle ?? value).replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, 100);
}

const mapQuery = encodeURIComponent(`${company.address.line1}, ${company.address.line2}, ${company.address.country}`);

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { interest } = await searchParams;
  const initialInterest = normalizeInterest(interest);

  return (
    <main>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }]} />
      <PageHero
        eyebrow="Direct enquiry"
        index="07"
        title="Talk to the Joypurhat office."
        description="Prepare the context here, then choose email or WhatsApp to send it through an external app—or call the published office numbers directly."
      />

      <section className="contact-details-section">
        <div className="site-shell contact-details-grid">
          <article><MapPin aria-hidden="true" /><span>Office</span><h2>{company.address.line1}</h2><p>{company.address.line2}, {company.address.country}</p><a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noreferrer">Open a map search <ExternalLink aria-hidden="true" /></a></article>
          <article><Phone aria-hidden="true" /><span>Telephone</span><h2><a href={company.phones[0].href}>{company.phones[0].display}</a></h2><p><a href={company.phones[1].href}>{company.phones[1].display}</a></p></article>
          <article><Mail aria-hidden="true" /><span>Email</span><h2><a href={`mailto:${company.email}`}>Send an email</a></h2><p>{company.email}</p></article>
          <article><Clock3 aria-hidden="true" /><span>Office hours</span><h2>Saturday–Thursday</h2><p>10:00 AM–8:00 PM</p><a href={company.whatsapp} target="_blank" rel="noreferrer">Open WhatsApp <MessageCircle aria-hidden="true" /></a></article>
        </div>
      </section>

      <section className="content-section content-section--tint">
        <div className="site-shell enquiry-layout">
          <div className="enquiry-layout__intro">
            <span className="eyebrow">Consultation planner</span>
            <h2>Make the first conversation useful.</h2>
            <p>
              This planner validates and formats your information locally in the browser. It sends nothing by itself. After preparation, you choose whether to open your email or WhatsApp app and send the message.
            </p>
            <div className="contact-principles"><span>01 / Clear purpose</span><span>02 / Verified channel</span><span>03 / Your review before send</span></div>
            <p className="contact-privacy-link">Read how information is handled in the <Link href="/privacy">Privacy Policy</Link>.</p>
          </div>
          <EnquiryForm key={initialInterest} initialInterest={initialInterest} />
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert } from "lucide-react";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { Button } from "@/components/ui/button";
import { AppImage as Image } from "@/components/ui/app-image";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Nirapad Nibas Project in Dhanmondi, Joypurhat",
  description:
    "A carefully bounded record of Abdullah Properties' Nirapad Nibas residential project in Dhanmondi, Joypurhat, with specifications pending owner-approved documentation.",
  path: "/projects/nirapad-nibas",
  image: "/og/projects.jpg",
});

const confirmationItems = [
  "Current ownership and legal documents",
  "Approved architectural drawings and floor areas",
  "Unit availability, pricing, and payment schedule",
  "Amenities, utilities, approvals, and delivery timeline",
] as const;

export default function NirapadNibasPage() {
  return (
    <main>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Projects", path: "/projects" }, { name: "Nirapad Nibas", path: "/projects/nirapad-nibas" }]} />
      <section className="detail-hero">
        <div className="site-shell">
          <div className="detail-hero__media">
            <Image src="/projects/housing-base-construction.jpg" alt="Illustrative Abdullah Properties construction delivery image" fill preload sizes="(max-width: 760px) 100vw, 1280px" />
            <div className="detail-hero__overlay" />
            <div className="detail-hero__content">
              <div><span className="eyebrow eyebrow--light">Published project record</span><h1>Nirapad Nibas</h1></div>
              <p>Residential project identified in company-supplied material. Final project facts require an approved current schedule.</p>
            </div>
          </div>
          <div className="detail-facts">
            <div><span>Published locality</span><strong>Dhanmondi, Joypurhat</strong></div>
            <div><span>Project type</span><strong>Residential housing</strong></div>
            <div><span>Availability</span><strong>Confirm directly</strong></div>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="site-shell editorial-grid">
          <div className="editorial-copy">
            <span className="eyebrow">What is safely published</span>
            <h2>Name and locality are consistent; specifications are not.</h2>
            <p>
              The supplied legacy website consistently identifies Nirapad Nibas in Dhanmondi, Joypurhat. It contains conflicting floor areas and balcony counts, so those details—and unsupported claims about approvals, savings, or guarantees—are intentionally excluded here.
            </p>
            <p className="inline-caution"><CircleAlert aria-hidden="true" /> The image is representative brand material, not verified evidence of the project&apos;s current construction state.</p>
          </div>
          <div>
            <span className="eyebrow">Confirm before commitment</span>
            <ul className="service-checklist">
              {confirmationItems.map((item) => <li key={item}><CheckCircle2 aria-hidden="true" /><span>{item}</span></li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="detail-cta">
        <div className="site-shell detail-cta__inner">
          <div><span className="eyebrow">Direct verification</span><h2>Ask for the current approved project record.</h2></div>
          <Button asChild className="brand-button brand-button--light"><Link href="/contact?interest=Nirapad%20Nibas">Contact Abdullah Properties <ArrowRight aria-hidden="true" /></Link></Button>
        </div>
      </section>
      <div className="site-shell back-link-wrap"><Link className="back-link" href="/projects"><ArrowLeft aria-hidden="true" /> Back to projects</Link></div>
    </main>
  );
}

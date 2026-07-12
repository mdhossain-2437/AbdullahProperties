import type { ReactNode } from "react";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { PageHero } from "@/components/layout/page-hero";
import { company } from "@/lib/company-data";

export type LegalPageSection = {
  id: string;
  title: string;
  paragraphs: readonly ReactNode[];
  items?: readonly ReactNode[];
};

type LegalPageProps = {
  eyebrow: string;
  index: string;
  title: string;
  description: string;
  path: string;
  effectiveDate: string;
  effectiveDateTime: string;
  summary: ReactNode;
  sections: readonly LegalPageSection[];
  reviewNote?: ReactNode;
};

export function LegalPage({
  eyebrow,
  index,
  title,
  description,
  path,
  effectiveDate,
  effectiveDateTime,
  summary,
  sections,
  reviewNote,
}: LegalPageProps) {
  return (
    <main>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: title, path },
        ]}
      />
      <PageHero eyebrow={eyebrow} index={index} title={title} description={description} />

      <section className="content-section legal-page-section">
        <div className="site-shell legal-page">
          <aside className="legal-page__index" aria-label="On this page">
            <p className="eyebrow">On this page</p>
            <ol>
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ol>
          </aside>

          <article className="legal-page__content">
            <header className="legal-page__intro">
              <p className="legal-page__date">
                Effective <time dateTime={effectiveDateTime}>{effectiveDate}</time>
              </p>
              <div className="legal-page__summary">{summary}</div>
              {reviewNote ? <div className="legal-page__notice">{reviewNote}</div> : null}
            </header>

            {sections.map((section, sectionIndex) => (
              <section className="legal-page__section" id={section.id} key={section.id}>
                <p className="legal-page__section-number" aria-hidden="true">
                  {String(sectionIndex + 1).padStart(2, "0")}
                </p>
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph, paragraphIndex) => (
                  <p key={`${section.id}-paragraph-${paragraphIndex}`}>{paragraph}</p>
                ))}
                {section.items?.length ? (
                  <ul>
                    {section.items.map((item, itemIndex) => (
                      <li key={`${section.id}-item-${itemIndex}`}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            <footer className="legal-page__contact">
              <p className="eyebrow">Questions or corrections</p>
              <h2>Talk to Abdullah Properties directly.</h2>
              <p>
                Email <a href={`mailto:${company.email}`}>{company.email}</a>, call{" "}
                <a href={company.phones[0].href}>{company.phones[0].display}</a>, or visit the{" "}
                <Link href="/contact">contact page</Link>.
              </p>
            </footer>
          </article>
        </div>
      </section>
    </main>
  );
}

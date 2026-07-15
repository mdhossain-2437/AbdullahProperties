import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import type { BengaliPublicPage } from "@/lib/i18n/bengali-public-content";
import { localizedPublicHref } from "@/lib/i18n/public-locale";
import { company } from "@/lib/company-data";

const styles = {
  breadcrumb: "breadcrumb",
  contactBand: "contactBand",
  contactBandGrid: "contactBandGrid",
  cta: "cta",
  ctaInner: "ctaInner",
  ctaLink: "ctaLink",
  eyebrow: "eyebrow",
  hero: "hero",
  heroActions: "heroActions",
  heroCopy: "heroCopy",
  heroDescription: "heroDescription",
  heroGrid: "heroGrid",
  heroImage: "heroImage",
  heroMedia: "heroMedia",
  heroShell: "heroShell",
  mediaCaption: "mediaCaption",
  mediaVeil: "mediaVeil",
  nextRoutes: "nextRoutes",
  nextRoutesHeading: "nextRoutesHeading",
  notice: "notice",
  page: "page",
  primaryAction: "primaryAction",
  routeCard: "routeCard",
  routeGrid: "routeGrid",
  secondaryAction: "secondaryAction",
  section: "section",
  sectionHeading: "sectionHeading",
  sections: "sections",
  story: "story",
  storyGrid: "storyGrid",
  storyIndex: "storyIndex",
} as const;

type BengaliPublicPageViewProps = {
  readonly page: BengaliPublicPage;
};

function bengaliHref(href: BengaliPublicPage["path"]) {
  return localizedPublicHref(href, "bn-BD");
}

export function BengaliPublicPageView({ page }: BengaliPublicPageViewProps) {
  return (
    <main className={styles.page} data-public-locale="bn-BD" lang="bn-BD">
      <section className={styles.hero} aria-labelledby="bengali-page-title">
        <div className={`site-shell ${styles.heroShell}`}>
          <nav className={styles.breadcrumb} aria-label="ব্রেডক্রাম্ব">
            <Link href="/bn">বাংলা হোম</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{page.eyebrow}</span>
          </nav>

          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>{page.eyebrow}</p>
              <h1 id="bengali-page-title">{page.title}</h1>
              <p className={styles.heroDescription}>{page.description}</p>
              <div className={styles.heroActions}>
                <Link className={styles.primaryAction} href={bengaliHref(page.cta.href)}>
                  {page.cta.label}
                  <ArrowRight aria-hidden="true" />
                </Link>
                <a className={styles.secondaryAction} href={company.phones[0].href}>
                  <Phone aria-hidden="true" />
                  কল করুন
                </a>
              </div>
            </div>

            <div className={styles.heroMedia}>
              <AppImage
                className={styles.heroImage}
                src={page.image}
                alt={page.imageAlt}
                fill
                preload
                sizes="(max-width: 820px) 100vw, 46vw"
              />
              <div className={styles.mediaVeil} aria-hidden="true" />
              <div className={styles.mediaCaption}>
                <span>AP / {page.index}</span>
                <span>জয়পুরহাট, বাংলাদেশ</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {page.note ? (
        <aside className={styles.notice} aria-label="গুরুত্বপূর্ণ তথ্য">
          <div className="site-shell">
            <strong>জেনে রাখুন</strong>
            <p>{page.note}</p>
          </div>
        </aside>
      ) : null}

      <section className={styles.story} aria-labelledby="bengali-story-title">
        <div className={`site-shell ${styles.storyGrid}`}>
          <aside className={styles.storyIndex}>
            <p className={styles.eyebrow}>এই পাতায়</p>
            <h2 id="bengali-story-title">সিদ্ধান্তের প্রয়োজনীয় দিকগুলো</h2>
            <ol>
              {page.sections.map((section, index) => (
                <li key={section.title}>
                  <a href={`#bn-section-${index + 1}`}>
                    <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </aside>

          <div className={styles.sections}>
            {page.sections.map((section, index) => (
              <article className={styles.section} id={`bn-section-${index + 1}`} key={section.title}>
                <div className={styles.sectionHeading}>
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <h2>{section.title}</h2>
                </div>
                <p>{section.body}</p>
                {section.points?.length ? (
                  <ul>
                    {section.points.map((point) => (
                      <li key={point}>
                        <Check aria-hidden="true" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      {page.links?.length ? (
        <section className={styles.nextRoutes} aria-labelledby="bengali-next-routes-title">
          <div className="site-shell">
            <div className={styles.nextRoutesHeading}>
              <p className={styles.eyebrow}>আপনার পরবর্তী পথ</p>
              <h2 id="bengali-next-routes-title">যেখানে এখন এগোতে পারেন</h2>
            </div>
            <div className={styles.routeGrid}>
              {page.links.map((link, index) => (
                <Link className={styles.routeCard} href={bengaliHref(link.href)} key={link.href}>
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{link.label}</h3>
                  <p>{link.description}</p>
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.contactBand} aria-label="অফিস যোগাযোগ">
        <div className={`site-shell ${styles.contactBandGrid}`}>
          <div>
            <MapPin aria-hidden="true" />
            <span>অফিস</span>
            <p>পৌর মার্কেটের ২য় তলা, পূর্ব বাজার, জয়পুরহাট</p>
          </div>
          <a href={company.phones[0].href}>
            <Phone aria-hidden="true" />
            <span>+880 1735-877654</span>
          </a>
          <a href={`mailto:${company.email}`}>
            <Mail aria-hidden="true" />
            <span>{company.email}</span>
          </a>
          <a href={company.whatsapp} target="_blank" rel="noreferrer">
            <MessageCircle aria-hidden="true" />
            <span>হোয়াটসঅ্যাপ</span>
          </a>
        </div>
      </section>

      <section className={styles.cta} aria-labelledby="bengali-cta-title">
        <div className={`site-shell ${styles.ctaInner}`}>
          <div>
            <p className={styles.eyebrow}>{page.cta.eyebrow}</p>
            <h2 id="bengali-cta-title">{page.cta.title}</h2>
            <p>{page.cta.description}</p>
          </div>
          <Link className={styles.ctaLink} href={bengaliHref(page.cta.href)}>
            {page.cta.label}
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}

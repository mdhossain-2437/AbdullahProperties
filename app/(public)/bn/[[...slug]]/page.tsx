import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BengaliPublicPageView } from "@/components/i18n/bengali-public-page";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL, company } from "@/lib/company-data";
import { getBengaliPublicPage } from "@/lib/i18n/bengali-public-content";
import { createBengaliMetadata } from "@/lib/i18n/bengali-seo";
import {
  bengaliPathFromSegments,
  bengaliPublicPaths,
  toBengaliPath,
} from "@/lib/i18n/public-locale";

type BengaliPublicRouteProps = {
  params: Promise<{ slug?: string[] }>;
};

export function generateStaticParams() {
  return bengaliPublicPaths.map((path) => ({
    slug: path === "/" ? [] : path.slice(1).split("/"),
  }));
}

export async function generateMetadata({ params }: BengaliPublicRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const path = bengaliPathFromSegments(slug);

  if (!path) {
    return {
      title: "পৃষ্ঠা পাওয়া যায়নি",
      description: "অনুরোধ করা বাংলা পাতাটি প্রকাশিত হয়নি।",
      robots: { index: false, follow: true },
    };
  }

  return createBengaliMetadata(getBengaliPublicPage(path));
}

export default async function BengaliPublicRoute({ params }: BengaliPublicRouteProps) {
  const { slug } = await params;
  const path = bengaliPathFromSegments(slug);
  if (!path) notFound();

  const page = getBengaliPublicPage(path);
  const canonical = new URL(toBengaliPath(path), SITE_URL).toString();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${canonical}#webpage`,
          url: canonical,
          name: page.metaTitle,
          description: page.metaDescription,
          inLanguage: "bn-BD",
          isPartOf: { "@id": `${SITE_URL}/#website` },
          about: { "@id": `${SITE_URL}/#business` },
          publisher: { "@id": `${SITE_URL}/#organization` },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: company.nameBn,
              item: new URL("/bn", SITE_URL).toString(),
            },
            ...(path === "/"
              ? []
              : [{ "@type": "ListItem", position: 2, name: page.eyebrow, item: canonical }]),
          ],
        }}
      />
      <BengaliPublicPageView page={page} />
    </>
  );
}


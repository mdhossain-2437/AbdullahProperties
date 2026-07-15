import type { Metadata } from "next";
import { company } from "@/lib/company-data";
import type { BengaliPublicPage } from "@/lib/i18n/bengali-public-content";
import { publicLanguageAlternates, toBengaliPath } from "@/lib/i18n/public-locale";

function socialImageFor(path: BengaliPublicPage["path"]): `/${string}` {
  if (path === "/about") return "/og/about.jpg";
  if (path === "/services") return "/og/services.jpg";
  if (path === "/properties") return "/og/properties.jpg";
  if (path === "/projects") return "/og/projects.jpg";
  if (path === "/contact" || path === "/privacy" || path === "/cookies") return "/og/contact.jpg";
  if (path === "/faq") return "/og/faq.jpg";
  if (path === "/insights") return "/og/insights.jpg";
  if (path === "/brand-kit") return "/og/brand-kit.jpg";
  return "/og/home.jpg";
}

export function createBengaliMetadata(page: BengaliPublicPage): Metadata {
  const canonical = toBengaliPath(page.path);
  const languages = publicLanguageAlternates(page.path);
  const image = socialImageFor(page.path);
  const socialTitle = `${page.metaTitle} | ${company.nameBn}`;

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: {
      canonical,
      languages: languages ?? undefined,
    },
    openGraph: {
      type: "website",
      locale: "bn_BD",
      alternateLocale: ["en_BD"],
      siteName: company.nameBn,
      title: socialTitle,
      description: page.metaDescription,
      url: canonical,
      images: [{ url: image, width: 1200, height: 630, alt: `${page.metaTitle}—আব্দুল্লাহ প্রোপার্টিজ` }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: page.metaDescription,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}


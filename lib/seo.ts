import type { Metadata } from "next";
import { SITE_URL, company } from "@/lib/company-data";
import { publicLanguageAlternates } from "@/lib/i18n/public-locale";

type CreateMetadataInput = {
  title: string;
  description: string;
  path: `/${string}` | "/";
  image?: `/${string}`;
  noIndex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

export const defaultSocialImage = "/og/home.jpg";

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export function createMetadata({
  title,
  description,
  path,
  image = defaultSocialImage,
  noIndex = false,
  type = "website",
  publishedTime,
  modifiedTime,
}: CreateMetadataInput): Metadata {
  const socialTitle = title.includes(company.name) ? title : `${title} | ${company.name}`;
  const languageAlternates = publicLanguageAlternates(path);
  const commonOpenGraph = {
    locale: "en_BD",
    alternateLocale: languageAlternates ? ["bn_BD"] : undefined,
    siteName: company.name,
    title: socialTitle,
    description,
    url: path,
    images: [
      {
        url: image,
        width: 1200,
        height: 630,
        alt: `${socialTitle} social preview`,
      },
    ],
  };

  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: languageAlternates ?? undefined,
    },
    openGraph: type === "article"
      ? { ...commonOpenGraph, type: "article", publishedTime, modifiedTime }
      : { ...commonOpenGraph, type: "website" },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image],
    },
    robots: noIndex
      ? { index: false, follow: true }
      : {
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

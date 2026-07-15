import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/company-data";
import { serviceDetails } from "@/lib/experience-data";
import { listPublicAreaGuides, listPublicInsights } from "@/features/cms/public-content";
import { bengaliPublicPaths, isPublishedBengaliPath, toBengaliPath } from "@/lib/i18n/public-locale";

const updatedAt = new Date("2026-07-14T00:00:00+06:00");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [insights, areaGuides] = await Promise.all([listPublicInsights(), listPublicAreaGuides()]);
  const staticPaths = [
    "/",
    "/about",
    "/services",
    "/process",
    "/buyers",
    "/landowners",
    "/solutions",
    "/joint-venture",
    "/quality",
    "/client-care",
    "/resources",
    "/property-planner",
    "/area-guides",
    "/projects",
    "/projects/nirapad-nibas",
    "/properties",
    "/insights",
    "/contact",
    "/faq",
    "/brand-kit",
    "/privacy",
    "/terms",
    "/cookies",
    "/property-disclaimer",
    "/accessibility",
  ] as const;

  const localizedAlternates = (path: string) => ({
    languages: {
      "en-BD": new URL(path, SITE_URL).toString(),
      "bn-BD": new URL(toBengaliPath(path), SITE_URL).toString(),
    },
  });

  return [
    ...staticPaths.map((path) => ({
      url: new URL(path, SITE_URL).toString(),
      lastModified: updatedAt,
      changeFrequency: path === "/" ? ("weekly" as const) : ("monthly" as const),
      alternates: isPublishedBengaliPath(path) ? localizedAlternates(path) : undefined,
    })),
    ...bengaliPublicPaths.map((path) => ({
      url: new URL(toBengaliPath(path), SITE_URL).toString(),
      lastModified: updatedAt,
      changeFrequency: path === "/" ? ("weekly" as const) : ("monthly" as const),
      alternates: localizedAlternates(path),
    })),
    ...insights.map((insight) => ({
      url: new URL(`/insights/${insight.slug}`, SITE_URL).toString(),
      lastModified: new Date(`${insight.updatedAt}T00:00:00+06:00`),
      changeFrequency: "yearly" as const,
    })),
    ...serviceDetails.map((service) => ({
      url: new URL(`/services/${service.slug}`, SITE_URL).toString(),
      lastModified: updatedAt,
      changeFrequency: "monthly" as const,
    })),
    ...areaGuides.map((guide) => ({
      url: new URL(`/area-guides/${guide.slug}`, SITE_URL).toString(),
      lastModified: new Date(`${guide.updatedAt}T00:00:00+06:00`),
      changeFrequency: "monthly" as const,
    })),
  ];
}

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/company-data";
import { insights } from "@/lib/site-data";

const updatedAt = new Date("2026-07-12T00:00:00+06:00");

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "/",
    "/about",
    "/services",
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

  return [
    ...staticPaths.map((path) => ({
      url: new URL(path, SITE_URL).toString(),
      lastModified: updatedAt,
      changeFrequency: path === "/" ? ("weekly" as const) : ("monthly" as const),
    })),
    ...insights.map((insight) => ({
      url: new URL(`/insights/${insight.slug}`, SITE_URL).toString(),
      lastModified: new Date(`${insight.updatedAt}T00:00:00+06:00`),
      changeFrequency: "yearly" as const,
    })),
  ];
}

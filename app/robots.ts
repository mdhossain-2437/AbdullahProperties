import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/company-data";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/studio", "/office", "/signin-with-chatgpt", "/signout-with-chatgpt", "/callback"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

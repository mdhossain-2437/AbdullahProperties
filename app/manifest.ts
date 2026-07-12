import type { MetadataRoute } from "next";
import { company } from "@/lib/company-data";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: company.name,
    short_name: "Abdullah Properties",
    description: company.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fbf9f8",
    theme_color: "#0c0c0c",
    orientation: "portrait-primary",
    categories: ["business", "real estate"],
    icons: [
      {
        src: "/pwa-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

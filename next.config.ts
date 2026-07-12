import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Sites serves versioned public assets through Cloudflare. Keep image delivery
    // deterministic in vinext and optimize source media before production upload.
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: "/work", destination: "/projects", permanent: true },
      { source: "/blog", destination: "/insights", permanent: true },
      { source: "/nirapad-nibas", destination: "/projects/nirapad-nibas", permanent: true },
      { source: "/inquiry", destination: "/contact", permanent: true },
      { source: "/privacy-policy", destination: "/privacy", permanent: true },
      { source: "/terms-and-conditions", destination: "/terms", permanent: true },
      { source: "/cookie-policy", destination: "/cookies", permanent: true },
      { source: "/disclaimer", destination: "/property-disclaimer", permanent: true },
      { source: "/brand", destination: "/brand-kit", permanent: true },
    ];
  },
};

export default nextConfig;

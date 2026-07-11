import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Sites serves versioned public assets through Cloudflare. Keep image delivery
    // deterministic in vinext and optimize source media before production upload.
    unoptimized: true,
  },
};

export default nextConfig;

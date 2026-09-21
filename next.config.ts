import type { NextConfig } from "next";

const sharedSecurityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
] as const;

const privateRouteHeaders = [
  { key: "Cache-Control", value: "private, no-store" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
] as const;

function toTrustedHttpsOrigin(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const candidate = value.trim();
    const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}

const officeAppOrigin = toTrustedHttpsOrigin(process.env.OFFICE_APP_ORIGIN);

function externalOfficeRedirects(origin: string) {
  return [
    { source: "/office", destination: `${origin}/office`, permanent: false },
    { source: "/office/:path*", destination: `${origin}/office/:path*`, permanent: false },
    { source: "/studio", destination: `${origin}/studio`, permanent: false },
    { source: "/studio/:path*", destination: `${origin}/studio/:path*`, permanent: false },
    { source: "/track/:path*", destination: `${origin}/track/:path*`, permanent: false },
  ];
}

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
      { source: "/signin-with-chatgpt", destination: "/login", permanent: false },
      { source: "/signout-with-chatgpt", destination: "/api/auth/logout", permanent: false },
      { source: "/signin", destination: "/login", permanent: true },
      { source: "/logout", destination: "/api/auth/logout", permanent: false },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.abdullah-properties.com" }],
        destination: "https://abdullah-properties.com/:path*",
        permanent: true,
      },
      ...(officeAppOrigin ? externalOfficeRedirects(officeAppOrigin) : []),
    ];
  },
  webpack(config, { isServer }) {
    config.module.rules.push({
      resourceQuery: /raw/,
      type: "asset/source",
    });
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)),
        "cloudflare:workers",
      ];
    }
    return config;
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/brand/abdullah-properties-brand-kit.zip",
          destination: "/downloads/abdullah-properties-brand-kit-v1.zip",
        },
      ],
    };
  },
  async headers() {
    return [
      { source: "/:path*", headers: [...sharedSecurityHeaders] },
      ...["/studio", "/studio/:path*", "/office", "/office/:path*", "/api/office/:path*", "/track/:path*"].map((source) => ({
        source,
        headers: [...privateRouteHeaders],
      })),
      {
        source: "/track/:path*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
      {
        source: "/brand/abdullah-properties-brand-kit.zip",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
          { key: "Content-Disposition", value: 'attachment; filename="abdullah-properties-brand-kit.zip"' },
          { key: "Content-Type", value: "application/zip" },
          { key: "Content-Security-Policy", value: "default-src 'none'; frame-ancestors 'none'; sandbox" },
        ],
      },
    ];
  },
};

export default nextConfig;

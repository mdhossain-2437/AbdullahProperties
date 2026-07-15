/** Cloudflare Worker entry point for the Abdullah Properties site. */
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  FILES: R2Bucket;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const securityHeaders = {
  "Content-Security-Policy": "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
} as const;

const brandKitPublicPath = "/brand/abdullah-properties-brand-kit.zip";
const brandKitAssetPath = "/downloads/abdullah-properties-brand-kit-v1.zip";

function withSecurityHeaders(response: Response, overrides: Readonly<Record<string, string>> = {}) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeaders)) {
    headers.set(name, value);
  }
  for (const [name, value] of Object.entries(overrides)) {
    headers.set(name, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === brandKitPublicPath) {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return withSecurityHeaders(new Response("Method not allowed", {
          status: 405,
          headers: { Allow: "GET, HEAD", "Cache-Control": "no-store" },
        }));
      }

      const assetUrl = new URL(brandKitAssetPath, request.url);
      const assetResponse = await env.ASSETS.fetch(new Request(assetUrl, {
        method: request.method,
        headers: request.headers,
      }));
      if (!assetResponse.ok) {
        return withSecurityHeaders(new Response("Brand kit unavailable", {
          status: 404,
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "text/plain; charset=utf-8",
          },
        }), { "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; sandbox" });
      }

      const headers = new Headers(assetResponse.headers);
      headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
      headers.set("Content-Disposition", 'attachment; filename="abdullah-properties-brand-kit.zip"');
      headers.set("Content-Type", "application/zip");

      return withSecurityHeaders(new Response(request.method === "HEAD" ? null : assetResponse.body, {
        status: 200,
        headers,
      }), { "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; sandbox" });
    }

    if (url.pathname === "/_vinext/image") {
      return withSecurityHeaders(new Response("Not found", {
        status: 404,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "text/plain; charset=utf-8",
        },
      }), { "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; sandbox" });
    }

    const response = withSecurityHeaders(await handler.fetch(request, env, ctx));
    if (
      url.pathname === "/studio" ||
      url.pathname.startsWith("/studio/") ||
      url.pathname === "/office" ||
      url.pathname.startsWith("/office/") ||
      url.pathname === "/track" ||
      url.pathname.startsWith("/track/")
    ) {
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "private, no-store");
      headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
      if (url.pathname === "/track" || url.pathname.startsWith("/track/")) {
        headers.set("Referrer-Policy", "no-referrer");
      }
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    return response;
  },
};

export default worker;

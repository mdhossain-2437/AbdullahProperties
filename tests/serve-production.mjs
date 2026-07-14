import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, isAbsolute, relative, resolve } from "node:path";

const port = Number(process.env.PORT ?? 4173);
const host = "localhost";
const clientRoot = resolve(process.cwd(), "dist", "client");
const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("server", `${process.pid}-${Date.now()}`);
const { default: worker } = await import(workerUrl.href);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".zip": "application/zip",
};

function safeStaticPath(pathname) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const candidate = resolve(clientRoot, `.${decodedPath}`);
  const relativePath = relative(clientRoot, candidate);
  if (relativePath.startsWith("..") || isAbsolute(relativePath)) return null;
  return candidate;
}

async function staticResponse(request) {
  const pathname = new URL(request.url).pathname;
  const filePath = safeStaticPath(pathname);
  if (!filePath || pathname.endsWith("/")) return null;

  try {
    if (!(await stat(filePath)).isFile()) return null;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }

  const extension = extname(filePath).toLowerCase();
  const headers = new Headers({
    "Cache-Control": pathname.startsWith("/assets/") || pathname.startsWith("/fonts/")
      ? "public, max-age=31536000, immutable"
      : "public, max-age=86400, stale-while-revalidate=604800",
    "Content-Type": contentTypes[extension] ?? "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
  });
  if (pathname === "/brand/abdullah-properties-brand-kit.zip") {
    headers.set("Content-Disposition", 'attachment; filename="abdullah-properties-brand-kit.zip"');
  }

  return new Response(request.method === "HEAD" ? null : await readFile(filePath), { headers });
}

async function toWebRequest(request) {
  const origin = `http://${request.headers.host ?? `${host}:${port}`}`;
  const bodyChunks = [];
  if (request.method !== "GET" && request.method !== "HEAD") {
    for await (const chunk of request) bodyChunks.push(Buffer.from(chunk));
  }

  return new Request(new URL(request.url ?? "/", origin), {
    method: request.method,
    headers: request.headers,
    body: bodyChunks.length > 0 ? Buffer.concat(bodyChunks) : undefined,
    duplex: bodyChunks.length > 0 ? "half" : undefined,
  });
}

const server = createServer(async (incoming, outgoing) => {
  try {
    const request = await toWebRequest(incoming);
    const directAsset = await staticResponse(request);
    const response = directAsset ?? await worker.fetch(
      request,
      { ASSETS: { fetch: async (assetRequest) => (await staticResponse(assetRequest)) ?? new Response("Not found", { status: 404 }) } },
      { waitUntil() {}, passThroughOnException() {} },
    );
    const body = response.body ? Buffer.from(await response.arrayBuffer()) : null;

    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(body);
  } catch (error) {
    console.error("Production test server error", error);
    outgoing.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    outgoing.end("Internal test server error");
  }
});

server.listen(port, host, () => {
  console.log(`Production test server listening at http://${host}:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}

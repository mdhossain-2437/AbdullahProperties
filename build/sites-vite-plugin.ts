import { access, cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";

const STATIC_ASSET_HEADERS = `# Security and cache policy for assets served before the application worker.
/*
  Cross-Origin-Opener-Policy: same-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/brand/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800

/og/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800

/projects/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800

/properties/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800

/social/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800

/brand/abdullah-properties-brand-kit.zip
  Content-Disposition: attachment; filename="abdullah-properties-brand-kit.zip"
`;

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

// Packages Sites metadata and migrations after Vite finishes compiling.
export function sites(): Plugin {
  let root = process.cwd();

  return {
    name: "sites",
    apply: "build",
    configResolved(config) {
      root = config.root;
    },
    async closeBundle() {
      const outputDirectory = resolve(root, "dist", ".openai");
      const hostingConfig = resolve(root, ".openai", "hosting.json");
      const drizzleSource = resolve(root, "drizzle");

      await rm(outputDirectory, { recursive: true, force: true });
      await mkdir(outputDirectory, { recursive: true });

      if (await exists(hostingConfig)) {
        await cp(hostingConfig, resolve(outputDirectory, "hosting.json"));
      }
      if (await exists(drizzleSource)) {
        await cp(drizzleSource, resolve(outputDirectory, "drizzle"), {
          recursive: true,
        });
      }

      await writeFile(
        resolve(root, "dist", "client", "_headers"),
        STATIC_ASSET_HEADERS,
        "utf8",
      );
    },
  };
}

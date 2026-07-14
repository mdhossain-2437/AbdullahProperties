import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

type DatabaseBindings = {
  DB?: D1Database;
};

async function getBindings(): Promise<DatabaseBindings> {
  try {
    const runtime = await import("cloudflare:workers");
    return runtime.env as unknown as DatabaseBindings;
  } catch {
    return {};
  }
}

export async function getDb() {
  const bindings = await getBindings();

  if (!bindings.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(bindings.DB, { schema });
}

export async function getOptionalD1(): Promise<D1Database | null> {
  const bindings = await getBindings();
  return bindings.DB ?? null;
}

export async function getD1(): Promise<D1Database> {
  const database = await getOptionalD1();
  if (!database) {
    throw new Error("The CMS database is unavailable in this runtime.");
  }
  return database;
}

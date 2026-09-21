import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema.ts";
import { createD1Adapter } from "./d1-adapter.ts";
import { DRIZZLE_MIGRATIONS } from "./migrations.ts";
import fs from "node:fs";
import path from "node:path";

type DatabaseBindings = {
  DB?: D1Database;
};

let cachedD1Instance: D1Database | null = null;

async function getBindings(): Promise<DatabaseBindings> {
  try {
    const runtime = await import("cloudflare:workers");
    return runtime.env as unknown as DatabaseBindings;
  } catch {
    return {};
  }
}

function getDatabaseFilePath(): string {
  if (process.env.DATABASE_FILE) {
    return process.env.DATABASE_FILE;
  }
  if (process.env.VERCEL) {
    return "/tmp/abdullah_properties.sqlite";
  }
  const dataDir = path.resolve(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch {
      return ":memory:";
    }
  }
  return path.join(dataDir, "abdullah_properties.sqlite");
}

async function initNodeSqliteDatabase(): Promise<D1Database | null> {
  try {
    const { DatabaseSync } = await import("node:sqlite");
    const filePath = getDatabaseFilePath();
    const db = new DatabaseSync(filePath);

    // Track and run migrations
    db.exec(`
      CREATE TABLE IF NOT EXISTS _drizzle_applied_migrations (
        id TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      )
    `);

    const appliedRows = db.prepare("SELECT id FROM _drizzle_applied_migrations").all() as { id: string }[];
    const appliedIds = new Set(appliedRows.map((r) => r.id));

    for (const migration of DRIZZLE_MIGRATIONS) {
      if (!appliedIds.has(migration.id)) {
        db.exec("BEGIN");
        try {
          for (const statement of migration.statements) {
            db.exec(statement);
          }
          const insertStmt = db.prepare(
            "INSERT INTO _drizzle_applied_migrations (id, applied_at) VALUES (?, ?)",
          );
          insertStmt.run(migration.id, new Date().toISOString());
          db.exec("COMMIT");
        } catch (err) {
          db.exec("ROLLBACK");
          console.error(`Failed to apply migration ${migration.id}:`, err);
          throw err;
        }
      }
    }

    // Seed default owner member if office_members is empty
    try {
      const memberCountRow = db.prepare("SELECT COUNT(*) as count FROM office_members").get() as { count: number } | undefined;
      if (memberCountRow && Number(memberCountRow.count) === 0) {
        const now = new Date().toISOString();
        const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@abdullah-properties.com").toLowerCase().trim();
        const adminName = process.env.ADMIN_NAME ?? "Abdullah Properties Administrator";
        db.prepare(`
          INSERT INTO office_members (
            id, email, normalized_email, display_name, role, status, version, last_seen_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          "seed-owner-admin",
          adminEmail,
          adminEmail,
          adminName,
          "owner",
          "active",
          1,
          null,
          now,
          now,
        );
      }
    } catch {
      // Ignore if table not yet available
    }

    return createD1Adapter(db) as unknown as D1Database;
  } catch (error) {
    console.warn("Native SQLite initialization fallback unavailable:", error);
    return null;
  }
}

export async function getOptionalD1(): Promise<D1Database | null> {
  if (cachedD1Instance) {
    return cachedD1Instance;
  }

  // 1. Check Cloudflare D1 worker binding
  const bindings = await getBindings();
  if (bindings.DB) {
    cachedD1Instance = bindings.DB;
    return cachedD1Instance;
  }

  // 2. Fallback to native Node.js / Vercel SQLite with embedded migrations
  const nodeDb = await initNodeSqliteDatabase();
  if (nodeDb) {
    cachedD1Instance = nodeDb;
    return cachedD1Instance;
  }

  return null;
}

export async function getD1(): Promise<D1Database> {
  const database = await getOptionalD1();
  if (!database) {
    throw new Error("The CMS and Office database is unavailable in this runtime.");
  }
  return database;
}

export async function getDb() {
  const d1 = await getD1();
  return drizzle(d1, { schema });
}

export async function isDatabaseAvailable(): Promise<boolean> {
  const database = await getOptionalD1();
  return database !== null;
}

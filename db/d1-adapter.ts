import type { DatabaseSync } from "node:sqlite";

export type D1Meta = {
  duration: number;
  changes: number;
  last_row_id: number;
};

export type D1Result<T = unknown> = {
  results: T[];
  success: boolean;
  meta: D1Meta;
};

export type D1Response = {
  success: boolean;
  meta: D1Meta;
};

export type D1ExecResult = {
  count: number;
  duration: number;
};

export interface D1PreparedStatement {
  bind(...params: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Response>;
  raw<T = unknown>(): Promise<T[]>;
}

export interface UniversalD1Database {
  prepare(sql: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(sql: string): Promise<D1ExecResult>;
}

function normalizeParam(val: unknown): unknown {
  if (typeof val === "boolean") return val ? 1 : 0;
  if (val === undefined) return null;
  return val;
}

export function createD1Adapter(db: DatabaseSync): UniversalD1Database {
  function createPreparedStatement(sql: string, boundParams: unknown[] = []): D1PreparedStatement {
    return {
      bind(...params: unknown[]): D1PreparedStatement {
        return createPreparedStatement(sql, [...boundParams, ...params]);
      },
      async first<T = unknown>(colName?: string): Promise<T | null> {
        const stmt = db.prepare(sql);
        const row = stmt.get(...(boundParams.map(normalizeParam) as (string | number | bigint | null | Uint8Array)[])) as Record<string, unknown> | undefined;
        if (!row) return null;
        if (colName && typeof colName === "string") {
          return (row[colName] as T) ?? null;
        }
        return row as unknown as T;
      },
      async all<T = unknown>(): Promise<D1Result<T>> {
        const stmt = db.prepare(sql);
        const results = stmt.all(...(boundParams.map(normalizeParam) as (string | number | bigint | null | Uint8Array)[])) as T[];
        return {
          results,
          success: true,
          meta: { duration: 0, changes: 0, last_row_id: 0 },
        };
      },
      async run(): Promise<D1Response> {
        const stmt = db.prepare(sql);
        const res = stmt.run(...(boundParams.map(normalizeParam) as (string | number | bigint | null | Uint8Array)[]));
        return {
          success: true,
          meta: {
            changes: Number(res.changes),
            last_row_id: Number(res.lastInsertRowid),
            duration: 0,
          },
        };
      },
      async raw<T = unknown>(): Promise<T[]> {
        const stmt = db.prepare(sql);
        const rows = stmt.all(...(boundParams.map(normalizeParam) as (string | number | bigint | null | Uint8Array)[])) as Record<string, unknown>[];
        return rows.map((r) => Object.values(r)) as unknown as T[];
      },
    };
  }

  return {
    prepare(sql: string): D1PreparedStatement {
      return createPreparedStatement(sql);
    },
    async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
      db.exec("BEGIN");
      try {
        const results: D1Result<T>[] = [];
        for (const s of statements) {
          results.push((await s.all()) as D1Result<T>);
        }
        db.exec("COMMIT");
        return results;
      } catch (err) {
        db.exec("ROLLBACK");
        throw err;
      }
    },
    async exec(sql: string): Promise<D1ExecResult> {
      db.exec(sql);
      return { count: 1, duration: 0 };
    },
  };
}

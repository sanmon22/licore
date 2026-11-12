import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema.js";
import path from "node:path";
import fs from "node:fs";

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), "data.db");
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const sqlite = new DatabaseSync(dbPath);
sqlite.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

export const db = drizzle(
  async (sql, params, method) => {
    try {
      const stmt = sqlite.prepare(sql);
      if (method === "all" || method === "values") {
        const rows = stmt.all(...params);
        return { rows: rows.map((r) => Object.values(r as Record<string, any>)) };
      } else if (method === "get") {
        const row = stmt.get(...params);
        return { rows: row ? (Object.values(row as Record<string, any>) as any) : undefined };
      } else {
        stmt.run(...params);
        return { rows: [] };
      }
    } catch (e: any) {
      console.error("Database query error:", e.message, "\nSQL:", sql, "\nParams:", params);
      throw e;
    }
  },
  { schema }
);

import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { pool } from "@workspace/db";
import { logger } from "./logger";

// The process is started from artifacts/api-server/, so cwd() is reliable.
const MIGRATIONS_DIR = join(process.cwd(), "migrations");

/**
 * Runs all .sql files in artifacts/api-server/migrations/ in filename order.
 * Every file must be idempotent (CREATE TABLE IF NOT EXISTS, etc.).
 * Called automatically before the server starts accepting traffic.
 */
export async function runMigrations(): Promise<void> {
  let files: string[];
  try {
    files = readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith(".sql"))
      .sort();
  } catch {
    logger.warn({ dir: MIGRATIONS_DIR }, "migrations directory not found — skipping");
    return;
  }

  for (const file of files) {
    const filePath = join(MIGRATIONS_DIR, file);
    const sql = readFileSync(filePath, "utf-8");
    logger.info({ file }, "running migration");
    await pool.query(sql);
    logger.info({ file }, "migration complete");
  }
}

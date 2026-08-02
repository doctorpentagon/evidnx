import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./client.js";

/**
 * Runs automatically on server boot so a fresh clone just needs
 * `npm install && npm run dev` - no manual migration step required.
 */
export function runMigrations() {
  const migrationsFolder = path.resolve(process.cwd(), "src/infrastructure/db/migrations");
  migrate(db, { migrationsFolder });
}

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set before running migrations.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await migrate(db, { migrationsFolder: path.join(__dirname, "../drizzle") });

console.log("✅ Migrations applied successfully.");
await pool.end();

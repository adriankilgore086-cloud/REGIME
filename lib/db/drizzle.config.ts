import { defineConfig } from "drizzle-kit";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const candidates = [
    resolve(__dirname, "../../.env.local"),
    resolve(__dirname, "../../.env"),
  ];
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    const content = readFileSync(p, "utf-8");
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      const [, key, rawValue] = m;
      if (process.env[key]) continue;
      const value = rawValue.replace(/^['"]|['"]$/g, "");
      process.env[key] = value;
    }
    return;
  }
}

loadEnvLocal();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL not set. Add it to .env.local at the repo root.");
}

export default defineConfig({
  schema: "./src/schema/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});

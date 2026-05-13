/**
 * Cross-platform workspace guard (Windows-safe — no `sh` required).
 * Keeps npm/yarn from accidentally installing at the monorepo root.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname);

function tryUnlink(file) {
  const p = path.join(root, file);
  try {
    fs.unlinkSync(p);
  } catch {
    /* ignore */
  }
}

tryUnlink("package-lock.json");
tryUnlink("yarn.lock");

const ua = process.env.npm_config_user_agent || process.env.npm_package_user_agent || "";
if (!ua.includes("pnpm")) {
  console.error("This workspace must be installed with pnpm. Run: pnpm install");
  process.exit(1);
}

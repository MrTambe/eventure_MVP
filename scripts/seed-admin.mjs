// Seed the first admin account into the Convex `admins` table.
//
// Usage:
//   node scripts/seed-admin.mjs <email> <password> [name]
//
// Environment (any one of these sources works):
//   CONVEX_URL             - deployment URL (or read from .env.local / --url flag)
//   SEED_ADMIN_SECRET      - must match the SEED_ADMIN_SECRET env var set on
//                            the Convex deployment (or read from .env.local)
//
// Re-runnable: safe to run after a DB reset to recreate your admin.

import fs from "node:fs";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../src/convex/_generated/api.js";

function readEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  const out = {};
  if (!fs.existsSync(envPath)) return out;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const envLocal = readEnvLocal();
const positional = process.argv.slice(2).filter((a) => !a.startsWith("--"));

const email = positional[0] || envLocal.SEED_ADMIN_EMAIL;
const password = positional[1] || envLocal.SEED_ADMIN_PASSWORD;
const name = positional[2] || envLocal.SEED_ADMIN_NAME;
const url = argValue("--url") || process.env.CONVEX_URL || envLocal.VITE_CONVEX_URL;
const secret =
  argValue("--secret") ||
  process.env.SEED_ADMIN_SECRET ||
  envLocal.SEED_ADMIN_SECRET;

if (!email || !password) {
  console.error(
    "Usage: node scripts/seed-admin.mjs <email> <password> [name]\n" +
      "Or set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in .env.local"
  );
  process.exit(1);
}
if (!url) {
  console.error(
    "No Convex URL found. Run `npx convex dev` once (writes .env.local) or pass --url <deployment-url>."
  );
  process.exit(1);
}
if (!secret) {
  console.error(
    "No SEED_ADMIN_SECRET found. Set it on the deployment with:\n" +
      "  npx convex env set SEED_ADMIN_SECRET <your-secret>\n" +
      "and in .env.local (or pass --secret <your-secret>)."
  );
  process.exit(1);
}

const client = new ConvexHttpClient(url);
try {
  const result = await client.action(api.admin.seedAdmin, {
    email,
    password,
    name,
    seedSecret: secret,
  });
  if (result?.success) {
    console.log(`✅ ${result.message} — admin: ${email}`);
  } else {
    console.error(`❌ ${result?.message || "Unknown error"}`);
  }
  process.exit(result?.success ? 0 : 1);
} catch (err) {
  console.error("❌ Seed failed:", err.message || err);
  process.exit(1);
}

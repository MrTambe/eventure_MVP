// Insert sample events into the Convex DB (no-op if events already exist).
//
// Usage:
//   node scripts/seed-sample-events.mjs
//
// Requires the same setup as seed-admin.mjs: CONVEX_URL (or .env.local) and
// SEED_ADMIN_SECRET matching the deployment's env var.

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
const url = argValue("--url") || process.env.CONVEX_URL || envLocal.VITE_CONVEX_URL;
const secret =
  argValue("--secret") ||
  process.env.SEED_ADMIN_SECRET ||
  envLocal.SEED_ADMIN_SECRET;

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
  const result = await client.action(api.seed.seedSampleEvents, {
    seedSecret: secret,
  });
  if (result?.success) {
    console.log(`✅ ${result.message}`);
  } else {
    console.error(`❌ ${result?.message || "Unknown error"}`);
  }
  process.exit(result?.success ? 0 : 1);
} catch (err) {
  console.error("❌ Seed failed:", err.message || err);
  process.exit(1);
}

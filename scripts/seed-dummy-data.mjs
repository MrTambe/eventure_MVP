// Seed the full dummy dataset:
//   - 2 admins:   sanshit@eventure.app (Sanshit@2026), mayuri@eventure.app (Mayuri@2026)
//   - 1 team mem: sanika@eventure.app (Sanika@2026)
//   - 5 sample users (Parth Aayush Tambe, Aayush Bhat, Naveen Shaik, Sorav Joshi, Soham Yadav)
//   - 1 ongoing event with registrations + check-in codes
//
// Usage: pnpm seed:dummy   (or: node scripts/seed-dummy-data.mjs)

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
const secret = argValue("--secret") || process.env.SEED_ADMIN_SECRET || envLocal.SEED_ADMIN_SECRET;

if (!url) {
  console.error("No Convex URL found. Run `npx convex dev` once or pass --url.");
  process.exit(1);
}
if (!secret) {
  console.error("No SEED_ADMIN_SECRET. Set it on the deployment and in .env.local, or pass --secret.");
  process.exit(1);
}

const client = new ConvexHttpClient(url);
try {
  const result = await client.action(api.seed.seedAllDummyData, { seedSecret: secret });
  if (result?.success) {
    console.log(`✅ ${result.message}`);
  } else {
    console.error(`❌ ${result?.message || "Unknown error"}`);
  }
  // Also make sure every pre-existing event has its chat
  const backfill = await client.action(api.seed.backfillEventChats, { seedSecret: secret });
  if (backfill?.success) {
    console.log(`✅ ${backfill.message}`);
  }
  process.exit(result?.success ? 0 : 1);
} catch (err) {
  console.error("❌ Seed failed:", err.message || err);
  process.exit(1);
}

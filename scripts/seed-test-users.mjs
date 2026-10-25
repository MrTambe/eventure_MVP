// Seed quick-test accounts + one ongoing event on the DEV deployment:
//   node scripts/seed-test-users.mjs
//
// Creates 5 users (email + password ONLY — profile left incomplete so the
// "Complete Profile" flow shows after first login) and 1 ongoing event.

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

const envLocal = readEnvLocal();
const url = process.env.CONVEX_URL || envLocal.VITE_CONVEX_URL;
const secret = process.env.SEED_ADMIN_SECRET || envLocal.SEED_ADMIN_SECRET;
if (!url || !secret) {
  console.error("Need VITE_CONVEX_URL and SEED_ADMIN_SECRET (check .env.local).");
  process.exit(1);
}

const USERS = [
  { email: "user1@test.dev", password: "Test@111" },
  { email: "user2@test.dev", password: "Test@222" },
  { email: "user3@test.dev", password: "Test@333" },
  { email: "user4@test.dev", password: "Test@444" },
  { email: "user5@test.dev", password: "Test@555" },
];

const client = new ConvexHttpClient(url);
try {
  const usersRes = await client.action(api.seed.seedTestUsers, {
    seedSecret: secret,
    users: USERS,
  });
  console.log(usersRes?.success ? `✅ ${usersRes.message}` : `❌ ${usersRes?.message}`);

  const eventRes = await client.action(api.seed.seedOngoingEvent, { seedSecret: secret });
  console.log(eventRes?.success ? `✅ ${eventRes.message}` : `❌ ${eventRes?.message}`);
} catch (err) {
  console.error("❌ Seed failed:", err.message || err);
  process.exitCode = 1;
} finally {
  process.exit(process.exitCode || 0); // ConvexHttpClient can hang on Windows
}

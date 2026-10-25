// @ts-nocheck
"use node";

import { action, internalAction, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { google } from "googleapis";
import { internal } from "./_generated/api";

/**
 * Google Sheets as a live database mirror.
 *
 * Model: ONE user-owned spreadsheet (the "Eventure DB"). The Google Cloud
 * SERVICE ACCOUNT (shared JSON key) cannot own files (zero Drive storage
 * quota), but it can freely read/write any spreadsheet shared with it by the
 * owner. So the owner creates/shares the sheet once, we store its ID in
 * GOOGLE_SHEETS_DB_ID, and every sync rewrites three tabs:
 *
 *   - Events        : every event + live stats
 *   - Participants  : every registration (event name, user details, check-in)
 *   - Staff         : admins + team members (volunteers)
 *
 * Env vars required on the deployment:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL  e.g. sheets-integration-67@project.iam.gserviceaccount.com
 *   GOOGLE_SERVICE_ACCOUNT_KEY    the private key (with real newlines)
 *   GOOGLE_SHEETS_DB_ID           spreadsheet ID of the user-owned "Eventure DB" sheet
 */

function getGoogleAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const dbId = process.env.GOOGLE_SHEETS_DB_ID;
  if (!email || !key || !dbId) return null;
  // Handle keys pasted with literal \n sequences
  key = key.replace(/\\n/g, "\n");
  return new google.auth.JWT({
    email,
    key,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
}

const TABS = [
  { title: "Events", headers: ["Event", "Status", "Venue", "Start", "End", "Type", "Max Participants", "Registrations", "Attended", "Attend Rate", "Description"] },
  { title: "Participants", headers: ["Event", "Name", "Email", "Roll No", "Branch", "Mobile", "Check-In Code", "Status", "Attended At", "Registered On"] },
  { title: "Staff", headers: ["Name", "Email", "Role", "Department/Branch", "Roll No", "Mobile"] },
];

/** Ensure the three DB tabs exist on the spreadsheet; returns title -> sheetId (gid). */
async function ensureTabs(sheets: any, spreadsheetId: string): Promise<Record<string, number>> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const gids: Record<string, number> = {};
  for (const s of meta.data.sheets || []) {
    gids[s.properties.title] = s.properties.sheetId;
  }
  const missing = TABS.filter((t) => gids[t.title] === undefined);
  if (missing.length) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: missing.map((t) => ({ addSheet: { properties: { title: t.title } } })),
      },
    });
    for (const t of missing) gids[t.title] = undefined; // resolve below
    const meta2 = await sheets.spreadsheets.get({ spreadsheetId });
    for (const s of meta2.data.sheets || []) gids[s.properties.title] = s.properties.sheetId;
  }
  return gids;
}

/** Replace the whole contents of a tab with the given rows (header + data). */
async function writeTab(sheets: any, spreadsheetId: string, title: string, headers: string[], rows: any[][]) {
  // Clear previous contents (handles shrinking datasets)
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: `${title}!A1:Z10000` });
  const values = [
    headers,
    ...rows.map((row) =>
      row.map((cell) =>
        cell === null || cell === undefined ? "" : typeof cell === "number" ? cell : String(cell)
      )
    ),
  ];
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${title}!A1`,
    valueInputOption: "RAW",
    requestBody: { values },
  });
}

/**
 * Rewrite the whole Eventure DB spreadsheet from the Convex database.
 */
export const syncEventToSheets = internalAction({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const auth = getGoogleAuth();
    if (!auth) {
      return {
        success: false,
        message:
          "Google Sheets not configured: missing GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_KEY / GOOGLE_SHEETS_DB_ID.",
      };
    }
    const spreadsheetId = process.env.GOOGLE_SHEETS_DB_ID;
    const sheets = google.sheets({ version: "v4", auth });

    const events: any[] = await ctx.runQuery(internal.sheetsData.getAllEventsInternal, {});
    const admins: any[] = await ctx.runQuery(internal.sheetsData.getAdminsInternal, {});
    const teamMembers: any[] = await ctx.runQuery(internal.sheetsData.getTeamMembersInternal, {});

    // All registrations across all events, joined with user info.
    const participantRows: any[][] = [];
    for (const ev of events) {
      const regs: any[] = await ctx.runQuery(internal.sheetsData.getRegistrationsInternal, {
        eventId: ev._id,
      });
      for (const r of regs) {
        const u: any = r.userId
          ? await ctx.runQuery(internal.sheetsData.getUserByIdInternal, { userId: r.userId })
          : null;
        participantRows.push([
          ev.name,
          u?.name || "Unknown",
          u?.email || "",
          u?.rollNo || "",
          u?.branch || "",
          u?.mobileNumber || "",
          r.checkInCode || "",
          r.status || "registered",
          r.attendedAt ? new Date(r.attendedAt).toLocaleString("en-IN") : "Not yet",
          new Date(r.registrationDate).toLocaleString("en-IN"),
        ]);
      }
    }

    const eventRows = events.map((ev) => {
      const regs = participantRows.filter((p) => p[0] === ev.name);
      const attended = regs.filter((p) => p[7] !== "registered" || (p[8] && p[8] !== "Not yet")).length;
      return [
        ev.name,
        ev.status,
        ev.venue,
        new Date(ev.startDate).toLocaleString("en-IN"),
        new Date(ev.endDate).toLocaleString("en-IN"),
        ev.eventType || "individual",
        ev.maxParticipants ?? "Unlimited",
        regs.length,
        attended,
        regs.length ? `${Math.round((attended / regs.length) * 100)}%` : "0%",
        (ev.description || "").replace(/\s+/g, " ").slice(0, 300),
      ];
    });

    const staffRows = [
      ...admins.map((a) => [a.name || "", a.email, "Admin", a.branch || "", a.rollNo || "", a.mobileNumber || ""]),
      ...teamMembers.map((t) => [
        t.name || "",
        t.email,
        "Team Member / Volunteer",
        t.department || t.branch || "",
        t.rollNo || "",
        t.mobileNumber || "",
      ]),
    ];

    const gids = await ensureTabs(sheets, spreadsheetId);
    await writeTab(sheets, spreadsheetId, "Events", TABS[0].headers, eventRows);
    await writeTab(sheets, spreadsheetId, "Participants", TABS[1].headers, participantRows);
    await writeTab(sheets, spreadsheetId, "Staff", TABS[2].headers, staffRows);

    const baseUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    const tabUrl = (t: string) => `${baseUrl}#gid=${gids[t] ?? 0}`;

    // Persist the links so the admin dashboard "Data" menu can link straight
    // to the DB tabs without re-running the sync.
    const existing = await ctx.runQuery(internal.sheetsData.getBackupByEventInternal, {
      eventId: args.eventId,
    });
    const record = {
      eventId: args.eventId,
      folderUrl: baseUrl,
      participantsUrl: tabUrl("Participants"),
      staffUrl: tabUrl("Staff"),
      overviewUrl: tabUrl("Events"),
      syncedAt: Date.now(),
    };
    if (existing) {
      await ctx.runMutation(internal.sheetsData.updateBackupInternal, {
        id: (existing as any)._id,
        ...record,
      });
    } else {
      await ctx.runMutation(internal.sheetsData.insertBackupInternal, record);
    }

    return {
      success: true,
      folderId: spreadsheetId,
      sharedWith: [],
      sheets: {
        participants: tabUrl("Participants"),
        staff: tabUrl("Staff"),
        overview: tabUrl("Events"),
      },
    };
  },
});

// ===== Data collection helpers live in sheetsData.ts (queries can't run in
// Node.js action files). This file only performs the Sheets API calls.

/** Public: fetch all sheet backup links (admin or team member only). */
export const getSheetBackups = action({
  args: { adminEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let allowed = false;
    const identity = await ctx.auth.getUserIdentity();
    if (identity?.email) {
      const u: any = await ctx.runQuery(internal.sheetsData.getUserByEmailInternal, {
        email: identity.email,
      });
      if (u?.role === "admin") allowed = true;
    }
    if (!allowed && args.adminEmail) {
      const email = args.adminEmail.toLowerCase();
      const admins: any[] = await ctx.runQuery(internal.sheetsData.getAdminsInternal, {});
      if (admins.some((a) => a.email === email)) allowed = true;
      else {
        const members: any[] = await ctx.runQuery(internal.sheetsData.getTeamMembersInternal, {});
        if (members.some((m) => m.email === email)) allowed = true;
      }
    }
    if (!allowed) {
      return { success: false, message: "Only admins and team members can access data exports.", backups: [] };
    }
    const backups = await ctx.runQuery(internal.sheetsData.listSheetBackups, {});
    return { success: true, backups, message: null };
  },
});

/**
 * Public: rewrite the Eventure DB spreadsheet from the current database.
 * Admin-only (session email or admins table).
 */
export const syncEventSheetsNow = action({
  args: { eventId: v.id("events"), adminEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let isAdmin = false;
    const identity = await ctx.auth.getUserIdentity();
    if (identity?.email) {
      const u = await ctx.runQuery(internal.sheetsData.getUserByEmailInternal, { email: identity.email });
      if ((u as any)?.role === "admin") isAdmin = true;
    }
    if (!isAdmin && args.adminEmail) {
      const admin = await ctx.runQuery(internal.admin_creation.getAdminByEmail, { email: args.adminEmail });
      if (admin) isAdmin = true;
    }
    if (!isAdmin) {
      return { success: false, message: "Only admins can sync data to Google Sheets." };
    }
    return await ctx.runAction(internal.googleSheets.syncEventToSheets, { eventId: args.eventId });
  },
});

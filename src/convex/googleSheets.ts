// @ts-nocheck
"use node";

import { action, internalAction, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { google } from "googleapis";
import { internal } from "./_generated/api";

/**
 * Google Sheets backup database.
 *
 * How it works:
 * - A Google Cloud SERVICE ACCOUNT (shared JSON key) owns a Drive folder.
 * - Every event gets its own subfolder with formatted sheets:
 *     - "Participants"  - every registration: user details, status, check-in code, attendance
 *     - "Staff"         - admins + team members (volunteers) with roles and contact info
 *     - "Event Overview"- event details + live stats
 * - Sheets are shared with every admin's email (from the admins table) so an admin
 *   logged into the website sees all data in their Google Drive without DB access.
 *
 * Env vars required on the deployment:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL  e.g. eventure-backup@project.iam.gserviceaccount.com
 *   GOOGLE_SERVICE_ACCOUNT_KEY    the private key (with real newlines)
 *   GOOGLE_SHEETS_ROOT_FOLDER_ID  (optional) Drive folder ID to create event folders in
 */

function getGoogleAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!email || !key) return null;
  // Handle keys pasted with literal \n sequences
  key = key.replace(/\\n/g, "\n");
  return new google.auth.JWT({ email, key, scopes: ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/spreadsheets"] });
}

async function getDrive(auth: any) {
  return google.drive({ version: "v3", auth });
}

async function ensureSubfolder(drive: any, rootFolderId: string | undefined, name: string): Promise<string> {
  if (rootFolderId) {
    const q = encodeURIComponent(`'${rootFolderId}' in parents and name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
    const res = await drive.files.list({ q, fields: "files(id)" });
    if (res.data.files && res.data.files.length > 0) return res.data.files[0].id;
    const created = await drive.files.create({
      requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [rootFolderId] },
      fields: "id",
    });
    return created.data.id;
  }
  // No root configured: create (or reuse) a top-level "Eventure Backups" folder
  const q = encodeURIComponent(`name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const res = await drive.files.list({ q, fields: "files(id, parents)" });
  if (res.data.files && res.data.files.length > 0) return res.data.files[0].id;
  const created = await drive.files.create({
    requestBody: { name, mimeType: "application/vnd.google-apps.folder" },
    fields: "id",
  });
  return created.data.id;
}

async function createSheet(drive: any, sheets: any, title: string, folderId: string, headers: string[], rows: any[][], freezeRows = 1) {
  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: { properties: { title } },
  });
  const spreadsheetId = spreadsheet.data.spreadsheetId;

  // Move into the event folder
  await drive.files.update({ fileId: spreadsheetId, addParents: folderId, fields: "id, parents" });

  // Format + write data
  const headerRow = headers.map((h) => ({ userEnteredValue: { stringValue: h }, userEnteredFormat: { backgroundColor: { red: 0.16, green: 0.1, blue: 0.55 }, textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 11 }, horizontalAlignment: "CENTER" } }));
  const dataRows = rows.map((row) => row.map((cell) => ({ userEnteredValue: cell === null || cell === undefined ? { stringValue: "" } : typeof cell === "number" ? { numberValue: cell } : { stringValue: String(cell) } })));

  const colCount = Math.max(headers.length, 1);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateCells: {
            rows: [ { values: headerRow }, ...dataRows ],
            start: { sheetId: 0, rowIndex: 0, columnIndex: 0 },
            fields: "userEnteredValue,userEnteredFormat",
          },
        },
        {
          updateSheetProperties: {
            properties: { sheetId: 0, gridProperties: { frozenRowCount: freezeRows, columnCount: Math.max(colCount, 8) } },
            fields: "gridProperties",
          },
        },
        // Auto-resize all columns
        {
          autoResizeDimensions: { dimensions: { sheetId: 0, dimension: "COLUMNS", startIndex: 0, endIndex: colCount } },
        },
        // Alternating row banding for readability
        {
          addBanding: {
            bandedRange: {
              range: { sheetId: 0, startRow: 1, startColumn: 0, endColumn: colCount },
              rowProperties: { bandedElementStyle: { backgroundColor: { red: 0.96, green: 0.95, blue: 1 } } },
            },
          },
        },
      ],
    },
  });

  return { spreadsheetId, url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` };
}

/**
 * Collect all data for an event and write the three sheets.
 */
export const syncEventToSheets = internalAction({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const auth = getGoogleAuth();
    if (!auth) {
      return { success: false, message: "Google Sheets not configured: missing GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_KEY." };
    }

    const event: any = await ctx.runQuery(internal.sheetsData.getEventInternal, { eventId: args.eventId });
    if (!event) return { success: false, message: "Event not found" };

    const registrations: any[] = await ctx.runQuery(internal.sheetsData.getRegistrationsInternal, { eventId: args.eventId });
    const admins: any[] = await ctx.runQuery(internal.sheetsData.getAdminsInternal, {});
    const teamMembers: any[] = await ctx.runQuery(internal.sheetsData.getTeamMembersInternal, {});

    const drive = google.drive({ version: "v3", auth });
    const sheets = google.sheets({ version: "v4", auth });

    // Folder: "<Event Name> — <date>"
    const folderName = `${event.name} - ${new Date(event.startDate).toISOString().slice(0, 10)}`;
    const rootFolderId = process.env.GOOGLE_SHEETS_ROOT_FOLDER_ID;
    let folderId: string;
    if (rootFolderId) {
      folderId = await ensureSubfolder(drive, rootFolderId, folderName);
    } else {
      const root = await ensureSubfolder(drive, undefined, "Eventure Backups");
      folderId = await ensureSubfolder(drive, root, folderName);
    }

    // ---- Participants sheet ----
    const participantRows = await Promise.all(
      registrations.map(async (r) => {
        const u: any = r.userId ? await ctx.runQuery(internal.sheetsData.getUserByIdInternal, { userId: r.userId }) : null;
        return [
          u?.name || "Unknown",
          u?.email || "",
          u?.rollNo || "",
          u?.branch || "",
          u?.mobileNumber || "",
          r.checkInCode || "",
          r.status || "registered",
          r.attendedAt ? new Date(r.attendedAt).toLocaleString("en-IN") : "Not yet",
          new Date(r.registrationDate).toLocaleString("en-IN"),
        ];
      })
    );
    const participants = await createSheet(
      drive,
      sheets,
      "Participants",
      folderId,
      ["Name", "Email", "Roll No", "Branch", "Mobile", "Check-In Code", "Status", "Attended At", "Registered On"],
      participantRows
    );

    // ---- Staff sheet (admins + volunteers) ----
    const staffRows = [
      ...admins.map((a) => [a.name || "", a.email, "Admin", a.branch || "", a.rollNo || "", a.mobileNumber || ""]),
      ...teamMembers.map((t) => [t.name || "", t.email, "Team Member / Volunteer", t.department || t.branch || "", t.rollNo || "", t.mobileNumber || ""]),
    ];
    const staff = await createSheet(
      drive,
      sheets,
      "Staff & Volunteers",
      folderId,
      ["Name", "Email", "Role", "Department/Branch", "Roll No", "Mobile"],
      staffRows
    );

    // ---- Event overview sheet ----
    const overviewRows = [
      ["Event Name", event.name],
      ["Description", (event.description || "").replace(/\s+/g, " ").slice(0, 900)],
      ["Venue", event.venue],
      ["Start", new Date(event.startDate).toLocaleString("en-IN")],
      ["End", new Date(event.endDate).toLocaleString("en-IN")],
      ["Status", event.status],
      ["Event Type", event.eventType || "individual"],
      ["Max Participants", event.maxParticipants ?? "Unlimited"],
      ["Total Registrations", registrations.length],
      ["Total Attended", registrations.filter((r) => r.attendedAt).length],
      ["Attend Rate", registrations.length ? `${Math.round((registrations.filter((r) => r.attendedAt).length / registrations.length) * 100)}%` : "0%"],
      ["Backup Generated", new Date().toLocaleString("en-IN")],
    ];
    const overview = await createSheet(
      drive,
      sheets,
      "Event Overview",
      folderId,
      ["Field", "Value"],
      overviewRows
    );

    // Share all three sheets with every admin email
    const sharedWith: string[] = [];
    for (const admin of admins) {
      if (!admin.email) continue;
      for (const file of [participants, staff, overview]) {
        try {
          await drive.permissions.create({
            fileId: file.spreadsheetId,
            requestBody: { type: "user", role: "writer", emailAddress: admin.email },
            sendNotificationEmail: false,
          });
        } catch (e) {
          console.warn(`[Sheets] Failed to share with ${admin.email}:`, (e as any)?.message);
        }
      }
      sharedWith.push(admin.email);
    }

    // Persist the links so the admin dashboard "Data" menu can link straight
    // to the sheets without re-running the sync.
    const existing = await ctx.runQuery(internal.sheetsData.getBackupByEventInternal, {
      eventId: args.eventId,
    });
    const record = {
      eventId: args.eventId,
      folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
      participantsUrl: participants.url,
      staffUrl: staff.url,
      overviewUrl: overview.url,
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
      folderId,
      sharedWith,
      sheets: {
        participants: participants.url,
        staff: staff.url,
        overview: overview.url,
      },
    };
  },
});

// ===== Data collection helpers live in sheetsData.ts (queries can't run in
// Node.js action files). This file only performs the Sheets/Drive API calls.

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
 * Collect all data for an event and write the three sheets.
 */
export const syncEventSheetsNow = action({
  args: { eventId: v.id("events"), adminEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Admin gate (session email or Convex-auth admin)
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

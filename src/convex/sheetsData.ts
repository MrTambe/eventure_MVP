// @ts-nocheck
// Internal data queries for the Google Sheets backup (Convex queries must NOT
// run in "use node" action files, so they live here).
import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const getEventInternal = internalQuery({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => ctx.db.get(args.eventId),
});

export const getUserByIdInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => ctx.db.get(args.userId),
});

export const getUserByEmailInternal = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();
  },
});

export const getAdminsInternal = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("admins").take(500),
});

export const getTeamMembersInternal = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("teamMembers").take(500),
});

export const getRegistrationsInternal = internalQuery({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("eventRegistrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(2000);
  },
});

export const listSheetBackups = internalQuery({
  args: {},
  handler: async (ctx) => {
    const backups = await ctx.db.query("sheet_backups").take(200);
    const withEvents = await Promise.all(
      backups.map(async (b) => {
        const event: any = await ctx.db.get(b.eventId);
        return {
          _id: b._id,
          eventId: b.eventId,
          eventName: event?.name || "Unknown Event",
          eventStatus: event?.status || "unknown",
          folderUrl: b.folderUrl,
          participantsUrl: b.participantsUrl,
          staffUrl: b.staffUrl,
          overviewUrl: b.overviewUrl,
          syncedAt: b.syncedAt,
        };
      })
    );
    return withEvents.sort((a: any, b: any) => b.syncedAt - a.syncedAt);
  },
});

export const getBackupByEventInternal = internalQuery({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sheet_backups")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();
  },
});

export const insertBackupInternal = internalMutation({
  args: {
    eventId: v.id("events"),
    folderUrl: v.string(),
    participantsUrl: v.string(),
    staffUrl: v.string(),
    overviewUrl: v.string(),
    syncedAt: v.number(),
  },
  handler: async (ctx, args) => ctx.db.insert("sheet_backups", args),
});

export const updateBackupInternal = internalMutation({
  args: {
    id: v.id("sheet_backups"),
    eventId: v.id("events"),
    folderUrl: v.string(),
    participantsUrl: v.string(),
    staffUrl: v.string(),
    overviewUrl: v.string(),
    syncedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
  },
});

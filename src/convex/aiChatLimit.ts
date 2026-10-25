import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Per-user AI chat rate limiting: max 1 request per minute, counted from the
// time the user's previous AI response was received. The limit state lives in
// the `aiChatLimits` table because Convex actions are stateless.
//
// userKey is the auth identity subject for logged-in users, or "anon:<clientId>"
// (a random id the chat widget persists in localStorage) for guests.

export const getLastChat = internalQuery({
  args: { userKey: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("aiChatLimits")
      .withIndex("by_user_key", (q) => q.eq("userKey", args.userKey))
      .first();
  },
});

export const recordChat = internalMutation({
  args: { userKey: v.string(), ts: v.number() },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("aiChatLimits")
      .withIndex("by_user_key", (q) => q.eq("userKey", args.userKey))
      .first();
    if (doc) {
      await ctx.db.patch(doc._id, { lastChatAt: args.ts });
    } else {
      await ctx.db.insert("aiChatLimits", { userKey: args.userKey, lastChatAt: args.ts });
    }
  },
});

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";

export const getAllTeamMembers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("teamMembers").collect();
  },
});

export const addTeamMember = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    email: v.string(),
    role: v.string(),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    await ctx.db.insert("teamMembers", {
      ...args,
      joinedAt: Date.now(),
    });
  },
});

export const checkAdminProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user && user.role === "admin" ? user : null;
  },
});
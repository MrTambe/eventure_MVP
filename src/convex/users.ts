import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx, MutationCtx } from "./_generated/server";

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  return await ctx.db.get(userId);
}

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

export const listMembers = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") {
      return [];
    }
    return await ctx.db.query("users").take(500);
  },
});

export const updateUserProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("user"))),
    rollNo: v.optional(v.string()),
    branch: v.optional(v.string()),
    mobileNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const { userId, ...updates } = args;
    await ctx.db.patch(userId, updates);
    
    return {
      success: true,
      message: "Profile updated successfully",
    };
  },
});

export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }
    return {
      name: user.name,
      rollNo: user.rollNo,
      branch: user.branch,
      mobileNumber: user.mobileNumber,
      email: user.email,
      avatarUrl: user.avatarUrl,
    };
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") {
      return [];
    }
    return await ctx.db.query("users").take(500);
  },
});

export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    await ctx.db.patch(args.userId, {
      role: args.role,
    });
  },
});

export const updateCurrentUserProfile = mutation({
  args: {
    name: v.string(),
    rollNo: v.string(),
    branch: v.string(),
    mobileNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }
    await ctx.db.patch(user._id, {
      name: args.name,
      rollNo: args.rollNo,
      branch: args.branch,
      mobileNumber: args.mobileNumber,
    });
    return { success: true, message: "Profile updated successfully" };
  },
});

export const ensureAvatarUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    if (user.avatarUrl) return user.avatarUrl;
    
    // Generate default avatar URL using bottts style
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${user._id}`;
    await ctx.db.patch(user._id, { avatarUrl });
    return avatarUrl;
  },
});

export const updateAvatarUrl = mutation({
  args: {
    avatarUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }
    await ctx.db.patch(user._id, { avatarUrl: args.avatarUrl });
    return { success: true, message: "Avatar updated successfully" };
  },
});
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx, MutationCtx } from "./_generated/server";

export const getCurrentUser = async (ctx: QueryCtx | MutationCtx) => {
  try {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    const user = await ctx.db.get(userId);
    return user;
  } catch (error) {
    return null;
  }
};

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return user;
  },
});

export const updateUserProfile = mutation({
  args: {
    name: v.string(),
    rollNo: v.optional(v.string()),
    branch: v.optional(v.string()),
    mobileNumber: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return { success: false, message: "User not authenticated" };
    }

    try {
      // Validate email format if provided
      if (args.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email)) {
        return { success: false, message: "Invalid email format" };
      }

      // Validate mobile number if provided
      if (args.mobileNumber && !/^\d{10}$/.test(args.mobileNumber)) {
        return { success: false, message: "Mobile number must be 10 digits" };
      }

      // Update user profile
      await ctx.db.patch(user._id, {
        name: args.name,
        rollNo: args.rollNo,
        branch: args.branch,
        mobileNumber: args.mobileNumber,
        email: args.email,
      });

      return { success: true, message: "Profile updated successfully!" };
    } catch (error) {
      console.error("Profile update error:", error);
      return { success: false, message: "Failed to update profile. Please try again." };
    }
  },
});

export const getUserProfile = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      rollNo: v.optional(v.string()),
      branch: v.optional(v.string()),
      mobileNumber: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    // Using 'as any' to bypass stale type definitions until they are regenerated
    const { _id, name, email, rollNo, branch, mobileNumber } = user as any;

    return {
      _id,
      name,
      email,
      rollNo,
      branch,
      mobileNumber,
    };
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users;
  },
});
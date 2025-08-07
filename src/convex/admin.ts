import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const adminLogin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!admin || admin.password !== args.password) {
      return {
        success: false,
        message: "Invalid credentials",
      };
    }

    return {
      success: true,
      message: "Login successful",
      admin: {
        _id: admin._id,
        email: admin.email,
        name: admin.name,
      },
    };
  },
});

export const listAdmins = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("admins").collect();
  },
});
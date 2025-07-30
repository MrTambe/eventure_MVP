import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const createAdminUser = internalMutation({
  args: {},
  returns: v.object({
    adminId: v.id("admins"),
    email: v.string(),
  }),
  handler: async (ctx) => {
    // Check if admin already exists
    const existingAdmin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", "aayushbhat0704@gmail.com"))
      .unique();

    if (existingAdmin) {
      return {
        adminId: existingAdmin._id,
        email: existingAdmin.email,
      };
    }

    // Create new admin user
    const adminId = await ctx.db.insert("admins", {
      email: "aayushbhat0704@gmail.com",
      password: "123456", // In production, this should be hashed
      name: "Aayush Bhat",
      isActive: true,
      lastLogin: undefined,
    });

    return {
      adminId,
      email: "aayushbhat0704@gmail.com",
    };
  },
});

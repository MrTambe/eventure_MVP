import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Admin login mutation
export const adminLogin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.boolean(),
      message: v.string(),
      admin: v.optional(v.object({
        _id: v.id("admins"),
        email: v.string(),
        name: v.optional(v.string()),
      })),
    }),
    v.object({
      success: v.boolean(),
      message: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Find admin by email
      const admin = await ctx.db
        .query("admins")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .unique();

      if (!admin) {
        return {
          success: false,
          message: "Invalid email or password",
        };
      }

      // Check if admin is active
      if (!admin.isActive) {
        return {
          success: false,
          message: "Admin account is deactivated",
        };
      }

      // Verify password (in production, use proper password hashing)
      if (admin.password !== args.password) {
        return {
          success: false,
          message: "Invalid email or password",
        };
      }

      // Update last login time
      await ctx.db.patch(admin._id, {
        lastLogin: Date.now(),
      });

      return {
        success: true,
        message: "Login successful",
        admin: {
          _id: admin._id,
          email: admin.email,
          name: admin.name,
        },
      };
    } catch (error) {
      console.error("Admin login error:", error);
      return {
        success: false,
        message: "An error occurred during login",
      };
    }
  },
});

// Get admin by ID
export const getAdmin = query({
  args: {
    adminId: v.id("admins"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("admins"),
      email: v.string(),
      name: v.optional(v.string()),
      isActive: v.boolean(),
      lastLogin: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin) {
      return null;
    }

    return {
      _id: admin._id,
      email: admin.email,
      name: admin.name,
      isActive: admin.isActive,
      lastLogin: admin.lastLogin,
    };
  },
});

// List all admins (for admin management)
export const listAdmins = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("admins"),
      email: v.string(),
      name: v.optional(v.string()),
      isActive: v.boolean(),
      lastLogin: v.optional(v.number()),
    })
  ),
  handler: async (ctx) => {
    const admins = await ctx.db.query("admins").collect();
    return admins.map((admin) => ({
      _id: admin._id,
      email: admin.email,
      name: admin.name,
      isActive: admin.isActive,
      lastLogin: admin.lastLogin,
    }));
  },
});

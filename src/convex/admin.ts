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

export const getAllAdminsWithEvents = query({
  handler: async (ctx) => {
    const admins = await ctx.db.query("admins").collect();

    const adminsWithEvents = await Promise.all(
      admins.map(async (admin) => {
        // Get events created by this admin
        const createdEvents = await ctx.db
          .query("events")
          .withIndex("by_creator", (q) => q.eq("createdBy", admin._id))
          .collect();

        return {
          ...admin,
          events: createdEvents,
        };
      })
    );

    return adminsWithEvents;
  },
});

// Get admin profile from TeamMembers table
export const getAdminProfile = query({
  args: {
    adminId: v.id("admins"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("teamMembers"),
      _creationTime: v.number(),
      adminId: v.optional(v.id("admins")),
      name: v.string(),
      rollNo: v.string(),
      branch: v.string(),
      phone: v.string(),
      email: v.string(),
      role: v.optional(v.string()),
      isActive: v.optional(v.boolean()),
    })
  ),
  handler: async (ctx, args) => {
    // Find team member profile for this admin
    const profile = await ctx.db
      .query("teamMembers")
      .withIndex("by_admin_id", (q) => q.eq("adminId", args.adminId))
      .first();
    
    return profile;
  },
});

// Update or create admin profile in TeamMembers table
export const updateAdminProfile = mutation({
  args: {
    adminId: v.id("admins"),
    name: v.string(),
    rollNo: v.string(),
    branch: v.string(),
    phone: v.string(),
    email: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email)) {
        return { success: false, message: "Invalid email format" };
      }

      // Validate phone number (10 digits)
      if (!/^\d{10}$/.test(args.phone)) {
        return { success: false, message: "Phone number must be 10 digits" };
      }

      // Check if profile already exists
      const existingProfile = await ctx.db
        .query("teamMembers")
        .withIndex("by_admin_id", (q) => q.eq("adminId", args.adminId))
        .unique();

      if (existingProfile) {
        // Update existing profile
        await ctx.db.patch(existingProfile._id, {
          name: args.name,
          rollNo: args.rollNo,
          branch: args.branch,
          phone: args.phone,
          email: args.email,
        });
      } else {
        // Create new profile
        await ctx.db.insert("teamMembers", {
          adminId: args.adminId,
          name: args.name,
          rollNo: args.rollNo,
          branch: args.branch,
          phone: args.phone,
          email: args.email,
          role: "Admin",
          isActive: true,
        });
      }

      return { success: true, message: "Profile updated successfully!" };
    } catch (error) {
      console.error("Profile update error:", error);
      return { success: false, message: "Failed to update profile. Please try again." };
    }
  },
});
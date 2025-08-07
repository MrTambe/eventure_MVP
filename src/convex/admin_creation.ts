import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { ROLES } from "./schema";

export const getAdminByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

export const getTeamMemberByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("teamMembers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

export const createAdminInternal = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if email already exists in admins table
    const existingAdmin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingAdmin) {
      throw new Error("An admin with this email already exists");
    }

    // Check if email already exists in teamMembers table
    const existingTeamMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingTeamMember) {
      throw new Error("A team member with this email already exists");
    }

    // Validate role
    if (args.role !== ROLES.ADMIN && args.role !== ROLES.USER) {
      throw new Error("Invalid role specified");
    }

    // Create the admin/team member based on role
    if (args.role === ROLES.ADMIN) {
      const adminId = await ctx.db.insert("admins", {
        email: args.email,
        password: args.passwordHash,
        name: undefined,
      });

      return {
        success: true,
        message: "Admin created successfully",
        id: adminId,
      };
    } else {
      // Create team member
      const teamMemberId = await ctx.db.insert("teamMembers", {
        userId: "" as any, // This will be updated when they first sign in
        name: args.email.split("@")[0], // Use email prefix as default name
        email: args.email,
        role: "TeamMember",
        password: args.passwordHash,
        joinedAt: Date.now(),
      });

      return {
        success: true,
        message: "Team member created successfully",
        id: teamMemberId,
      };
    }
  },
});
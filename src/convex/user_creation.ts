"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import bcrypt from "bcryptjs";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

export const createUser = action({
    args: {
        email: v.string(),
        password: v.string(),
        role: v.union(v.literal("admin"), v.literal("teammember")),
    },
    handler: async (ctx, args) => {
        const passwordHash = await bcrypt.hash(args.password, 10);

        return await ctx.runMutation(internal.user_creation.createUserInternal, {
            email: args.email,
            passwordHash: passwordHash,
            role: args.role,
        });
    }
});

export const createUserInternal = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    role: v.union(v.literal("admin"), v.literal("teammember")),
  },
  handler: async (ctx, args) => {
    const existingAdmin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingAdmin) {
      throw new Error("An admin with this email already exists.");
    }

    const existingTeamMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingTeamMember) {
      throw new Error("A team member with this email already exists.");
    }

    if (args.role === 'admin') {
      await ctx.db.insert("admins", {
        email: args.email,
        password: args.passwordHash,
        name: args.email.split("@")[0],
        role: "admin",
      });
    } else {
      await ctx.db.insert("teamMembers", {
        userId: "" as any, // Following existing pattern for local team members
        name: args.email.split("@")[0],
        email: args.email,
        role: "teammember",
        password: args.passwordHash,
        joinedAt: Date.now(),
      });
    }

    return { success: true, message: `User ${args.email} created successfully as a ${args.role}.` };
  },
});

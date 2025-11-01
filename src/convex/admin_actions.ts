// @ts-nocheck
"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import bcrypt from "bcryptjs";

export const createAdmin = action({
  args: {
    email: v.string(),
    password: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Hash the password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(args.password, saltRounds);

      // Call internal mutation to save the admin
      const result = await ctx.runMutation(
        internal.admin_creation.createAdminInternal,
        {
          email: args.email,
          passwordHash: hashedPassword,
          role: args.role,
        }
      );

      return result;
    } catch (error) {
      console.error("Error creating admin:", error);
      // Return structured error instead of throwing
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create admin",
        id: undefined,
      };
    }
  },
});
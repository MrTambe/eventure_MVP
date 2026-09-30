// @ts-nocheck
"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import bcrypt from "bcryptjs";
import { internal } from "./_generated/api";

export const adminLogin = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; message: string; user?: any }> => {
    try {
      // Add normalized email for consistent comparisons
      const normalizedEmail = args.email.toLowerCase();

      // Use normalized email for all lookups
      const adminUser = await (ctx as any).runQuery(
        internal.admin_creation.getAdminByEmail,
        { email: normalizedEmail }
      ) as any;

      if (adminUser) {
        // Make password check robust: handle legacy plaintext and invalid bcrypt hashes
        let isPasswordValid = false;
        if (adminUser.password) {
          try {
            isPasswordValid = await bcrypt.compare(args.password, adminUser.password);
          } catch {
            // Fallback for legacy plaintext-stored passwords
            isPasswordValid = args.password === adminUser.password;
          }
        }
        if (!isPasswordValid) {
          return { success: false, message: "Invalid credentials" };
        }
        // Build Convex-safe return object without undefined values
        const userToReturn: any = {
          _id: adminUser._id,
          _creationTime: adminUser._creationTime,
          email: adminUser.email,
          role: "admin",
        };
        if (adminUser.name !== undefined) userToReturn.name = adminUser.name;
        if (adminUser.branch !== undefined) userToReturn.branch = adminUser.branch;
        if (adminUser.rollNo !== undefined) userToReturn.rollNo = adminUser.rollNo;
        if (adminUser.mobileNumber !== undefined) userToReturn.mobileNumber = adminUser.mobileNumber;

        return { success: true, message: "Login successful", user: userToReturn };
      } 
      
      const teamMember = await (ctx as any).runQuery(
        internal.admin_creation.getTeamMemberByEmail,
        { email: normalizedEmail }
      ) as any;

      if (teamMember && teamMember.password) {
        // Make password check robust for team members too
        let isPasswordValid = false;
        try {
          isPasswordValid = await bcrypt.compare(args.password, teamMember.password);
        } catch {
          // Fallback for legacy plaintext-stored passwords
          isPasswordValid = args.password === teamMember.password;
        }
        if (!isPasswordValid) {
          return { success: false, message: "Invalid credentials" };
        }
        
        // Build Convex-safe return object without undefined values
        const userToReturn: any = {
          _id: teamMember._id,
          _creationTime: teamMember._creationTime,
          email: teamMember.email,
          role: "teammember",
        };
        if (teamMember.name !== undefined) userToReturn.name = teamMember.name;
        if (teamMember.userId !== undefined) userToReturn.userId = teamMember.userId;
        if (teamMember.department !== undefined) userToReturn.department = teamMember.department;
        if (teamMember.branch !== undefined) userToReturn.branch = teamMember.branch;
        if (teamMember.rollNo !== undefined) userToReturn.rollNo = teamMember.rollNo;
        if (teamMember.joinedAt !== undefined) userToReturn.joinedAt = teamMember.joinedAt;
        if (teamMember.mobileNumber !== undefined) userToReturn.mobileNumber = teamMember.mobileNumber;

        return { success: true, message: "Login successful", user: userToReturn };
      }

      // NOTE: The previous hardcoded default-admin auto-seed
      // (admin@example.com / admin123) was removed for security.
      // Admins must be created via the SEED_ADMIN_SECRET-gated seedAdmin
      // action (see scripts/seed-admin.mjs) or the in-app Create Admin UI.

      return { success: false, message: "Invalid credentials" };
    } catch (err) {
      console.error("adminLogin error:", err);
      // Return a structured error so the client shows a clear toast instead of throwing
      return { success: false, message: "Login failed. Please try again." };
    }
  },
});

export const seedAdmin = action({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
    seedSecret: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; message: string }> => {
    try {
      // Gate this public action behind a secret so random visitors cannot
      // create admin accounts on the deployment.
      const expectedSecret = process.env.SEED_ADMIN_SECRET;
      if (!expectedSecret || args.seedSecret !== expectedSecret) {
        return { success: false, message: "Invalid seed secret" };
      }

      const normalizedEmail = args.email.toLowerCase();

      // Check if admin already exists
      const existing = await (ctx as any).runQuery(
        internal.admin_creation.getAdminByEmail,
        { email: normalizedEmail }
      );

      if (existing) {
        return { success: false, message: "Admin with this email already exists" };
      }

      // Hash the password
      const hashed = await bcrypt.hash(args.password, 12);

      // Create the admin
      await (ctx as any).runMutation(
        (internal as any).admin_creation.createAdminInternal,
        {
          email: normalizedEmail,
          passwordHash: hashed,
          role: "admin",
        }
      );

      return { success: true, message: "Admin created successfully" };
    } catch (err: any) {
      console.error("seedAdmin error:", err);
      return { success: false, message: err.message || "Failed to create admin" };
    }
  },
});
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
    let existingUser: any = await ctx.runQuery(internal.admin_creation.getAdminByEmail, { email: args.email });

    if (!existingUser) {
        existingUser = await ctx.runQuery(internal.admin_creation.getTeamMemberByEmail, { email: args.email });
    }

    if (!existingUser) {
      return { success: false, message: "Invalid credentials" };
    }

    const isPasswordValid = await bcrypt.compare(args.password, existingUser.password);

    if (!isPasswordValid) {
      return { success: false, message: "Invalid credentials" };
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...user } = existingUser;

    return { success: true, message: "Login successful", user };
  },
});
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { Doc } from "./_generated/dataModel";

export const getAllTeamMembers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("teamMembers").collect();
  },
});

export const addTeamMember = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    email: v.string(),
    role: v.string(),
    password: v.optional(v.string()),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    await ctx.db.insert("teamMembers", {
      ...args,
      joinedAt: Date.now(),
    });
  },
});

export const checkAdminProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user && user.role === "admin" ? user : null;
  },
});

// Helper function to determine if a team member's profile is complete
const isTeamMemberProfileComplete = (member: Doc<"teamMembers">) => {
  return !!(
    member.name &&
    member.branch &&
    member.rollNo &&
    (member as any).mobileNumber
  );
};

// Query to get all team members with their profile completion status
export const getTeamMembersWithProfileStatus = query({
  args: {},
  handler: async (ctx) => {
    const teamMembers = await ctx.db.query("teamMembers").collect();
    return teamMembers.map((member) => ({
        ...member,
        isProfileComplete: isTeamMemberProfileComplete(member),
    }));
  },
});

// Mutation to update team member profile information
export const updateTeamMemberProfile = mutation({
  args: {
    teamMemberId: v.id("teamMembers"),
    name: v.optional(v.string()),
    branch: v.optional(v.string()),
    rollNo: v.optional(v.string()),
    mobileNumber: v.optional(v.string()),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const { teamMemberId, ...updateData } = args;
    
    // Filter out undefined values
    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(teamMemberId, filteredUpdateData);
  },
});
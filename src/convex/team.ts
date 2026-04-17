import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

// Helper function to determine if a team member's profile is complete
const isTeamMemberProfileComplete = (member: Doc<"teamMembers">) => {
  return !!(
    member.name &&
    member.branch &&
    member.rollNo &&
    member.mobileNumber
  );
};

// Helper function to determine if an admin's profile is complete
const isAdminProfileComplete = (admin: Doc<"admins">) => {
    return !!(
        admin.name &&
        admin.branch &&
        admin.rollNo &&
        admin.mobileNumber
    );
};

// Optimized query to get all team members and admins with their profile completion status
export const getCombinedTeamWithProfileStatus = query({
  args: {},
  handler: async (ctx) => {
    // Use Promise.all to fetch both collections in parallel for better performance
    const [teamMembers, admins] = await Promise.all([
      ctx.db.query("teamMembers").order("asc").take(100),
      ctx.db.query("admins").order("asc").take(100)
    ]);

    const formattedTeamMembers = teamMembers.map((member) => ({
        ...member,
        type: 'teammember' as const,
        isProfileComplete: isTeamMemberProfileComplete(member),
    }));

    const formattedAdmins = admins.map((admin) => ({
        ...admin,
        type: 'admin' as const,
        isProfileComplete: isAdminProfileComplete(admin),
    }));

    // Combine and sort by name (admins first, then team members)
    const combined = [...formattedAdmins, ...formattedTeamMembers];
    
    return combined.sort((a, b) => {
      // Sort by type first (admins before team members), then by name
      if (a.type !== b.type) {
        return a.type === 'admin' ? -1 : 1;
      }
      return (a.name ?? "").localeCompare(b.name ?? "");
    });
  },
});

// Keep the original query for backward compatibility
export const getAllTeamMembers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("teamMembers").order("asc").take(100);
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
    adminId: v.id("admins"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Admin access required");
    }

    const { teamMemberId, adminId, ...updateData } = args;
    
    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(teamMemberId, filteredUpdateData);
  },
});

// Mutation to update admin profile information
export const updateAdminProfile = mutation({
    args: {
      adminToUpdateId: v.id("admins"),
      name: v.optional(v.string()),
      branch: v.optional(v.string()),
      rollNo: v.optional(v.string()),
      mobileNumber: v.optional(v.string()),
      loggedInAdminId: v.id("admins"),
    },
    handler: async (ctx, args) => {
      const loggedInAdmin = await ctx.db.get(args.loggedInAdminId);
      if (!loggedInAdmin || loggedInAdmin.role !== "admin") {
        throw new Error("Admin access required");
      }
  
      const { adminToUpdateId, loggedInAdminId, ...updateData } = args;
      
      const filteredUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );
  
      await ctx.db.patch(adminToUpdateId, filteredUpdateData);
    },
  });

// Mutation to delete a user (admin or team member)
export const deleteUser = mutation({
  args: {
    userIdToDelete: v.string(), // Using v.string() to accept both Id<"admins"> and Id<"teamMembers">
    userType: v.union(v.literal("admin"), v.literal("teammember")),
    loggedInAdminId: v.id("admins"),
  },
  handler: async (ctx, args) => {
    const loggedInAdmin = await ctx.db.get(args.loggedInAdminId);
    if (!loggedInAdmin || loggedInAdmin.role !== "admin") {
      throw new Error("Authorization failed: Only admins can delete users.");
    }

    if (args.userIdToDelete === args.loggedInAdminId) {
        throw new Error("Admins cannot delete their own accounts.");
    }

    if (args.userType === 'admin') {
        await ctx.db.delete(args.userIdToDelete as Id<"admins">);
    } else { // userType === 'teammember'
        await ctx.db.delete(args.userIdToDelete as Id<"teamMembers">);
    }

    return { success: true };
  },
});

// Mutation for admin settings page - updates admin or team member profile by email
export const updateAdminSettingsByEmail = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    rollNo: v.string(),
    branch: v.string(),
    mobileNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.toLowerCase();

    // Try to find in admins table first
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (admin) {
      await ctx.db.patch(admin._id, {
        name: args.name,
        rollNo: args.rollNo,
        branch: args.branch,
        mobileNumber: args.mobileNumber,
      });
      return { success: true, message: "Profile updated successfully" };
    }

    // Try team members table
    const teamMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (teamMember) {
      await ctx.db.patch(teamMember._id, {
        name: args.name,
        rollNo: args.rollNo,
        branch: args.branch,
        mobileNumber: args.mobileNumber,
      });
      return { success: true, message: "Profile updated successfully" };
    }

    return { success: false, message: "Admin/team member not found" };
  },
});
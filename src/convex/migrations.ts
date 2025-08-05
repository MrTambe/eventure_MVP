import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const migratePrivateMessages = internalMutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    migratedCount: v.number(),
  }),
  handler: async (ctx) => {
    try {
      // Get all private messages
      const allMessages = await ctx.db.query("private_messages").collect();
      let migratedCount = 0;

      for (const message of allMessages) {
        // Check if receiverId is from teamMembers table
        if (message.receiverId.toString().includes("teamMembers")) {
          // Get the team member to find their userId
          const teamMember = await ctx.db.get(message.receiverId as unknown as Id<"teamMembers">);
          
          if (teamMember && teamMember.userId) {
            // Update the message with the correct userId
            await ctx.db.patch(message._id, {
              receiverId: teamMember.userId,
            });
            migratedCount++;
          } else {
            // If team member doesn't have a userId, delete the message
            await ctx.db.delete(message._id);
            migratedCount++;
          }
        }
      }

      return {
        success: true,
        message: `Migration completed successfully. ${migratedCount} messages migrated.`,
        migratedCount,
      };
    } catch (error) {
      console.error("Migration error:", error);
      return {
        success: false,
        message: "Migration failed",
        migratedCount: 0,
      };
    }
  },
});

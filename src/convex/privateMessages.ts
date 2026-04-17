import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";

export const getDirectMessages = query({
  args: {
    recipientId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const messages = await ctx.db
      .query("private_messages")
      .withIndex("by_conversation", (q) => 
        q.eq("senderId", user._id).eq("recipientId", args.recipientId)
      )
      .take(200);

    const reverseMessages = await ctx.db
      .query("private_messages")
      .withIndex("by_conversation", (q) => 
        q.eq("senderId", args.recipientId).eq("recipientId", user._id)
      )
      .take(200);

    return [...messages, ...reverseMessages].sort((a, b) => a._creationTime - b._creationTime);
  },
});

export const sendDirectMessage = mutation({
  args: {
    content: v.string(),
    recipientId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return { success: false, message: "Not authenticated" };
    }

    try {
      const messageId = await ctx.db.insert("private_messages", {
        senderId: user._id,
        recipientId: args.recipientId,
        content: args.content,
        isRead: false,
        reactions: [],
      });

      return { success: true, message: "Message sent successfully", messageId };
    } catch (error) {
      console.error("Error sending message:", error);
      return { success: false, message: "Failed to send message" };
    }
  },
});

export const markPrivateMessageAsRead = mutation({
  args: {
    messageId: v.id("private_messages"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    await ctx.db.patch(args.messageId, {
      isRead: true,
    });
  },
});

export const togglePrivateMessageReaction = mutation({
  args: {
    messageId: v.id("private_messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return { success: false, message: "Not authenticated" };
    }

    try {
      const message = await ctx.db.get(args.messageId);
      if (!message) {
        return { success: false, message: "Message not found" };
      }

      const reactions = message.reactions || [];
      const existingReactionIndex = reactions.findIndex(
        (r) => r.userId === user._id && r.emoji === args.emoji
      );

      let updatedReactions;
      if (existingReactionIndex >= 0) {
        // Remove reaction
        updatedReactions = reactions.filter((_, index) => index !== existingReactionIndex);
      } else {
        // Add reaction
        updatedReactions = [...reactions, { userId: user._id, emoji: args.emoji }];
      }

      await ctx.db.patch(args.messageId, {
        reactions: updatedReactions,
      });

      return { success: true, message: "Reaction toggled successfully" };
    } catch (error) {
      console.error("Error toggling reaction:", error);
      return { success: false, message: "Failed to toggle reaction" };
    }
  },
});
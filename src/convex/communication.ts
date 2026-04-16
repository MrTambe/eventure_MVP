import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { internal } from "./_generated/api";

export const listMessages = query({
  handler: async (ctx) => {
    const messages = await ctx.db.query("admin_communication_messages").order("desc").take(100);
    const messagesWithAuthors = await Promise.all(
      messages.map(async (message) => {
        const author = await ctx.db.get(message.authorId);
        return {
          ...message,
          authorName: author?.name,
          authorImage: author?.image,
          reactions: message.reactions || [],
        };
      })
    );
    return messagesWithAuthors.reverse();
  },
});

export const sendMessage = mutation({
  args: {
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return { success: false, message: "Not authenticated" };
    }

    try {
      const messageId = await ctx.db.insert("admin_communication_messages", {
        content: args.content,
        authorId: user._id,
      });

      return { success: true, message: "Message sent successfully", messageId };
    } catch (error) {
      console.error("Error sending message:", error);
      return { success: false, message: "Failed to send message" };
    }
  },
});

export const getMessages = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("admin_communication_messages")
      .order("desc")
      .take(100);
  },
});

export const postMessage = mutation({
  args: {
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    if (user.role !== "admin") {
      throw new Error("Only admins can post messages");
    }

    await ctx.db.insert("admin_communication_messages", {
      authorId: user._id,
      content: args.content,
    });
  },
});

export const toggleEmojiReaction = mutation({
  args: {
    messageId: v.id("admin_communication_messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    const reactions = message.reactions || [];
    const existingIndex = reactions.findIndex(
      (r) => r.userId === user._id && r.emoji === args.emoji
    );

    if (existingIndex >= 0) {
      // Remove reaction
      reactions.splice(existingIndex, 1);
    } else {
      // Add reaction
      reactions.push({ userId: user._id, emoji: args.emoji });
    }

    await ctx.db.patch(args.messageId, { reactions });
    return { success: true };
  },
});

export const markAsRead = mutation({
  args: {
    messageId: v.id("admin_communication_messages"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    // For now, just return success - implement read receipt logic as needed
    return { success: true };
  },
});

export const getTeamMemberCount = query({
  args: {},
  handler: async (ctx) => {
    const teamMembers = await ctx.db.query("teamMembers").collect();
    return teamMembers.length;
  },
});
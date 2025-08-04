import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { Id } from "./_generated/dataModel";

export const sendPrivateMessage = mutation({
  args: {
    receiverId: v.id("users"),
    message: v.string(),
    attachments: v.optional(v.array(v.object({
      name: v.string(),
      url: v.string(),
      type: v.union(v.literal("image"), v.literal("video"), v.literal("pdf"), v.literal("docx"), v.literal("other")),
      size: v.optional(v.number()),
    }))),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const user = await getCurrentUser(ctx);
      if (!user) {
        return { success: false, message: "User not authenticated" };
      }

      await ctx.db.insert("private_messages", {
        senderId: user._id,
        receiverId: args.receiverId,
        message: args.message,
        timestamp: Date.now(),
        attachments: args.attachments,
        reactions: {},
        readBy: [user._id], // Sender has read their own message
      });

      return { success: true, message: "Message sent successfully" };
    } catch (error) {
      console.error("Send private message error:", error);
      return { success: false, message: "Failed to send message" };
    }
  },
});

export const getPrivateMessages = query({
  args: {
    otherUserId: v.id("users"),
  },
  returns: v.array(v.object({
    _id: v.id("private_messages"),
    _creationTime: v.number(),
    senderId: v.id("users"),
    receiverId: v.id("users"),
    message: v.string(),
    timestamp: v.number(),
    attachments: v.optional(v.array(v.object({
      name: v.string(),
      url: v.string(),
      type: v.union(v.literal("image"), v.literal("video"), v.literal("pdf"), v.literal("docx"), v.literal("other")),
      size: v.optional(v.number()),
    }))),
    reactions: v.optional(v.record(v.string(), v.array(v.id("users")))),
    readBy: v.optional(v.array(v.id("users"))),
    senderName: v.optional(v.string()),
    receiverName: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    // Get messages between current user and other user
    const messages = await ctx.db
      .query("private_messages")
      .filter((q) => 
        q.or(
          q.and(
            q.eq(q.field("senderId"), user._id),
            q.eq(q.field("receiverId"), args.otherUserId)
          ),
          q.and(
            q.eq(q.field("senderId"), args.otherUserId),
            q.eq(q.field("receiverId"), user._id)
          )
        )
      )
      .order("desc")
      .take(50);

    // Get sender and receiver names
    const messagesWithNames = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        const receiver = await ctx.db.get(message.receiverId);
        
        return {
          ...message,
          senderName: sender?.name,
          receiverName: receiver?.name,
        };
      })
    );

    return messagesWithNames.reverse(); // Return in chronological order
  },
});

export const markPrivateMessageAsRead = mutation({
  args: {
    messageId: v.id("private_messages"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const user = await getCurrentUser(ctx);
      if (!user) {
        return { success: false, message: "User not authenticated" };
      }

      const message = await ctx.db.get(args.messageId);
      if (!message) {
        return { success: false, message: "Message not found" };
      }

      const currentReadBy = message.readBy || [];
      if (!currentReadBy.includes(user._id)) {
        await ctx.db.patch(args.messageId, {
          readBy: [...currentReadBy, user._id],
        });
      }

      return { success: true, message: "Message marked as read" };
    } catch (error) {
      console.error("Mark private message as read error:", error);
      return { success: false, message: "Failed to mark message as read" };
    }
  },
});

export const togglePrivateMessageReaction = mutation({
  args: {
    messageId: v.id("private_messages"),
    emoji: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const user = await getCurrentUser(ctx);
      if (!user) {
        return { success: false, message: "User not authenticated" };
      }

      const message = await ctx.db.get(args.messageId);
      if (!message) {
        return { success: false, message: "Message not found" };
      }

      const reactions = message.reactions || {};
      const emojiReactions = reactions[args.emoji] || [];
      
      let updatedReactions;
      if (emojiReactions.includes(user._id)) {
        // Remove reaction
        updatedReactions = {
          ...reactions,
          [args.emoji]: emojiReactions.filter(id => id !== user._id),
        };
        // Remove empty emoji arrays
        if (updatedReactions[args.emoji].length === 0) {
          delete updatedReactions[args.emoji];
        }
      } else {
        // Add reaction
        updatedReactions = {
          ...reactions,
          [args.emoji]: [...emojiReactions, user._id],
        };
      }

      await ctx.db.patch(args.messageId, {
        reactions: updatedReactions,
      });

      return { success: true, message: "Reaction toggled successfully" };
    } catch (error) {
      console.error("Toggle private message reaction error:", error);
      return { success: false, message: "Failed to toggle reaction" };
    }
  },
});

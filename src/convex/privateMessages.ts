import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { Id } from "./_generated/dataModel";

// Query to get direct messages between two users
export const getDirectMessages = query({
  args: {
    recipientId: v.union(v.id("users"), v.id("teamMembers")),
  },
  returns: v.array(v.object({
    _id: v.id("private_messages"),
    _creationTime: v.number(),
    senderId: v.id("users"),
    receiverId: v.id("users"), // Always return users ID after conversion
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

    // Convert recipientId to actual user ID if needed
    let actualRecipientId: Id<"users">;
    
    // Check if recipientId is from teamMembers table
    if (args.recipientId.toString().includes("teamMembers")) {
      const teamMember = await ctx.db.get(args.recipientId as Id<"teamMembers">);
      if (!teamMember || !teamMember.userId) {
        return [];
      }
      actualRecipientId = teamMember.userId;
    } else {
      actualRecipientId = args.recipientId as Id<"users">;
    }

    // Get messages between current user and recipient
    const messages = await ctx.db
      .query("private_messages")
      .filter((q) => 
        q.or(
          q.and(
            q.eq(q.field("senderId"), user._id),
            q.eq(q.field("receiverId"), actualRecipientId)
          ),
          q.and(
            q.eq(q.field("senderId"), actualRecipientId),
            q.eq(q.field("receiverId"), user._id)
          )
        )
      )
      .order("asc") // Sort by timestamp ascending for chronological order
      .collect();

    // Get sender and receiver names for display
    const messagesWithNames = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        const receiver = await ctx.db.get(message.receiverId);
        
        return {
          _id: message._id,
          _creationTime: message._creationTime,
          senderId: message.senderId,
          receiverId: message.receiverId, // This is already a users ID from schema
          message: message.message,
          timestamp: message.timestamp,
          attachments: message.attachments,
          reactions: message.reactions,
          readBy: message.readBy,
          senderName: sender?.name,
          receiverName: receiver?.name,
        };
      })
    );

    return messagesWithNames;
  },
});

export const sendDirectMessage = mutation({
  args: {
    recipientId: v.union(v.id("users"), v.id("teamMembers")),
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
    messageId: v.optional(v.id("private_messages")),
  }),
  handler: async (ctx, args) => {
    try {
      const user = await getCurrentUser(ctx);
      if (!user) {
        return { success: false, message: "User not authenticated" };
      }

      // Convert recipientId to actual user ID if needed
      let actualRecipientId: Id<"users">;
      
      if (args.recipientId.toString().includes("teamMembers")) {
        const teamMember = await ctx.db.get(args.recipientId as Id<"teamMembers">);
        if (!teamMember || !teamMember.userId) {
          return { success: false, message: "Recipient not found" };
        }
        actualRecipientId = teamMember.userId;
      } else {
        actualRecipientId = args.recipientId as Id<"users">;
      }

      const messageId = await ctx.db.insert("private_messages", {
        senderId: user._id,
        receiverId: actualRecipientId, // Always store as users ID
        message: args.message,
        timestamp: Date.now(),
        attachments: args.attachments,
        reactions: {},
        readBy: [user._id], // Sender has read their own message
      });

      return { 
        success: true, 
        message: "Message sent successfully",
        messageId 
      };
    } catch (error) {
      console.error("Send direct message error:", error);
      return { success: false, message: "Failed to send message" };
    }
  },
});

export const sendPrivateMessage = mutation({
  args: {
    receiverId: v.union(v.id("users"), v.id("teamMembers")),
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

      // Convert receiverId to users table ID if it's a teamMember
      let actualReceiverId: Id<"users">;
      
      // Check if it's a teamMember ID
      if (args.receiverId.toString().includes("teamMembers")) {
        const teamMember = await ctx.db.get(args.receiverId as Id<"teamMembers">);
        if (!teamMember) {
          return { success: false, message: "Team member not found" };
        }
        // For now, we'll use the teamMember ID as string and convert to users ID
        // This is a temporary solution - in production you'd want proper user mapping
        actualReceiverId = args.receiverId as unknown as Id<"users">;
      } else {
        actualReceiverId = args.receiverId as Id<"users">;
      }

      await ctx.db.insert("private_messages", {
        senderId: user._id,
        receiverId: actualReceiverId,
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
    otherUserId: v.union(v.id("users"), v.id("teamMembers")),
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

    // Convert otherUserId to users table ID if it's a teamMember
    let actualOtherUserId: Id<"users">;
    
    if (args.otherUserId.toString().includes("teamMembers")) {
      // For teamMembers, we'll use the ID as-is but cast it
      // In a real app, you'd want proper user mapping between tables
      actualOtherUserId = args.otherUserId as unknown as Id<"users">;
    } else {
      actualOtherUserId = args.otherUserId as Id<"users">;
    }

    // Get messages between current user and other user
    const messages = await ctx.db
      .query("private_messages")
      .filter((q) => 
        q.or(
          q.and(
            q.eq(q.field("senderId"), user._id),
            q.eq(q.field("receiverId"), actualOtherUserId)
          ),
          q.and(
            q.eq(q.field("senderId"), actualOtherUserId),
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
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { Id } from "./_generated/dataModel";

export const postMessage = mutation({
  args: {
    messageText: v.string(),
    attachmentUrl: v.optional(v.string()),
    attachmentType: v.optional(v.union(v.literal("image"), v.literal("pdf"))),
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

      // Check if user is admin (assuming role field exists)
      if (user.role !== "admin") {
        return { success: false, message: "Only admins can post messages" };
      }

      await ctx.db.insert("admin_communication_messages", {
        messageText: args.messageText.trim(),
        senderId: user._id,
        senderName: user.name || "Admin",
        timestamp: Date.now(),
        attachmentUrl: args.attachmentUrl,
        attachmentType: args.attachmentType,
        emojiReactions: [],
        readBy: [], // Add the required readBy field
      });

      return { success: true, message: "Message posted successfully" };
    } catch (error) {
      console.error("Post message error:", error);
      return { success: false, message: "Failed to post message" };
    }
  },
});

export const getMessages = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("admin_communication_messages"),
    _creationTime: v.number(),
    messageText: v.string(),
    senderId: v.union(v.id("users"), v.id("admins")),
    senderName: v.string(),
    timestamp: v.number(),
    attachmentUrl: v.optional(v.string()),
    attachmentType: v.optional(v.union(v.literal("image"), v.literal("pdf"))),
    emojiReactions: v.array(v.object({
      emoji: v.string(),
      userId: v.id("users"),
      timestamp: v.number(),
    })),
    readBy: v.array(v.object({
      userId: v.id("users"),
      readAt: v.number(),
    })),
  })),
  handler: async (ctx) => {
    const messages = await ctx.db
      .query("admin_communication_messages")
      .withIndex("by_timestamp")
      .order("asc")
      .collect();
    
    return messages;
  },
});

export const uploadFile = mutation({
  args: {
    file: v.id("_storage"), // File storage ID
  },
  returns: v.object({
    success: v.boolean(),
    url: v.optional(v.string()),
    type: v.optional(v.union(v.literal("image"), v.literal("pdf"))),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const user = await getCurrentUser(ctx);
      if (!user) {
        return { success: false, message: "User not authenticated" };
      }

      // Check if user is admin
      const isAdmin = user.role === "admin" || user.email?.includes("admin");
      
      if (!isAdmin) {
        return { success: false, message: "Only admins can upload files." };
      }

      // Get the file URL from storage
      const url = await ctx.storage.getUrl(args.file);
      if (!url) {
        return { success: false, message: "Failed to get file URL" };
      }

      // Get file metadata to determine type
      const metadata = await ctx.db.system.get(args.file);
      let fileType: "image" | "pdf" = "image";
      
      // Type guard to check if metadata is storage metadata
      if (metadata && '_id' in metadata && metadata._id.startsWith('k')) {
        const storageMetadata = metadata as { contentType?: string };
        if (storageMetadata.contentType?.includes("pdf")) {
          fileType = "pdf";
        } else if (storageMetadata.contentType?.includes("image")) {
          fileType = "image";
        }
      }

      return { 
        success: true, 
        url, 
        type: fileType,
        message: "File uploaded successfully!" 
      };
    } catch (error) {
      console.error("File upload error:", error);
      return { success: false, message: "Failed to upload file. Please try again." };
    }
  },
});

export const toggleEmojiReaction = mutation({
  args: {
    messageId: v.id("admin_communication_messages"),
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

      const currentReactions = message.emojiReactions || [];
      const existingReactionIndex = currentReactions.findIndex(
        reaction => reaction.emoji === args.emoji && reaction.userId === user._id
      );

      let updatedReactions;
      if (existingReactionIndex >= 0) {
        // Remove existing reaction (toggle off)
        updatedReactions = currentReactions.filter((_, index) => index !== existingReactionIndex);
      } else {
        // Add new reaction
        updatedReactions = [
          ...currentReactions,
          {
            emoji: args.emoji,
            userId: user._id,
            timestamp: Date.now(),
          }
        ];
      }

      await ctx.db.patch(args.messageId, {
        emojiReactions: updatedReactions,
      });

      return { success: true, message: "Reaction updated successfully!" };
    } catch (error) {
      console.error("Toggle emoji reaction error:", error);
      return { success: false, message: "Failed to update reaction. Please try again." };
    }
  },
});

export const markAsRead = mutation({
  args: {
    messageId: v.id("admin_communication_messages"),
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

      // Get the message
      const message = await ctx.db.get(args.messageId);
      if (!message) {
        return { success: false, message: "Message not found" };
      }

      // Don't mark as read if user is the sender
      if (message.senderId === user._id) {
        return { success: true, message: "Sender doesn't need to mark as read" };
      }

      // Check if user has already read this message
      const hasRead = (message.readBy || []).some((receipt: { userId: Id<"users">; readAt: number }) => receipt.userId === user._id);
      if (hasRead) {
        return { success: true, message: "Already marked as read" };
      }

      // Add read receipt
      const currentReadBy = message.readBy || [];
      const newReadReceipt = {
        userId: user._id,
        readAt: Date.now(),
      };

      await ctx.db.patch(args.messageId, {
        readBy: [...currentReadBy, newReadReceipt],
      });

      return { success: true, message: "Marked as read" };
    } catch (error) {
      console.error("Mark as read error:", error);
      return { success: false, message: "Failed to mark as read" };
    }
  },
});
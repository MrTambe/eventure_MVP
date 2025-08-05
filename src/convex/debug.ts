import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const checkMessages = query({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db.query("private_messages").collect();
    return messages.map(msg => ({
      _id: msg._id,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      message: msg.message.substring(0, 50) + "...",
    }));
  },
});

export const cleanupMessages = mutation({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db.query("private_messages").collect();
    let cleaned = 0;
    
    for (const message of messages) {
      try {
        // Try to get the receiver as a user
        const receiver = await ctx.db.get(message.receiverId);
        if (!receiver) {
          // If receiver doesn't exist as a user, delete the message
          await ctx.db.delete(message._id);
          cleaned++;
        }
      } catch (error) {
        // If there's an error getting the receiver, delete the message
        await ctx.db.delete(message._id);
        cleaned++;
      }
    }
    
    return { cleaned };
  },
});

export const deleteAllMessages = mutation({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db.query("private_messages").collect();
    let deleted = 0;
    
    for (const message of messages) {
      await ctx.db.delete(message._id);
      deleted++;
    }
    
    return { deleted };
  },
});
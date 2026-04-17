import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { internal } from "./_generated/api";

export const listMessages = query({
  handler: async (ctx) => {
    const messages = await ctx.db.query("admin_communication_messages").order("desc").take(100);
    const messagesWithAuthors = await Promise.all(
      messages.map(async (message) => {
        // Try users table first
        let authorName: string | undefined;
        let authorImage: string | undefined;
        try {
          const author = await ctx.db.get(message.authorId);
          if (author) {
            authorName = (author as any).name;
            authorImage = (author as any).image;
          }
        } catch {
          // authorId might be from admins/teamMembers table (session-based admin)
        }

        // If not found in users, try admins and teamMembers
        if (!authorName) {
          try {
            const admin = await ctx.db.get(message.authorId as any);
            if (admin && (admin as any).name) {
              authorName = (admin as any).name;
            } else if (admin && (admin as any).email) {
              authorName = (admin as any).email;
            }
          } catch {
            // ignore
          }
        }

        return {
          ...message,
          authorName: authorName || "Admin",
          authorImage,
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
    adminEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Try Convex auth user first
    const user = await getCurrentUser(ctx);
    if (user && user.role === "admin") {
      await ctx.db.insert("admin_communication_messages", {
        authorId: user._id,
        content: args.content,
      });
      return;
    }

    // 2. Fallback: verify via adminEmail (session-based admin login)
    if (args.adminEmail) {
      const normalizedEmail = args.adminEmail.toLowerCase();

      // Check admins table
      const admin = await ctx.db
        .query("admins")
        .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
        .first();

      if (!admin) {
        // Check teamMembers table
        const teamMember = await ctx.db
          .query("teamMembers")
          .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
          .first();

        if (!teamMember) {
          throw new Error("Admin access required");
        }
      }

      // Try to find a matching users record for authorId
      const matchingUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", normalizedEmail))
        .first();

      if (matchingUser) {
        await ctx.db.insert("admin_communication_messages", {
          authorId: matchingUser._id,
          content: args.content,
        });
      } else {
        // No users record — store with admin name in content as fallback
        // Use the admin's _id cast (schema validation is off)
        const authorId = admin ? admin._id : (await ctx.db.query("teamMembers").withIndex("by_email", (q) => q.eq("email", normalizedEmail)).first())?._id;
        if (!authorId) {
          throw new Error("Could not resolve author");
        }
        await ctx.db.insert("admin_communication_messages", {
          authorId: authorId as any,
          content: args.content,
        });
      }
      return;
    }

    // 3. If user exists but not admin and no adminEmail provided
    if (user) {
      throw new Error("Only admins can post messages");
    }

    throw new Error("Not authenticated");
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
    const teamMembers = await ctx.db.query("teamMembers").take(1000);
    return teamMembers.length;
  },
});

// ===== Event Channel Messages =====

export const listEventChannelMessages = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("event_channel_messages")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .take(100);
    return messages.reverse();
  },
});

export const postEventChannelMessage = mutation({
  args: {
    eventId: v.id("events"),
    content: v.string(),
    adminEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify event exists
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // 1. Try Convex auth user first
    const user = await getCurrentUser(ctx);
    if (user) {
      // Admins can always post
      if (user.role === "admin") {
        await ctx.db.insert("event_channel_messages", {
          eventId: args.eventId,
          authorId: user._id,
          authorName: user.name || user.email || "Admin",
          content: args.content,
        });
        return { success: true };
      }
      // Regular users can post if they are registered for the event
      // (For now, allow all authenticated users to post in event channels)
      await ctx.db.insert("event_channel_messages", {
        eventId: args.eventId,
        authorId: user._id,
        authorName: user.name || user.email || "User",
        content: args.content,
      });
      return { success: true };
    }

    // 2. Fallback: session-based admin
    if (args.adminEmail) {
      const normalizedEmail = args.adminEmail.toLowerCase();

      const admin = await ctx.db
        .query("admins")
        .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
        .first();

      if (admin) {
        await ctx.db.insert("event_channel_messages", {
          eventId: args.eventId,
          authorId: admin._id as string,
          authorName: admin.name || admin.email,
          content: args.content,
        });
        return { success: true };
      }

      const teamMember = await ctx.db
        .query("teamMembers")
        .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
        .first();

      if (teamMember) {
        await ctx.db.insert("event_channel_messages", {
          eventId: args.eventId,
          authorId: teamMember._id as string,
          authorName: teamMember.name || teamMember.email,
          content: args.content,
        });
        return { success: true };
      }

      throw new Error("Access denied");
    }

    throw new Error("Not authenticated");
  },
});

export const toggleEventChannelReaction = mutation({
  args: {
    messageId: v.id("event_channel_messages"),
    emoji: v.string(),
    adminEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Determine user ID
    let userId: string | null = null;

    const user = await getCurrentUser(ctx);
    if (user) {
      userId = user._id;
    } else if (args.adminEmail) {
      const normalizedEmail = args.adminEmail.toLowerCase();
      const admin = await ctx.db
        .query("admins")
        .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
        .first();
      if (admin) {
        userId = admin._id as string;
      } else {
        const teamMember = await ctx.db
          .query("teamMembers")
          .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
          .first();
        if (teamMember) {
          userId = teamMember._id as string;
        }
      }
    }

    if (!userId) {
      throw new Error("Not authenticated");
    }

    const reactions = message.reactions || [];
    const existingIndex = reactions.findIndex(
      (r) => r.userId === userId && r.emoji === args.emoji
    );

    if (existingIndex >= 0) {
      reactions.splice(existingIndex, 1);
    } else {
      reactions.push({ userId, emoji: args.emoji });
    }

    await ctx.db.patch(args.messageId, { reactions });
    return { success: true };
  },
});

export const getActiveEventsForChannels = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(50);
    return events.map((e) => ({
      _id: e._id,
      name: e.name,
      venue: e.venue,
      startDate: e.startDate,
    }));
  },
});
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { internal } from "./_generated/api";
import { MutationCtx } from "./_generated/server";

// Helper: extract @mentions from content and create notifications
async function notifyMentionedUsers(
  ctx: MutationCtx,
  content: string,
  authorName: string,
  linkId: string,
  linkLabel: string
) {
  const mentionPattern = /@(\w+)/g;
  const mentions = new Set<string>();
  let match;
  while ((match = mentionPattern.exec(content)) !== null) {
    mentions.add(match[1]);
  }
  if (mentions.size === 0) return;

  // Look up each mentioned name in the users table
  for (const mentionedName of mentions) {
    try {
      // Search users by name (case-insensitive partial match via scan — limited to 50)
      const users = await ctx.db.query("users").take(200);
      const matchedUser = users.find(
        (u) => u.name && u.name.toLowerCase().startsWith(mentionedName.toLowerCase())
      );
      if (matchedUser) {
        await ctx.db.insert("notifications", {
          recipientId: matchedUser._id,
          type: "mention",
          content: `${authorName} mentioned you in ${linkLabel}`,
          isRead: false,
          linkId,
        });
      }
    } catch {
      // Skip silently if user not found or any error
    }
  }
}

export const listMessages = query({
  args: {
    channel: v.optional(v.union(v.literal("general"), v.literal("announcements"), v.literal("urgent"))),
  },
  handler: async (ctx, args) => {
    const channelFilter = args.channel || "general";
    
    let messages;
    if (channelFilter === "general") {
      // For "general" channel, include messages with no channel set (legacy) and explicit "general"
      const allMessages = await ctx.db
        .query("admin_communication_messages")
        .order("desc")
        .take(200);
      messages = allMessages.filter(
        (m) => !(m as any).channel || (m as any).channel === "general"
      ).slice(0, 100);
    } else {
      messages = await ctx.db
        .query("admin_communication_messages")
        .withIndex("by_channel", (q) => q.eq("channel", channelFilter))
        .order("desc")
        .take(100);
    }
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
    channel: v.optional(v.union(v.literal("general"), v.literal("announcements"), v.literal("urgent"))),
  },
  handler: async (ctx, args) => {
    const channel = args.channel || "general";
    let authorName = "Admin";

    // 1. Try Convex auth user first
    const user = await getCurrentUser(ctx);
    if (user && user.role === "admin") {
      await ctx.db.insert("admin_communication_messages", {
        authorId: user._id,
        content: args.content,
        channel,
      });
      authorName = user.name || user.email || "Admin";
      await notifyMentionedUsers(ctx, args.content, authorName, channel, `#${channel}`);
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

      // Resolve author name
      if (admin) {
        authorName = admin.name || admin.email;
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
          channel,
        });
        authorName = matchingUser.name || authorName;
      } else {
        const authorId = admin ? admin._id : (await ctx.db.query("teamMembers").withIndex("by_email", (q) => q.eq("email", normalizedEmail)).first())?._id;
        if (!authorId) {
          throw new Error("Could not resolve author");
        }
        await ctx.db.insert("admin_communication_messages", {
          authorId: authorId as any,
          content: args.content,
          channel,
        });
      }

      await notifyMentionedUsers(ctx, args.content, authorName, channel, `#${channel}`);
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

    let authorName = "Unknown";

    // 1. Try Convex auth user first
    const user = await getCurrentUser(ctx);
    if (user) {
      authorName = user.name || user.email || (user.role === "admin" ? "Admin" : "User");
      await ctx.db.insert("event_channel_messages", {
        eventId: args.eventId,
        authorId: user._id,
        authorName,
        content: args.content,
      });
      await notifyMentionedUsers(ctx, args.content, authorName, args.eventId, event.name);
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
        authorName = admin.name || admin.email;
        await ctx.db.insert("event_channel_messages", {
          eventId: args.eventId,
          authorId: admin._id as string,
          authorName,
          content: args.content,
        });
        await notifyMentionedUsers(ctx, args.content, authorName, args.eventId, event.name);
        return { success: true };
      }

      const teamMember = await ctx.db
        .query("teamMembers")
        .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
        .first();

      if (teamMember) {
        authorName = teamMember.name || teamMember.email;
        await ctx.db.insert("event_channel_messages", {
          eventId: args.eventId,
          authorId: teamMember._id as string,
          authorName,
          content: args.content,
        });
        await notifyMentionedUsers(ctx, args.content, authorName, args.eventId, event.name);
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

// ===== Mention Autocomplete =====

export const searchTeamMembers = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.searchTerm.trim()) return [];
    const term = args.searchTerm.toLowerCase();

    // Search across users, admins, and teamMembers
    const [users, admins, teamMembers] = await Promise.all([
      ctx.db.query("users").take(200),
      ctx.db.query("admins").take(100),
      ctx.db.query("teamMembers").take(100),
    ]);

    const results: Array<{ name: string; email: string }> = [];
    const seen = new Set<string>();

    for (const u of users) {
      if (u.name && u.name.toLowerCase().includes(term) && !seen.has(u.name.toLowerCase())) {
        seen.add(u.name.toLowerCase());
        results.push({ name: u.name, email: u.email || "" });
      }
    }
    for (const a of admins) {
      if (a.name && a.name.toLowerCase().includes(term) && !seen.has(a.name.toLowerCase())) {
        seen.add(a.name.toLowerCase());
        results.push({ name: a.name, email: a.email });
      }
    }
    for (const t of teamMembers) {
      if (t.name && t.name.toLowerCase().includes(term) && !seen.has(t.name.toLowerCase())) {
        seen.add(t.name.toLowerCase());
        results.push({ name: t.name, email: t.email });
      }
    }

    return results.slice(0, 10);
  },
});

// ===== Notifications =====

export const createNotification = mutation({
  args: {
    recipientId: v.string(),
    type: v.string(),
    content: v.string(),
    linkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("notifications", {
      recipientId: args.recipientId,
      type: args.type,
      content: args.content,
      isRead: false,
      linkId: args.linkId,
    });
    return id;
  },
});

export const getUserNotifications = query({
  args: {
    recipientId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", args.recipientId))
      .order("desc")
      .take(20);
  },
});

export const markNotificationAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { isRead: true });
    return { success: true };
  },
});

export const markAllNotificationsAsRead = mutation({
  args: {
    recipientId: v.string(),
  },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_and_read", (q) =>
        q.eq("recipientId", args.recipientId).eq("isRead", false)
      )
      .take(100);
    
    await Promise.all(
      unread.map((n) => ctx.db.patch(n._id, { isRead: true }))
    );
    
    return { success: true, count: unread.length };
  },
});

export const getUnreadNotificationCount = query({
  args: {
    recipientId: v.string(),
  },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_and_read", (q) =>
        q.eq("recipientId", args.recipientId).eq("isRead", false)
      )
      .take(100);
    return unread.length;
  },
});

// Query for admin dashboard - get single latest broadcast message
export const getLatestBroadcast = query({
  args: {},
  handler: async (ctx) => {
    const latest = await ctx.db
      .query("admin_communication_messages")
      .order("desc")
      .take(1);
    if (!latest || latest.length === 0) return null;
    const message = latest[0];
    let authorName = "Admin";
    try {
      const author = await ctx.db.get(message.authorId);
      if (author && (author as any).name) authorName = (author as any).name;
      else if (author && (author as any).email) authorName = (author as any).email;
    } catch {}
    return {
      _id: message._id,
      content: message.content,
      channel: (message as any).channel || "general",
      authorName,
      _creationTime: message._creationTime,
    };
  },
});

// Query for user dashboard - get latest broadcast messages
export const getLatestBroadcasts = query({
  args: {},
  handler: async (ctx) => {
    // Get latest messages from announcements and urgent channels
    const announcements = await ctx.db
      .query("admin_communication_messages")
      .withIndex("by_channel", (q) => q.eq("channel", "announcements"))
      .order("desc")
      .take(5);

    const urgent = await ctx.db
      .query("admin_communication_messages")
      .withIndex("by_channel", (q) => q.eq("channel", "urgent"))
      .order("desc")
      .take(3);

    // Also get general messages
    const allGeneral = await ctx.db
      .query("admin_communication_messages")
      .order("desc")
      .take(50);
    const general = allGeneral
      .filter((m) => !(m as any).channel || (m as any).channel === "general")
      .slice(0, 5);

    // Combine and sort by creation time, take latest 8
    const combined = [...announcements, ...urgent, ...general];
    // Deduplicate by _id
    const seen = new Set<string>();
    const unique = combined.filter((m) => {
      if (seen.has(m._id)) return false;
      seen.add(m._id);
      return true;
    });
    // Sort by creation time desc
    unique.sort((a, b) => b._creationTime - a._creationTime);

    // Resolve author names
    const result = await Promise.all(
      unique.slice(0, 8).map(async (message) => {
        let authorName = "Admin";
        try {
          const author = await ctx.db.get(message.authorId);
          if (author && (author as any).name) {
            authorName = (author as any).name;
          } else if (author && (author as any).email) {
            authorName = (author as any).email;
          }
        } catch {
          // ignore
        }
        return {
          _id: message._id,
          content: message.content,
          channel: (message as any).channel || "general",
          authorName,
          _creationTime: message._creationTime,
        };
      })
    );

    return result;
  },
});

// Query for user communication page - get event channel messages for events the user is registered for
export const getUserEventCommunications = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    // Get user's registered event IDs
    const registrations = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(200);

    const teamRegistrations = await ctx.db
      .query("teamRegistrations")
      .withIndex("by_user", (q) => q.eq("registeredByUserId", user._id))
      .take(100);

    const registeredEventIds = new Set<string>([
      ...registrations.map((r) => r.eventId as string),
      ...teamRegistrations.map((r) => r.eventId as string),
    ]);

    if (registeredEventIds.size === 0) return [];

    // Fetch event details for registered events
    const eventMap = new Map<string, { name: string; startDate: number }>();
    for (const eventId of registeredEventIds) {
      const event = await ctx.db.get(eventId as any);
      if (event) {
        eventMap.set(eventId, { name: (event as any).name, startDate: (event as any).startDate });
      }
    }

    // Fetch event channel messages for each registered event
    const allMessages: Array<{
      _id: string;
      eventId: string;
      eventName: string;
      authorName: string;
      content: string;
      _creationTime: number;
    }> = [];

    for (const eventId of registeredEventIds) {
      const messages = await ctx.db
        .query("event_channel_messages")
        .withIndex("by_event", (q) => q.eq("eventId", eventId as any))
        .order("desc")
        .take(50);

      const eventInfo = eventMap.get(eventId);
      for (const msg of messages) {
        allMessages.push({
          _id: msg._id,
          eventId,
          eventName: eventInfo?.name ?? "Unknown Event",
          authorName: msg.authorName,
          content: msg.content,
          _creationTime: msg._creationTime,
        });
      }
    }

    // Sort by creation time desc
    allMessages.sort((a, b) => b._creationTime - a._creationTime);

    return allMessages.slice(0, 100);
  },
});
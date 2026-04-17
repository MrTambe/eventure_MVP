import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";

export const createTicket = mutation({
  args: {
    subject: v.string(),
    description: v.string(),
    category: v.string(),
    eventId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return { success: false, message: "User not authenticated" };
    }

    const ticketId = await ctx.db.insert("tickets", {
      creatorId: user._id,
      subject: args.subject.trim(),
      description: args.description.trim(),
      category: args.category,
      eventId: args.eventId,
      status: "open",
      priority: "medium",
      createdAt: Date.now(),
    });

    return { success: true, message: "Ticket created successfully", ticketId };
  },
});

export const getUserTickets = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.userId))
      .take(50);

    // Sort by createdAt descending (newest first)
    return tickets.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const listAllTickets = query({
  args: {},
  handler: async (ctx) => {
    const tickets = await ctx.db
      .query("tickets")
      .take(100);

    // Sort by createdAt descending (newest first)
    return tickets.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getTicketReplies = query({
  args: {
    ticketId: v.string(),
  },
  handler: async (ctx, args) => {
    const replies = await ctx.db
      .query("ticket_replies")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .take(200);

    // Sort by createdAt ascending (oldest first)
    return replies.sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const addReply = mutation({
  args: {
    ticketId: v.string(),
    authorId: v.string(),
    authorName: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const replyId = await ctx.db.insert("ticket_replies", {
      ticketId: args.ticketId,
      authorId: args.authorId,
      authorName: args.authorName,
      content: args.content.trim(),
      createdAt: Date.now(),
    });

    return { success: true, message: "Reply added", replyId };
  },
});

export const closeTicket = mutation({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      return { success: false, message: "Ticket not found" };
    }

    await ctx.db.patch(args.ticketId, { status: "closed" });
    return { success: true, message: "Ticket closed" };
  },
});

export const updateTicketPriority = mutation({
  args: {
    ticketId: v.id("tickets"),
    priority: v.string(),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      return { success: false, message: "Ticket not found" };
    }

    await ctx.db.patch(args.ticketId, { priority: args.priority });
    return { success: true, message: "Priority updated" };
  },
});

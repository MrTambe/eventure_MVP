import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";

export const list = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("events"),
    name: v.string(),
    description: v.string(),
    venue: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    maxParticipants: v.optional(v.number()),
    createdBy: v.id("users"),
    status: v.union(v.literal("active"), v.literal("cancelled"), v.literal("completed")),
  })),
  handler: async (ctx) => {
    return await ctx.db.query("events").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    venue: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    maxParticipants: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    eventId: v.optional(v.id("events")),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return { success: false, message: "User not authenticated" };
    }

    try {
      const eventId = await ctx.db.insert("events", {
        name: args.name,
        description: args.description,
        venue: args.venue,
        startDate: args.startDate,
        endDate: args.endDate,
        maxParticipants: args.maxParticipants,
        createdBy: user._id,
        status: "active",
      });

      return { 
        success: true, 
        message: "Event created successfully",
        eventId 
      };
    } catch (error) {
      return { 
        success: false, 
        message: "Failed to create event" 
      };
    }
  },
});

export const getById = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("events"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    venue: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    maxParticipants: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("cancelled"), v.literal("completed"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const createEvent = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    venue: v.string(),
    eventDate: v.string(),
    eventTime: v.string(),
    maxParticipants: v.optional(v.number()),
    volunteerIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Convert date and time to timestamps
    const eventDateTime = new Date(`${args.eventDate}T${args.eventTime}`);
    const startDate = eventDateTime.getTime();
    const endDate = startDate + (2 * 60 * 60 * 1000); // Default 2 hours duration

    const eventId = await ctx.db.insert("events", {
      name: args.name,
      description: args.description,
      venue: args.venue,
      startDate,
      endDate,
      maxParticipants: args.maxParticipants,
      createdBy: user._id,
      status: "active",
    });

    return {
      success: true,
      message: "Event created successfully",
      eventId,
    };
  },
});

export const createEventAsAdmin = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    venue: v.string(),
    eventDate: v.string(),
    eventTime: v.string(),
    maxParticipants: v.optional(v.number()),
    volunteerIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    // Convert date and time to timestamps
    const eventDateTime = new Date(`${args.eventDate}T${args.eventTime}`);
    const startDate = eventDateTime.getTime();
    const endDate = startDate + (2 * 60 * 60 * 1000); // Default 2 hours duration

    const eventId = await ctx.db.insert("events", {
      name: args.name,
      description: args.description,
      venue: args.venue,
      startDate,
      endDate,
      maxParticipants: args.maxParticipants,
      createdBy: user._id,
      status: "active",
    });

    return {
      success: true,
      message: "Event created successfully",
      eventId,
    };
  },
});

export const updateEventAsAdmin = mutation({
  args: {
    id: v.id("events"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    venue: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"), v.literal("cancelled"))),
    maxParticipants: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();

    if (user?.role !== "admin") {
      throw new Error("You are not authorized to perform this action");
    }

    const { id, ...rest } = args;

    await ctx.db.patch(id, rest);

    return { success: true, message: "Event updated successfully" };
  },
});

export const deleteEventAsAdmin = mutation({
  args: {
    id: v.id("events"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .unique();

    if (user?.role !== "admin") {
      throw new Error("You are not authorized to perform this action");
    }

    await ctx.db.delete(args.id);

    return { success: true, message: "Event deleted successfully" };
  },
});

export const getCurrentOngoingEvent = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const events = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    
    return events.find(event => 
      event.startDate <= now && event.endDate >= now
    ) || null;
  },
});

export const getNextUpcomingEvent = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const events = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    
    const upcomingEvents = events
      .filter(event => event.startDate > now)
      .sort((a, b) => a.startDate - b.startDate);
    
    return upcomingEvents[0] || null;
  },
});

export const getAllEventsWithDetails = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("events").collect();
    
    const eventsWithDetails = await Promise.all(
      events.map(async (event) => {
        const creator = await ctx.db.get(event.createdBy);
        const registrations = await ctx.db
          .query("eventRegistrations")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .collect();
        
        return {
          ...event,
          creatorName: creator?.name || "Unknown",
          participantCount: registrations.length,
          volunteers: [],
          registrations: registrations, // Add this for compatibility
        };
      })
    );
    
    return eventsWithDetails;
  },
});

export const getUpcomingEvents = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const events = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    
    return events.filter(event => event.startDate > now);
  },
});

export const getEventParticipants = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const registrations = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    
    const participants = await Promise.all(
      registrations.map(async (registration) => {
        const user = await ctx.db.get(registration.userId);
        return {
          ...registration,
          user,
        };
      })
    );
    
    return participants;
  },
});
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";

export const getUserStats = query({
  args: {},
  returns: v.object({
    name: v.string(),
    totalEventsJoined: v.number(),
    totalCertificates: v.number(),
  }),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Count total events joined
    const registrations = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Count total certificates
    const certificates = await ctx.db
      .query("certificates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return {
      name: user.name || "User",
      totalEventsJoined: registrations.length,
      totalCertificates: certificates.length,
    };
  },
});

export const getUpcomingEvents = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("events"),
    name: v.string(),
    venue: v.string(),
    startDate: v.number(),
    endDate: v.number(),
  })),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const now = Date.now();

    // Get user's registrations
    const registrations = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "registered"))
      .collect();

    const upcomingEvents = [];
    
    for (const registration of registrations) {
      const event = await ctx.db.get(registration.eventId);
      if (event && event.startDate > now) {
        upcomingEvents.push({
          _id: event._id,
          name: event.name,
          venue: event.venue,
          startDate: event.startDate,
          endDate: event.endDate,
        });
      }
    }

    // Sort by start date
    return upcomingEvents.sort((a, b) => a.startDate - b.startDate);
  },
});

export const getCompletedEvents = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("events"),
    name: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    hasCertificate: v.boolean(),
    certificateUrl: v.optional(v.string()),
  })),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const now = Date.now();

    // Get user's registrations
    const registrations = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const completedEvents = [];
    
    for (const registration of registrations) {
      const event = await ctx.db.get(registration.eventId);
      if (event && event.endDate < now) {
        // Check if user has a certificate for this event
        const certificate = await ctx.db
          .query("certificates")
          .withIndex("by_user_and_event", (q) => 
            q.eq("userId", user._id).eq("eventId", event._id)
          )
          .first();

        completedEvents.push({
          _id: event._id,
          name: event.name,
          startDate: event.startDate,
          endDate: event.endDate,
          hasCertificate: !!certificate,
          certificateUrl: certificate?.certificateUrl,
        });
      }
    }

    // Sort by end date (most recent first)
    return completedEvents.sort((a, b) => b.endDate - a.endDate);
  },
});

export const getAllEvents = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("events"),
    name: v.string(),
    venue: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    maxParticipants: v.optional(v.number()),
    currentParticipants: v.number(),
    status: v.union(v.literal("active"), v.literal("cancelled"), v.literal("completed")),
  })),
  handler: async (ctx) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const eventsWithParticipants = [];
    
    for (const event of events) {
      // Count current registrations for this event
      const registrations = await ctx.db
        .query("eventRegistrations")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .filter((q) => q.eq(q.field("status"), "registered"))
        .collect();

      eventsWithParticipants.push({
        _id: event._id,
        name: event.name,
        venue: event.venue,
        startDate: event.startDate,
        endDate: event.endDate,
        maxParticipants: event.maxParticipants,
        currentParticipants: registrations.length,
        status: event.status,
      });
    }

    return eventsWithParticipants;
  },
});

export const registerForEvent = mutation({
  args: {
    eventId: v.id("events"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if event exists
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      return { success: false, message: "Event not found" };
    }

    // Check if user is already registered
    const existingRegistration = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_user_and_event", (q) => 
        q.eq("userId", user._id).eq("eventId", args.eventId)
      )
      .first();

    if (existingRegistration) {
      return { success: false, message: "Already registered for this event" };
    }

    // Check if event is full
    const currentRegistrations = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("status"), "registered"))
      .collect();

    if (event.maxParticipants && currentRegistrations.length >= event.maxParticipants) {
      return { success: false, message: "Event is full" };
    }

    // Register user for event
    await ctx.db.insert("eventRegistrations", {
      eventId: args.eventId,
      userId: user._id,
      registrationDate: Date.now(),
      status: "registered",
    });

    return { success: true, message: "Successfully registered for event" };
  },
});

export const getAllUserRegisteredEvents = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const now = Date.now();
    const eventIdSet = new Set<string>();
    const results: Array<{ _id: any; name: string; venue: string; startDate: number; endDate: number; registrationType: string }> = [];

    // 1. Individual registrations
    const individualRegs = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const reg of individualRegs) {
      const event = await ctx.db.get(reg.eventId);
      if (event && event.startDate > now && !eventIdSet.has(event._id)) {
        eventIdSet.add(event._id);
        results.push({
          _id: event._id,
          name: event.name,
          venue: event.venue,
          startDate: event.startDate,
          endDate: event.endDate,
          registrationType: "individual",
        });
      }
    }

    // 2. Team registrations where user is the leader
    const teamRegsAsLeader = await ctx.db
      .query("teamRegistrations")
      .withIndex("by_user", (q) => q.eq("registeredByUserId", user._id))
      .collect();

    for (const reg of teamRegsAsLeader) {
      const event = await ctx.db.get(reg.eventId);
      if (event && event.startDate > now && !eventIdSet.has(event._id)) {
        eventIdSet.add(event._id);
        results.push({
          _id: event._id,
          name: event.name,
          venue: event.venue,
          startDate: event.startDate,
          endDate: event.endDate,
          registrationType: "team",
        });
      }
    }

    // 3. Team registrations where user's email matches a member
    if (user.email) {
      const allTeamRegs = await ctx.db.query("teamRegistrations").collect();
      for (const reg of allTeamRegs) {
        if (eventIdSet.has(reg.eventId)) continue;
        const isMember = reg.members.some((m: any) => m.email === user.email);
        if (isMember) {
          const event = await ctx.db.get(reg.eventId);
          if (event && event.startDate > now && !eventIdSet.has(event._id)) {
            eventIdSet.add(event._id);
            results.push({
              _id: event._id,
              name: event.name,
              venue: event.venue,
              startDate: event.startDate,
              endDate: event.endDate,
              registrationType: "team-member",
            });
          }
        }
      }
    }

    return results.sort((a, b) => a.startDate - b.startDate);
  },
});
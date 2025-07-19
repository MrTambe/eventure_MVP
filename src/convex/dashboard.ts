import { query } from "./_generated/server";
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

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";

export const createEvent = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    venue: v.string(),
    eventDate: v.string(), // ISO date string
    eventTime: v.string(), // HH:MM format
    maxParticipants: v.optional(v.number()),
    volunteerIds: v.array(v.id("users")),
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
      // Combine date and time to create timestamps
      const eventDateTime = new Date(`${args.eventDate}T${args.eventTime}`);
      const startDate = eventDateTime.getTime();
      
      // Set end date to 2 hours after start (can be customized)
      const endDate = startDate + (2 * 60 * 60 * 1000);

      // Create the event
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

      // Assign volunteers to the event
      const assignedDate = Date.now();
      for (const volunteerId of args.volunteerIds) {
        await ctx.db.insert("eventVolunteers", {
          eventId,
          userId: volunteerId,
          assignedDate,
          status: "assigned",
        });
      }
      
      return { 
        success: true, 
        message: `Event created successfully with ${args.volunteerIds.length} volunteers assigned!`, 
        eventId 
      };
    } catch (error) {
      console.error("Event creation error:", error);
      return { 
        success: false, 
        message: "Failed to create event. Please try again." 
      };
    }
  },
});

// Admin-specific event creation function
export const createEventAsAdmin = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    venue: v.string(),
    eventDate: v.string(), // ISO date string
    eventTime: v.string(), // HH:MM format
    maxParticipants: v.optional(v.number()),
    volunteerIds: v.array(v.id("users")),
    adminEmail: v.string(), // Admin email for verification
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    eventId: v.optional(v.id("events")),
  }),
  handler: async (ctx, args) => {
    try {
      // Verify admin exists
      const admin = await ctx.db
        .query("admins")
        .withIndex("by_email", (q) => q.eq("email", args.adminEmail))
        .first();

      if (!admin || !admin.isActive) {
        return { success: false, message: "Admin not found or inactive" };
      }

      // Combine date and time to create timestamps
      const eventDateTime = new Date(`${args.eventDate}T${args.eventTime}`);
      const startDate = eventDateTime.getTime();
      
      // Set end date to 2 hours after start (can be customized)
      const endDate = startDate + (2 * 60 * 60 * 1000);

      // Create the event
      const eventId = await ctx.db.insert("events", {
        name: args.name,
        description: args.description,
        venue: args.venue,
        startDate,
        endDate,
        maxParticipants: args.maxParticipants,
        createdBy: admin._id, // Using admin ID as creator
        status: "active",
      });

      // Assign volunteers to the event (only if volunteers exist)
      const assignedDate = Date.now();
      for (const volunteerId of args.volunteerIds) {
        // Verify volunteer exists before assigning
        const volunteer = await ctx.db.get(volunteerId);
        if (volunteer) {
          await ctx.db.insert("eventVolunteers", {
            eventId,
            userId: volunteerId,
            assignedDate,
            status: "assigned",
          });
        }
      }
      
      return { 
        success: true, 
        message: `Event created successfully with ${args.volunteerIds.length} volunteers assigned!`, 
        eventId 
      };
    } catch (error) {
      console.error("Admin event creation error:", error);
      return { 
        success: false, 
        message: "Failed to create event. Please try again." 
      };
    }
  },
});

export const getAllEvents = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("events"),
    _creationTime: v.number(),
    name: v.string(),
    description: v.string(),
    venue: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    maxParticipants: v.optional(v.number()),
    createdBy: v.union(v.id("users"), v.id("admins")),
    status: v.union(v.literal("active"), v.literal("cancelled"), v.literal("completed")),
  })),
  handler: async (ctx) => {
    const events = await ctx.db
      .query("events")
      .order("desc")
      .collect();
    
    return events;
  },
});

export const getEventsByStatus = query({
  args: {
    status: v.union(v.literal("active"), v.literal("cancelled"), v.literal("completed")),
  },
  returns: v.array(v.object({
    _id: v.id("events"),
    _creationTime: v.number(),
    name: v.string(),
    description: v.string(),
    venue: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    maxParticipants: v.optional(v.number()),
    createdBy: v.union(v.id("users"), v.id("admins")),
    status: v.union(v.literal("active"), v.literal("cancelled"), v.literal("completed")),
  })),
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .collect();
    
    return events;
  },
});

export const getUpcomingEvents = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("events"),
    _creationTime: v.number(),
    name: v.string(),
    description: v.string(),
    venue: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    maxParticipants: v.optional(v.number()),
    createdBy: v.union(v.id("users"), v.id("admins")),
    status: v.union(v.literal("active"), v.literal("cancelled"), v.literal("completed")),
  })),
  handler: async (ctx) => {
    const now = Date.now();
    const events = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.gte(q.field("startDate"), now))
      .order("asc")
      .collect();
    
    return events;
  },
});

export const getEventVolunteers = query({
  args: {
    eventId: v.id("events"),
  },
  returns: v.array(v.object({
    _id: v.id("eventVolunteers"),
    eventId: v.id("events"),
    userId: v.id("users"),
    assignedDate: v.number(),
    status: v.union(v.literal("assigned"), v.literal("confirmed"), v.literal("declined")),
    userName: v.optional(v.string()),
    userEmail: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const volunteers = await ctx.db
      .query("eventVolunteers")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Get user details for each volunteer
    const volunteersWithDetails = await Promise.all(
      volunteers.map(async (volunteer) => {
        const user = await ctx.db.get(volunteer.userId);
        return {
          ...volunteer,
          userName: user?.name,
          userEmail: user?.email,
        };
      })
    );

    return volunteersWithDetails;
  },
});
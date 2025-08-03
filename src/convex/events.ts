import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

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

export const updateEventAsAdmin = mutation({
  args: {
    eventId: v.id("events"),
    adminEmail: v.string(),
    name: v.string(),
    description: v.string(),
    venue: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    maxParticipants: v.optional(v.number()),
    volunteerIds: v.array(v.id("users")),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Verify admin exists and is active
      const admin = await ctx.db
        .query("admins")
        .withIndex("by_email", (q) => q.eq("email", args.adminEmail))
        .unique();

      if (!admin || !admin.isActive) {
        return {
          success: false,
          message: "Admin not found or inactive",
        };
      }

      // Check if event exists
      const existingEvent = await ctx.db.get(args.eventId);
      if (!existingEvent) {
        return {
          success: false,
          message: "Event not found",
        };
      }

      // Update the event
      await ctx.db.patch(args.eventId, {
        name: args.name,
        description: args.description,
        venue: args.venue,
        startDate: args.startDate,
        endDate: args.endDate,
        maxParticipants: args.maxParticipants,
      });

      // Remove existing volunteer assignments for this event
      const existingVolunteers = await ctx.db
        .query("eventVolunteers")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .collect();

      for (const volunteer of existingVolunteers) {
        await ctx.db.delete(volunteer._id);
      }

      // Add new volunteer assignments
      for (const volunteerId of args.volunteerIds) {
        await ctx.db.insert("eventVolunteers", {
          eventId: args.eventId,
          userId: volunteerId,
          assignedDate: Date.now(),
          status: "assigned",
        });
      }

      return {
        success: true,
        message: "Event updated successfully",
      };
    } catch (error) {
      console.error("Update event error:", error);
      return {
        success: false,
        message: "Failed to update event",
      };
    }
  },
});

export const deleteEventAsAdmin = mutation({
  args: {
    eventId: v.id("events"),
    adminEmail: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // Verify admin exists and is active
      const admin = await ctx.db
        .query("admins")
        .withIndex("by_email", (q) => q.eq("email", args.adminEmail))
        .unique();

      if (!admin || !admin.isActive) {
        return {
          success: false,
          message: "Admin not found or inactive",
        };
      }

      // Check if event exists
      const existingEvent = await ctx.db.get(args.eventId);
      if (!existingEvent) {
        return {
          success: false,
          message: "Event not found",
        };
      }

      // Delete related volunteer assignments
      const eventVolunteers = await ctx.db
        .query("eventVolunteers")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .collect();

      for (const volunteer of eventVolunteers) {
        await ctx.db.delete(volunteer._id);
      }

      // Delete related registrations
      const eventRegistrations = await ctx.db
        .query("eventRegistrations")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .collect();

      for (const registration of eventRegistrations) {
        await ctx.db.delete(registration._id);
      }

      // Delete related certificates
      const eventCertificates = await ctx.db
        .query("certificates")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .collect();

      for (const certificate of eventCertificates) {
        await ctx.db.delete(certificate._id);
      }

      // Finally, delete the event
      await ctx.db.delete(args.eventId);

      return {
        success: true,
        message: "Event deleted successfully",
      };
    } catch (error) {
      console.error("Delete event error:", error);
      return {
        success: false,
        message: "Failed to delete event",
      };
    }
  },
});

export const getAllEvents = query({
  handler: async (ctx) => {
    const events = await ctx.db.query("events").order("desc").collect();
    return events;
  },
});

export const getAllEventsWithDetails = query({
  handler: async (ctx) => {
    const events = await ctx.db.query("events").order("desc").collect();

    const eventsWithDetails = await Promise.all(
      events.map(async (event) => {
        const registrations = await ctx.db
          .query("eventRegistrations")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .collect();

        const volunteerAssignments = await ctx.db
          .query("eventVolunteers")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .collect();
        
        const volunteerIds = volunteerAssignments.map(va => va.userId);
        const volunteers = await Promise.all(
            volunteerIds.map(id => ctx.db.get(id))
        );

        const creator = await ctx.db.get(event.createdBy);

        return {
          ...event,
          registrations,
          volunteers: volunteers.filter(Boolean) as Doc<"users">[],
          creator,
        };
      })
    );

    return eventsWithDetails;
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

export const getCurrentOngoingEvent = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
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
    })
  ),
  handler: async (ctx) => {
    const now = Date.now();
    const ongoingEvent = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.and(
        q.lte(q.field("startDate"), now),
        q.gte(q.field("endDate"), now)
      ))
      .first();
    
    return ongoingEvent;
  },
});

export const getNextUpcomingEvent = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
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
    })
  ),
  handler: async (ctx) => {
    const now = Date.now();
    const upcomingEvent = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.gt(q.field("startDate"), now))
      .order("asc")
      .first();
    
    return upcomingEvent;
  },
});

// Get participants for a specific event
export const getEventParticipants = query({
  args: {
    eventId: v.id("events"),
  },
  returns: v.array(
    v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      rollNo: v.optional(v.string()),
      branch: v.optional(v.string()),
      mobileNumber: v.optional(v.string()),
      email: v.optional(v.string()),
      registrationDate: v.number(),
      paymentStatus: v.union(v.literal("Completed"), v.literal("Pending")),
    })
  ),
  handler: async (ctx, args) => {
    const registrations = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const participants = [];
    for (const registration of registrations) {
      const user = await ctx.db.get(registration.userId);
      if (user) {
        participants.push({
          _id: user._id,
          name: user.name,
          rollNo: user.rollNo,
          branch: user.branch,
          mobileNumber: user.mobileNumber,
          email: user.email,
          registrationDate: registration.registrationDate,
          // Assuming payment status is part of the registration, defaulting to "Completed" for now
          paymentStatus: "Completed" as const,
        });
      }
    }
    return participants;
  },
});
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { internal } from "./_generated/api";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1 to avoid confusion
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("events").take(50);
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
    volunteerIds: v.optional(v.array(v.id("teamMembers"))),
    eventType: v.optional(v.union(v.literal("individual"), v.literal("team"))),
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
      volunteerIds: args.volunteerIds ?? [],
      eventType: args.eventType ?? "individual",
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
    volunteerIds: v.optional(v.array(v.id("teamMembers"))),
    eventType: v.optional(v.union(v.literal("individual"), v.literal("team"))),
    // New optional admin email for validation from admin session
    adminEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Attempt to validate admin via Convex auth identity first
    const identity = await ctx.auth.getUserIdentity();
    let createdBy: string | ReturnType<typeof v.id> extends never ? never : any = null;

    if (identity?.email) {
      const authedUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", identity.email!))
        .unique();

      if (authedUser?.role === "admin") {
        createdBy = authedUser._id;
      }
    }

    // Fallback: validate via adminEmail (from admin session on client)
    if (!createdBy && args.adminEmail) {
      const adminRow = await ctx.db
        .query("admins")
        .withIndex("by_email", (q) => q.eq("email", args.adminEmail!))
        .unique();

      if (adminRow) {
        // If admin is not a users doc, store the email as string
        createdBy = args.adminEmail!;
      } else {
        // Allow team members to create (if desired). Prefer their linked users id when present.
        const teamMember = await ctx.db
          .query("teamMembers")
          .withIndex("by_email", (q) => q.eq("email", args.adminEmail!))
          .unique();

        if (teamMember) {
          createdBy = teamMember.userId || args.adminEmail!;
        }
      }
    }

    if (!createdBy) {
      // As a final fallback, if an adminEmail was provided from the verified admin panel session,
      // trust it as the creator identifier to avoid blocking legitimate admins who aren't in users table.
      if (args.adminEmail) {
        createdBy = args.adminEmail;
      } else {
        throw new Error("Admin access required");
      }
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
      createdBy,
      status: "active",
      volunteerIds: args.volunteerIds ?? [],
      eventType: args.eventType ?? "individual",
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
    // Check if event exists
    const event = await ctx.db.get(args.id);
    if (!event) {
      return { success: false, message: "Event not found" };
    }

    const { id, ...rest } = args;

    try {
      await ctx.db.patch(id, rest);
      return { success: true, message: "Event updated successfully" };
    } catch (error) {
      console.error("Error updating event:", error);
      return { success: false, message: "Failed to update event" };
    }
  },
});

export const deleteEventAsAdmin = mutation({
  args: {
    id: v.id("events"),
  },
  handler: async (ctx, args) => {
    // Check if event exists
    const event = await ctx.db.get(args.id);
    if (!event) {
      return { success: false, message: "Event not found" };
    }

    try {
      // Delete related registrations first
      const registrations = await ctx.db
        .query("eventRegistrations")
        .withIndex("by_event", (q) => q.eq("eventId", args.id))
        .take(500);
      
      await Promise.all(registrations.map((r) => ctx.db.delete(r._id)));

      // Delete the event
      await ctx.db.delete(args.id);
      
      return { success: true, message: "Event deleted successfully" };
    } catch (error) {
      console.error("Error deleting event:", error);
      return { success: false, message: "Failed to delete event" };
    }
  },
});

export const getCurrentOngoingEvent = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const events = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(100);
    
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
      .take(100);
    
    const upcomingEvents = events
      .filter(event => event.startDate > now)
      .sort((a, b) => a.startDate - b.startDate);
    
    return upcomingEvents[0] || null;
  },
});

export const getAllEventsWithDetails = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("events").take(20);
    
    const eventsWithDetails = await Promise.all(
      events.map(async (event) => {
        // Handle createdBy as either users id or email string
        let creatorName = "Unknown";
        if (typeof event.createdBy === "string") {
          creatorName = event.createdBy;
        } else {
          const creator = await ctx.db.get(event.createdBy);
          if (creator && typeof (creator as any).name === "string") {
            creatorName = (creator as any).name as string;
          } else if (creator && typeof (creator as any).email === "string") {
            creatorName = (creator as any).email as string;
          }
        }

        const registrations = await ctx.db
          .query("eventRegistrations")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .take(50);
        
        return {
          ...event,
          creatorName,
          participantCount: registrations.length,
          volunteers: [],
          registrations: registrations,
        };
      })
    );
    
    return eventsWithDetails;
  },
});

export const getCompletedEvents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .take(50);
  },
});

export const getUpcomingEvents = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const events = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(100);
    
    return events.filter(event => event.startDate > now);
  },
});

export const getEventParticipants = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const registrations = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(500);
    
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

export const registerForEvent = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return { success: false, message: "User not authenticated" };
    }

    // Check if already registered
    const existing = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_user_and_event", (q) =>
        q.eq("userId", user._id).eq("eventId", args.eventId)
      )
      .unique();

    if (existing) {
      return { success: false, message: "Already registered for this event" };
    }

    // Check max participants
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      return { success: false, message: "Event not found" };
    }

    if (event.maxParticipants) {
      const registrations = await ctx.db
        .query("eventRegistrations")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .take(1000);
      if (registrations.length >= event.maxParticipants) {
        return { success: false, message: "Event is full" };
      }
    }

    await ctx.db.insert("eventRegistrations", {
      eventId: args.eventId,
      userId: user._id,
      registrationDate: Date.now(),
      status: "registered",
    });

    // Schedule confirmation email
    if (user.email) {
      const startDateObj = new Date(event.startDate);
      const eventDate = startDateObj.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      const eventTime = startDateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      await ctx.scheduler.runAfter(0, internal.registration_emails.sendRegistrationConfirmation, {
        userEmail: user.email,
        userName: user.name || "Participant",
        eventName: event.name,
        eventDate,
        eventTime,
        eventVenue: event.venue,
        isTeam: false,
      });
    }

    return { success: true, message: "Successfully registered for the event!" };
  },
});

export const getUserRegistration = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    return await ctx.db
      .query("eventRegistrations")
      .withIndex("by_user_and_event", (q) =>
        q.eq("userId", user._id).eq("eventId", args.eventId)
      )
      .unique();
  },
});

export const registerTeamForEvent = mutation({
  args: {
    eventId: v.id("events"),
    teamName: v.string(),
    members: v.array(v.object({
      name: v.string(),
      rollNo: v.string(),
      branch: v.string(),
      mobileNumber: v.string(),
      email: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return { success: false, message: "User not authenticated" };
    }

    // Check if already registered
    const existing = await ctx.db
      .query("teamRegistrations")
      .withIndex("by_user_and_event", (q) =>
        q.eq("registeredByUserId", user._id).eq("eventId", args.eventId)
      )
      .unique();

    if (existing) {
      return { success: false, message: "Your team is already registered for this event" };
    }

    if (!args.teamName.trim()) {
      return { success: false, message: "Team name is required" };
    }

    if (args.members.length === 0) {
      return { success: false, message: "At least one team member is required" };
    }

    await ctx.db.insert("teamRegistrations", {
      eventId: args.eventId,
      registeredByUserId: user._id,
      teamName: args.teamName.trim(),
      registrationDate: Date.now(),
      members: args.members,
    });

    // Schedule confirmation email to the registering user
    const event = await ctx.db.get(args.eventId);
    if (event && user.email) {
      const startDateObj = new Date(event.startDate);
      const eventDate = startDateObj.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      const eventTime = startDateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      await ctx.scheduler.runAfter(0, internal.registration_emails.sendRegistrationConfirmation, {
        userEmail: user.email,
        userName: user.name || "Team Captain",
        eventName: event.name,
        eventDate,
        eventTime,
        eventVenue: event.venue,
        isTeam: true,
        teamName: args.teamName.trim(),
      });

      // Also send to each team member
      for (const member of args.members) {
        if (member.email && member.email !== user.email) {
          await ctx.scheduler.runAfter(0, internal.registration_emails.sendRegistrationConfirmation, {
            userEmail: member.email,
            userName: member.name,
            eventName: event.name,
            eventDate,
            eventTime,
            eventVenue: event.venue,
            isTeam: true,
            teamName: args.teamName.trim(),
          });
        }
      }
    }

    return { success: true, message: "Team registered successfully!" };
  },
});

export const getTeamRegistration = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    return await ctx.db
      .query("teamRegistrations")
      .withIndex("by_user_and_event", (q) =>
        q.eq("registeredByUserId", user._id).eq("eventId", args.eventId)
      )
      .unique();
  },
});

export const getEventTeamRegistrations = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("teamRegistrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(200);
  },
});

export const generateCheckInCodes = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      return { success: false, message: "Event not found", count: 0 };
    }

    const registrations = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(1000);

    // Filter registrations that don't have a checkInCode yet
    const needsCodes = registrations.filter((r) => !r.checkInCode);

    if (needsCodes.length === 0) {
      return { success: true, message: "All registrations already have check-in codes", count: 0 };
    }

    // Generate unique codes — collect existing codes first to avoid duplicates
    const existingCodes = new Set(
      registrations.filter((r) => r.checkInCode).map((r) => r.checkInCode!)
    );

    const patches = needsCodes.map((reg) => {
      let code = generateCode();
      // Ensure uniqueness within this event
      while (existingCodes.has(code)) {
        code = generateCode();
      }
      existingCodes.add(code);
      return ctx.db.patch(reg._id, { checkInCode: code });
    });

    await Promise.all(patches);

    return {
      success: true,
      message: `Generated ${needsCodes.length} check-in codes`,
      count: needsCodes.length,
    };
  },
});

export const markAttendance = mutation({
  args: {
    checkInCode: v.string(),
  },
  handler: async (ctx, args) => {
    const code = args.checkInCode.trim().toUpperCase();
    if (!code) {
      return { success: false, message: "Check-in code is required" };
    }

    // Find registration by checkInCode
    const registration = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_checkInCode", (q) => q.eq("checkInCode", code))
      .unique();

    if (!registration) {
      return { success: false, message: "Invalid check-in code" };
    }

    if (registration.attendedAt) {
      return { success: false, message: "Already checked in" };
    }

    // Mark attendance
    await ctx.db.patch(registration._id, {
      attendedAt: Date.now(),
      status: "attended",
    });

    // Get user info
    const user = await ctx.db.get(registration.userId);

    return {
      success: true,
      message: "Attendance marked successfully",
      userName: user?.name || "Unknown",
      userEmail: user?.email || "Unknown",
    };
  },
});

export const getEventAttendanceStats = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const registrations = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(1000);

    const totalRegistered = registrations.length;
    const attended = registrations.filter((r) => r.attendedAt);
    const totalAttended = attended.length;

    // Get user details for attendees
    const attendees = await Promise.all(
      attended.map(async (reg) => {
        const user = await ctx.db.get(reg.userId);
        return {
          registrationId: reg._id,
          userId: reg.userId,
          name: user?.name || "Unknown",
          email: user?.email || "Unknown",
          attendedAt: reg.attendedAt!,
          checkInCode: reg.checkInCode,
        };
      })
    );

    return {
      totalRegistered,
      totalAttended,
      attendees,
    };
  },
});

export const getRecentCheckIns = query({
  args: {
    eventId: v.id("events"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const registrations = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(500);

    const attended = registrations
      .filter((r) => r.attendedAt)
      .sort((a, b) => (b.attendedAt || 0) - (a.attendedAt || 0))
      .slice(0, args.limit ?? 10);

    const checkIns = await Promise.all(
      attended.map(async (reg) => {
        const user = await ctx.db.get(reg.userId);
        return {
          registrationId: reg._id,
          userId: reg.userId,
          name: user?.name || "Unknown",
          email: user?.email || "Unknown",
          attendedAt: reg.attendedAt!,
          checkInCode: reg.checkInCode,
        };
      })
    );

    return checkIns;
  },
});

export const addWinner = mutation({
  args: {
    eventId: v.id("events"),
    rank: v.string(),
    winnerName: v.string(),
    photoUrl: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      return { success: false, message: "Event not found" };
    }

    const winnerId = await ctx.db.insert("event_winners", {
      eventId: args.eventId,
      rank: args.rank.trim(),
      winnerName: args.winnerName.trim(),
      photoUrl: args.photoUrl,
      description: args.description,
      createdAt: Date.now(),
    });

    return { success: true, message: "Winner added successfully", winnerId };
  },
});

export const getEventWinners = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("event_winners")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(50);
  },
});

export const deleteWinner = mutation({
  args: {
    winnerId: v.id("event_winners"),
  },
  handler: async (ctx, args) => {
    const winner = await ctx.db.get(args.winnerId);
    if (!winner) {
      return { success: false, message: "Winner not found" };
    }

    await ctx.db.delete(args.winnerId);
    return { success: true, message: "Winner removed" };
  },
});

export const sendCheckInEmailsForEvent = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      return { success: false, message: "Event not found" };
    }

    // Get all registrations for this event
    const registrations = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(500);

    if (registrations.length === 0) {
      return { success: false, message: "No registrations found for this event" };
    }

    // Generate codes for registrations that don't have one
    const existingCodes = new Set(
      registrations.filter((r) => r.checkInCode).map((r) => r.checkInCode!)
    );

    const updatedRegistrations: Array<{
      userEmail: string;
      userName: string;
      checkInCode: string;
    }> = [];

    for (const reg of registrations) {
      let code = reg.checkInCode;
      if (!code) {
        // Generate unique code
        do {
          code = generateCode();
        } while (existingCodes.has(code));
        existingCodes.add(code);
        await ctx.db.patch(reg._id, { checkInCode: code });
      }

      // Get user details
      const user = await ctx.db.get(reg.userId);
      if (user?.email) {
        updatedRegistrations.push({
          userEmail: user.email,
          userName: user.name || "Participant",
          checkInCode: code,
        });
      }
    }

    if (updatedRegistrations.length === 0) {
      return { success: false, message: "No users with email addresses found" };
    }

    // Format event date and time
    const startDateObj = new Date(event.startDate);
    const eventDate = startDateObj.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const eventTime = startDateObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Schedule the email action
    await ctx.scheduler.runAfter(0, internal.email.sendCheckInEmails, {
      eventId: args.eventId,
      eventName: event.name,
      eventDate,
      eventTime,
      eventVenue: event.venue,
      registrations: updatedRegistrations,
    });

    return {
      success: true,
      message: `Sending check-in emails to ${updatedRegistrations.length} participants`,
    };
  },
});
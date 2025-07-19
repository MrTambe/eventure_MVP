import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const createSampleData = internalMutation({
  args: {},
  returns: v.object({
    eventIds: v.array(v.id("events")),
    registrationIds: v.array(v.id("eventRegistrations")),
    certificateIds: v.array(v.id("certificates")),
  }),
  handler: async (ctx) => {
    // Get the first user (assuming there's at least one user)
    const users = await ctx.db.query("users").collect();
    if (users.length === 0) {
      throw new Error("No users found. Please create a user first.");
    }
    const userId = users[0]._id;

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;

    // Create sample events
    const event1Id = await ctx.db.insert("events", {
      name: "Tech Conference 2024",
      description: "Annual technology conference featuring the latest innovations",
      venue: "Convention Center, Downtown",
      startDate: now + oneWeek, // 1 week from now
      endDate: now + oneWeek + (8 * 60 * 60 * 1000), // 8 hours later
      maxParticipants: 500,
      createdBy: userId,
      status: "active",
    });

    const event2Id = await ctx.db.insert("events", {
      name: "Web Development Workshop",
      description: "Hands-on workshop for modern web development",
      venue: "Tech Hub, Building A",
      startDate: now + (2 * oneWeek), // 2 weeks from now
      endDate: now + (2 * oneWeek) + (4 * 60 * 60 * 1000), // 4 hours later
      maxParticipants: 50,
      createdBy: userId,
      status: "active",
    });

    const event3Id = await ctx.db.insert("events", {
      name: "AI & Machine Learning Summit",
      description: "Exploring the future of AI and ML technologies",
      venue: "University Auditorium",
      startDate: now - oneWeek, // 1 week ago (completed)
      endDate: now - oneWeek + (6 * 60 * 60 * 1000), // 6 hours later
      maxParticipants: 200,
      createdBy: userId,
      status: "completed",
    });

    const event4Id = await ctx.db.insert("events", {
      name: "Mobile App Development Bootcamp",
      description: "Intensive bootcamp for mobile app development",
      venue: "Innovation Center",
      startDate: now - (2 * oneWeek), // 2 weeks ago (completed)
      endDate: now - (2 * oneWeek) + (8 * 60 * 60 * 1000), // 8 hours later
      maxParticipants: 30,
      createdBy: userId,
      status: "completed",
    });

    // Create registrations for the user
    const reg1Id = await ctx.db.insert("eventRegistrations", {
      eventId: event1Id,
      userId: userId,
      registrationDate: now - (3 * oneDay),
      status: "registered",
    });

    const reg2Id = await ctx.db.insert("eventRegistrations", {
      eventId: event2Id,
      userId: userId,
      registrationDate: now - (2 * oneDay),
      status: "registered",
    });

    const reg3Id = await ctx.db.insert("eventRegistrations", {
      eventId: event3Id,
      userId: userId,
      registrationDate: now - (2 * oneWeek),
      status: "attended",
    });

    const reg4Id = await ctx.db.insert("eventRegistrations", {
      eventId: event4Id,
      userId: userId,
      registrationDate: now - (3 * oneWeek),
      status: "attended",
    });

    // Create certificates for completed events
    const cert1Id = await ctx.db.insert("certificates", {
      eventId: event3Id,
      userId: userId,
      certificateUrl: "https://example.com/certificates/ai-ml-summit-2024.pdf",
      issuedDate: now - (oneWeek - oneDay),
      certificateNumber: "CERT-AI-2024-001",
    });

    const cert2Id = await ctx.db.insert("certificates", {
      eventId: event4Id,
      userId: userId,
      certificateUrl: "https://example.com/certificates/mobile-bootcamp-2024.pdf",
      issuedDate: now - (2 * oneWeek - oneDay),
      certificateNumber: "CERT-MOB-2024-001",
    });

    return {
      eventIds: [event1Id, event2Id, event3Id, event4Id],
      registrationIds: [reg1Id, reg2Id, reg3Id, reg4Id],
      certificateIds: [cert1Id, cert2Id],
    };
  },
});

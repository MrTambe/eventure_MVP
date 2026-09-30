// @ts-nocheck
import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import bcrypt from "bcryptjs";

// Secret-gated demo data seeder (same SEED_ADMIN_SECRET as admin seeding).
// Used by scripts/seed-sample-events.mjs to populate a fresh/empty DB with
// a few sample events so the dashboard has something to show.
export const seedSampleEvents = action({
  args: {
    seedSecret: v.string(),
  },
  handler: async (ctx, args) => {
    const expectedSecret = process.env.SEED_ADMIN_SECRET;
    if (!expectedSecret || args.seedSecret !== expectedSecret) {
      return { success: false, inserted: 0, message: "Invalid seed secret" };
    }
    // Actions cannot touch the DB directly - delegate to an internal mutation.
    return await ctx.runMutation(internal.seed.insertSampleEvents, {});
  },
});

export const insertSampleEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("events").collect();
    if (existing.length > 0) {
      return {
        success: true,
        inserted: 0,
        message: `Skipped: ${existing.length} event(s) already exist`,
      };
    }

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const samples = [
      {
        name: "Hackathon 2026",
        description:
          "24-hour campus hackathon. Bring your laptop, form a team, and build something awesome. Food and swag included.",
        venue: "Innovation Lab, Block C",
        startDate: now + 7 * day,
        endDate: now + 8 * day,
        maxParticipants: 120,
        eventType: "team" as const,
      },
      {
        name: "Tech Talk: Intro to Cloud",
        description:
          "Guest lecture on cloud fundamentals and deploying your first app. Great for beginners.",
        venue: "Seminar Hall A",
        startDate: now + 3 * day,
        endDate: now + 3 * day + 2 * 60 * 60 * 1000,
        maxParticipants: 80,
        eventType: "individual" as const,
      },
      {
        name: "Cultural Night",
        description:
          "An evening of music, dance and drama performed by students. Open to everyone.",
        venue: "Open Air Theatre",
        startDate: now + 14 * day,
        endDate: now + 14 * day + 4 * 60 * 60 * 1000,
        maxParticipants: 300,
        eventType: "individual" as const,
      },
    ];

    let inserted = 0;
    for (const s of samples) {
      await ctx.db.insert("events", {
        ...s,
        createdBy: "seed-script", // string creator = admin/seed created
        status: "active" as const,
      });
      inserted++;
    }

    return { success: true, inserted, message: `Inserted ${inserted} sample events` };
  },
});

// ===== Full dummy data: 2 admins, 1 team member, 5 users, 1 ongoing event =====

function generateSeedCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

export const seedAllDummyData = action({
  args: { seedSecret: v.string() },
  handler: async (ctx, args) => {
    const expectedSecret = process.env.SEED_ADMIN_SECRET;
    if (!expectedSecret || args.seedSecret !== expectedSecret) {
      return { success: false, message: "Invalid seed secret" };
    }

    const hours = 60 * 60 * 1000;
    const adminHashSanshit = await bcrypt.hash("Sanshit@2026", 10);
    const adminHashMayuri = await bcrypt.hash("Mayuri@2026", 10);
    const memberHashSanika = await bcrypt.hash("Sanika@2026", 10);

    return await ctx.runMutation(internal.seed.insertDummyData, {
      admins: [
        { email: "sanshit@eventure.app", name: "Sanshit", passwordHash: adminHashSanshit },
        { email: "mayuri@eventure.app", name: "Mayuri", passwordHash: adminHashMayuri },
      ],
      teamMember: { email: "sanika@eventure.app", name: "Sanika", passwordHash: memberHashSanika },
      sampleUsers: [
        { name: "Parth Aayush Tambe", email: "parth.tambe@student.edu", rollNo: "22CS101", branch: "Computer Science", mobileNumber: "9876500011" },
        { name: "Aayush Bhat", email: "aayush.bhat@student.edu", rollNo: "22CS102", branch: "Computer Science", mobileNumber: "9876500022" },
        { name: "Naveen Shaik", email: "naveen.shaik@student.edu", rollNo: "22IT201", branch: "Information Technology", mobileNumber: "9876500033" },
        { name: "Sorav Joshi", email: "sorav.joshi@student.edu", rollNo: "22EC145", branch: "Electronics", mobileNumber: "9876500044" },
        { name: "Soham Yadav", email: "soham.yadav@student.edu", rollNo: "22ME178", branch: "Mechanical", mobileNumber: "9876500055" },
      ],
      ongoingEvent: {
        name: "TechFest Live: Coding Relay",
        description: "An ongoing relay-style coding competition happening right now. Teams rotate every 30 minutes; live leaderboard in the event chat.",
        venue: "Main Auditorium",
        startDate: Date.now() - 1 * hours,
        endDate: Date.now() + 5 * hours,
        maxParticipants: 100,
      },
    });
  },
});

/**
 * Test helper (secret-gated): creates an already-ended event with one
 * registration + check-in code, for verifying the ended-event check-in block.
 */
export const seedEndedEventTest = action({
  args: { seedSecret: v.string() },
  handler: async (ctx, args) => {
    const expectedSecret = process.env.SEED_ADMIN_SECRET;
    if (!expectedSecret || args.seedSecret !== expectedSecret) {
      return { success: false, message: "Invalid seed secret" };
    }
    return await ctx.runMutation(internal.seed.insertEndedEventTest, {});
  },
});

export const insertEndedEventTest = internalMutation({
  args: {},
  handler: async (ctx) => {
    const hours = 60 * 60 * 1000;
    const name = "ZZZ Ended CheckIn Test";
    const existing = await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("name"), name))
      .first();
    let eventId: any;
    if (existing) {
      eventId = (existing as any)._id;
    } else {
      eventId = await ctx.db.insert("events", {
        name,
        description: "Test event that already ended - check-in must be blocked.",
        venue: "Test Lab",
        startDate: Date.now() - 3 * hours,
        endDate: Date.now() - 1 * hours,
        createdBy: "seed-script",
        status: "active",
        eventType: "individual",
      });
    }
    // Find or create a registration with a code for the first sample user
    const user: any = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", "parth.tambe@student.edu"))
      .first();
    if (!user) return { success: false, message: "Seed users missing - run pnpm seed:dummy first" };
    let reg: any = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_user_and_event", (q) => q.eq("userId", user._id).eq("eventId", eventId))
      .first();
    if (!reg) {
      const code = generateSeedCode();
      await ctx.db.insert("eventRegistrations", {
        eventId,
        userId: user._id,
        registrationDate: Date.now() - 2 * hours,
        status: "registered",
        checkInCode: code,
      });
      reg = { checkInCode: code };
    }
    return { success: true, message: "Ended test event ready", checkInCode: reg.checkInCode };
  },
});

/** Backfill: ensure every existing event has its chat (secret-gated). */
export const backfillEventChats = action({
  args: { seedSecret: v.string() },
  handler: async (ctx, args) => {
    const expectedSecret = process.env.SEED_ADMIN_SECRET;
    if (!expectedSecret || args.seedSecret !== expectedSecret) {
      return { success: false, message: "Invalid seed secret" };
    }
    return await ctx.runMutation(internal.seed.backfillChatsMutation, {});
  },
});

export const backfillChatsMutation = internalMutation({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("events").take(200);
    let ensured = 0;
    for (const ev of events) {
      await ctx.runMutation(internal.communication.ensureEventChat, {
        eventId: ev._id,
        title: `${ev.name} Chat`,
      });
      ensured++;
    }
    return { success: true, message: `Chats ensured for ${ensured} event(s)` };
  },
});

export const insertDummyData = internalMutation({
  args: {
    admins: v.array(v.object({ email: v.string(), name: v.string(), passwordHash: v.string() })),
    teamMember: v.object({ email: v.string(), name: v.string(), passwordHash: v.string() }),
    sampleUsers: v.array(v.object({
      name: v.string(), email: v.string(), rollNo: v.string(),
      branch: v.string(), mobileNumber: v.string(),
    })),
    ongoingEvent: v.object({
      name: v.string(), description: v.string(), venue: v.string(),
      startDate: v.number(), endDate: v.number(), maxParticipants: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const summary: Record<string, number> = { admins: 0, teamMembers: 0, users: 0, events: 0, registrations: 0 };

    // Admins
    for (const a of args.admins) {
      const existing = await ctx.db
        .query("admins")
        .withIndex("by_email", (q) => q.eq("email", a.email))
        .first();
      if (!existing) {
        await ctx.db.insert("admins", { email: a.email, name: a.name, password: a.passwordHash, role: "admin" });
        summary.admins++;
      }
    }

    // Team member (volunteer)
    const existingMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_email", (q) => q.eq("email", args.teamMember.email))
      .first();
    if (!existingMember) {
      await ctx.db.insert("teamMembers", {
        email: args.teamMember.email,
        name: args.teamMember.name,
        role: "teammember",
        password: args.teamMember.passwordHash,
        joinedAt: Date.now(),
      });
      summary.teamMembers++;
    }

    // Sample users (profiles in users table; they cannot log in without an
    // auth account — used for dashboards, comms and Sheets data testing)
    const userIds: any[] = [];
    for (const u of args.sampleUsers) {
      let user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", u.email))
        .first();
      if (!user) {
        const id = await ctx.db.insert("users", {
          name: u.name,
          email: u.email,
          rollNo: u.rollNo,
          branch: u.branch,
          mobileNumber: u.mobileNumber,
          role: "user",
          emailVerificationTime: Date.now(),
        });
        userIds.push(id);
        summary.users++;
      } else {
        userIds.push((user as any)._id);
      }
    }

    // Ongoing event + auto chat + registrations with check-in codes
    let ongoing = await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("name"), args.ongoingEvent.name))
      .first();
    if (!ongoing) {
      const eventId = await ctx.db.insert("events", {
        ...args.ongoingEvent,
        createdBy: "seed-script",
        status: "active",
        eventType: "individual",
      });
      summary.events++;
      await ctx.runMutation(internal.communication.ensureEventChat, {
        eventId,
        title: `${args.ongoingEvent.name} Chat`,
      });
      for (let i = 0; i < userIds.length; i++) {
        const attended = i < 2; // first two already checked in
        await ctx.db.insert("eventRegistrations", {
          eventId,
          userId: userIds[i],
          registrationDate: Date.now() - (3 - i) * 60 * 60 * 1000,
          status: attended ? "attended" : "registered",
          checkInCode: generateSeedCode(),
          attendedAt: attended ? Date.now() - 30 * 60 * 1000 : undefined,
        });
        summary.registrations++;
      }
    }

    const parts = Object.entries(summary)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `${n} ${k}`);
    return {
      success: true,
      summary,
      message: parts.length ? `Created: ${parts.join(", ")}` : "Nothing to create — dummy data already present",
    };
  },
});

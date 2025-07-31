import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      phone: v.optional(v.string()),
      phoneVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      
      role: v.optional(roleValidator),
      
      // Additional profile fields
      rollNo: v.optional(v.string()),
      branch: v.optional(v.string()),
      mobileNumber: v.optional(v.string()),
    })
      .index("email", ["email"]),

    // Admin credentials table
    admins: defineTable({
      email: v.string(),
      password: v.string(), // In production, this should be hashed
      name: v.optional(v.string()),
      isActive: v.boolean(),
      lastLogin: v.optional(v.number()),
    }).index("by_email", ["email"]),
  
    // Events table
    events: defineTable({
      name: v.string(),
      description: v.string(),
      venue: v.string(),
      startDate: v.number(), // timestamp
      endDate: v.number(), // timestamp
      maxParticipants: v.optional(v.number()),
      createdBy: v.union(v.id("users"), v.id("admins")),
      status: v.union(v.literal("active"), v.literal("cancelled"), v.literal("completed")),
    }).index("by_creator", ["createdBy"])
      .index("by_start_date", ["startDate"])
      .index("by_status", ["status"]),

    // Event volunteer assignments table
    eventVolunteers: defineTable({
      eventId: v.id("events"),
      userId: v.id("users"),
      assignedDate: v.number(), // timestamp
      status: v.union(v.literal("assigned"), v.literal("confirmed"), v.literal("declined")),
    }).index("by_event", ["eventId"])
      .index("by_user", ["userId"])
      .index("by_event_and_user", ["eventId", "userId"]),

    // Event registrations table
    eventRegistrations: defineTable({
      eventId: v.id("events"),
      userId: v.id("users"),
      registrationDate: v.number(), // timestamp
      status: v.union(v.literal("registered"), v.literal("attended"), v.literal("cancelled")),
    }).index("by_event", ["eventId"])
      .index("by_user", ["userId"])
      .index("by_user_and_event", ["userId", "eventId"]),

    // Certificates table
    certificates: defineTable({
      eventId: v.id("events"),
      userId: v.id("users"),
      certificateUrl: v.optional(v.string()),
      issuedDate: v.number(), // timestamp
      certificateNumber: v.string(),
    }).index("by_user", ["userId"])
      .index("by_event", ["eventId"])
      .index("by_user_and_event", ["userId", "eventId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
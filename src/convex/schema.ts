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
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // Events table
    events: defineTable({
      name: v.string(),
      description: v.string(),
      venue: v.string(),
      startDate: v.number(), // timestamp
      endDate: v.number(), // timestamp
      maxParticipants: v.optional(v.number()),
      createdBy: v.id("users"),
      status: v.union(v.literal("active"), v.literal("cancelled"), v.literal("completed")),
    }).index("by_creator", ["createdBy"])
      .index("by_start_date", ["startDate"])
      .index("by_status", ["status"]),

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
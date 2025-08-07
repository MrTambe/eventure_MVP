import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { Infer } from "convex/values";

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER)
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema({
  ...authTables, 
  users: defineTable({
    name: v.optional(v.string()), 
    image: v.optional(v.string()), 
    email: v.optional(v.string()), 
    emailVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(roleValidator),
    rollNo: v.optional(v.string()),
    branch: v.optional(v.string()),
    mobileNumber: v.optional(v.string()),
  })
    .index("email", ["email"]),
  
  events: defineTable({
    name: v.string(),
    description: v.string(),
    venue: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    maxParticipants: v.optional(v.number()),
    createdBy: v.id("users"),
    status: v.union(v.literal("active"), v.literal("cancelled"), v.literal("completed")),
  }).index("by_creator", ["createdBy"])
    .index("by_start_date", ["startDate"])
    .index("by_status", ["status"]),

  eventRegistrations: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    registrationDate: v.number(),
    status: v.union(v.literal("registered"), v.literal("attended"), v.literal("cancelled")),
  }).index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_user_and_event", ["userId", "eventId"]),

  certificates: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    certificateUrl: v.optional(v.string()),
    issuedDate: v.number(),
    certificateNumber: v.string(),
  }).index("by_user", ["userId"])
    .index("by_event", ["eventId"])
    .index("by_user_and_event", ["userId", "eventId"]),

  admin_communication_messages: defineTable({
    authorId: v.id("users"),
    content: v.string(),
  }).index("by_author", ["authorId"]),

  teamMembers: defineTable({
    userId: v.id("users"),
    name: v.string(),
    email: v.string(),
    role: v.string(),
    password: v.optional(v.string()),
    department: v.optional(v.string()),
    branch: v.optional(v.string()),
    rollNo: v.optional(v.string()),
    joinedAt: v.number(),
  }).index("by_user_id", ["userId"])
    .index("by_email", ["email"]),

  private_messages: defineTable({
    senderId: v.id("users"),
    recipientId: v.id("users"),
    content: v.string(),
    isRead: v.boolean(),
    reactions: v.optional(v.array(v.object({
      userId: v.id("users"),
      emoji: v.string(),
    }))),
  }).index("by_sender", ["senderId"])
    .index("by_recipient", ["recipientId"])
    .index("by_conversation", ["senderId", "recipientId"]),

  admins: defineTable({
    name: v.optional(v.string()),
    email: v.string(),
    password: v.string(), // In real app, this should be hashed
    role: v.string(),
    branch: v.optional(v.string()),
    rollNo: v.optional(v.string()),
    mobileNumber: v.optional(v.string()),
  }).index("by_email", ["email"]),

},
{
  schemaValidation: false
});

export default schema;
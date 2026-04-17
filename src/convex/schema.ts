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
    avatarUrl: v.optional(v.string()),
  })
    .index("email", ["email"]),

  // Rate limiting table for auth attempts
  authRateLimits: defineTable({
    identifier: v.string(), // email or IP address
    type: v.union(v.literal("otp"), v.literal("magic_link"), v.literal("login")),
    timestamp: v.number(),
    success: v.boolean(),
  })
    .index("by_identifier_and_type", ["identifier", "type"])
    .index("by_timestamp", ["timestamp"])
    .index("identifier", ["identifier"]),
  
  events: defineTable({
    name: v.string(),
    description: v.string(),
    venue: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    maxParticipants: v.optional(v.number()),
    // Allow events created by either a user (users id) or an admin email string
    createdBy: v.union(v.id("users"), v.string()),
    status: v.union(v.literal("active"), v.literal("cancelled"), v.literal("completed")),
    volunteerIds: v.optional(v.array(v.id("teamMembers"))),
    eventType: v.optional(v.union(v.literal("individual"), v.literal("team"))),
  })
    .index("by_start_date", ["startDate"])
    .index("by_status", ["status"]),

  eventRegistrations: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    registrationDate: v.number(),
    status: v.union(v.literal("registered"), v.literal("attended"), v.literal("cancelled")),
    checkInCode: v.optional(v.string()),
    attendedAt: v.optional(v.number()),
  }).index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_user_and_event", ["userId", "eventId"])
    .index("by_checkInCode", ["checkInCode"]),

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
    channel: v.optional(v.union(v.literal("general"), v.literal("announcements"), v.literal("urgent"))),
    reactions: v.optional(v.array(v.object({
      userId: v.id("users"),
      emoji: v.string(),
    }))),
  }).index("by_author", ["authorId"])
    .index("by_channel", ["channel"]),

  teamMembers: defineTable({
    // Make userId optional to allow creation before linking to a users doc
    userId: v.optional(v.id("users")),
    name: v.string(),
    email: v.string(),
    role: v.string(),
    password: v.optional(v.string()),
    department: v.optional(v.string()),
    branch: v.optional(v.string()),
    rollNo: v.optional(v.string()),
    mobileNumber: v.optional(v.string()),
    joinedAt: v.number(),
  }).index("by_user_id", ["userId"])
    .index("by_email", ["email"])
    .index("by_name", ["name"])
    .index("by_joined_at", ["joinedAt"]),

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
    password: v.string(),
    role: v.string(),
    branch: v.optional(v.string()),
    rollNo: v.optional(v.string()),
    mobileNumber: v.optional(v.string()),
  }).index("by_email", ["email"])
    .index("by_name", ["name"])
    .index("by_role", ["role"]),

  teamRegistrations: defineTable({
    eventId: v.id("events"),
    registeredByUserId: v.id("users"),
    teamName: v.string(),
    registrationDate: v.number(),
    members: v.array(v.object({
      name: v.string(),
      rollNo: v.string(),
      branch: v.string(),
      mobileNumber: v.string(),
      email: v.string(),
    })),
  }).index("by_event", ["eventId"])
    .index("by_user", ["registeredByUserId"])
    .index("by_user_and_event", ["registeredByUserId", "eventId"]),

  event_channel_messages: defineTable({
    eventId: v.id("events"),
    authorId: v.string(), // Can be users id, admins id, or teamMembers id
    authorName: v.string(),
    content: v.string(),
    reactions: v.optional(v.array(v.object({
      userId: v.string(),
      emoji: v.string(),
    }))),
  }).index("by_event", ["eventId"])
    .index("by_author", ["authorId"]),

  notifications: defineTable({
    recipientId: v.string(),
    type: v.string(),
    content: v.string(),
    isRead: v.boolean(),
    linkId: v.optional(v.string()),
  }).index("by_recipient", ["recipientId"])
    .index("by_recipient_and_read", ["recipientId", "isRead"]),

  tickets: defineTable({
    creatorId: v.string(),
    subject: v.string(),
    description: v.string(),
    category: v.string(),
    eventId: v.optional(v.string()),
    status: v.string(),
    priority: v.string(),
    createdAt: v.number(),
  }).index("by_status", ["status"])
    .index("by_creator", ["creatorId"]),

  event_winners: defineTable({
    eventId: v.id("events"),
    rank: v.string(),
    winnerName: v.string(),
    photoUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_event", ["eventId"]),

  ticket_replies: defineTable({
    ticketId: v.string(),
    authorId: v.string(),
    authorName: v.string(),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_ticket", ["ticketId"]),

},
{
  schemaValidation: false
});

export default schema;
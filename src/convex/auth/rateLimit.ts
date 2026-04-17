import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

// Rate limiting configuration
const RATE_LIMITS = {
  OTP_REQUESTS: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  MAGIC_LINK_REQUESTS: {
    maxAttempts: 3,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  LOGIN_ATTEMPTS: {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
};

export const checkRateLimit = internalQuery({
  args: {
    identifier: v.string(), // email or IP
    type: v.union(v.literal("otp"), v.literal("magic_link"), v.literal("login")),
  },
  handler: async (ctx, args) => {
    const config = RATE_LIMITS[
      args.type === "otp" ? "OTP_REQUESTS" :
      args.type === "magic_link" ? "MAGIC_LINK_REQUESTS" :
      "LOGIN_ATTEMPTS"
    ];

    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get recent attempts within the time window
    const recentAttempts = await ctx.db
      .query("authRateLimits")
      .withIndex("by_identifier_and_type", (q) =>
        q.eq("identifier", args.identifier).eq("type", args.type)
      )
      .filter((q) => q.gte(q.field("timestamp"), windowStart))
      .take(100);

    const isAllowed = recentAttempts.length < config.maxAttempts;
    const remainingAttempts = Math.max(0, config.maxAttempts - recentAttempts.length);
    const resetTime = recentAttempts.length > 0 
      ? Math.max(...recentAttempts.map(a => a.timestamp)) + config.windowMs
      : now + config.windowMs;

    return {
      isAllowed,
      remainingAttempts,
      resetTime,
      windowMs: config.windowMs,
    };
  },
});

export const recordAttempt = internalMutation({
  args: {
    identifier: v.string(),
    type: v.union(v.literal("otp"), v.literal("magic_link"), v.literal("login")),
    success: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("authRateLimits", {
      identifier: args.identifier,
      type: args.type,
      timestamp: Date.now(),
      success: args.success ?? false,
    });

    // Clean up old records (older than 24 hours) - batch limited
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const oldRecords = await ctx.db
      .query("authRateLimits")
      .filter((q) => q.lt(q.field("timestamp"), oneDayAgo))
      .take(50);

    await Promise.all(oldRecords.map((record) => ctx.db.delete(record._id)));
  },
});
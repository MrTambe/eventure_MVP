// @ts-nocheck
import { Email } from "@convex-dev/auth/providers/Email";
import { alphabet, generateRandomString } from "oslo/crypto";
import { createEmailProvider } from "./emailProvider";
import { internal } from "../_generated/api";

export const emailOtp = Email({
  id: "email-otp",
  maxAge: 60 * 15, // 15 minutes
  
  // Generate a secure 6-digit OTP
  generateVerificationToken() {
    return generateRandomString(6, alphabet("0-9"));
  },
  
  async sendVerificationRequest({ identifier: email, provider, token, request }) {
    try {
      const ctxAny = (request as any)?.ctx;

      // Check rate limiting if context is available
      if (ctxAny?.runQuery) {
        const rateLimitCheck = await ctxAny.runQuery(internal.auth.rateLimit.checkRateLimit, {
          identifier: email,
          type: "otp",
        });

        if (!rateLimitCheck.isAllowed) {
          const resetTimeMinutes = Math.ceil((rateLimitCheck.resetTime - Date.now()) / (1000 * 60));
          throw new Error(
            `Too many OTP requests. Please try again in ${resetTimeMinutes} minutes. ` +
            `Remaining attempts: ${rateLimitCheck.remainingAttempts}`
          );
        }

        // Record the attempt
        await ctxAny.runMutation(internal.auth.rateLimit.recordAttempt, {
          identifier: email,
          type: "otp",
          success: false,
        });
      }

      // Send OTP using the configured email provider
      const emailProvider = createEmailProvider();
      const appName = process.env.VLY_APP_NAME || "EventHub";
      await emailProvider.sendOtp(email, token, appName);

      // Mark attempt as successful if context is available
      if (ctxAny?.runMutation) {
        await ctxAny.runMutation(internal.auth.rateLimit.recordAttempt, {
          identifier: email,
          type: "otp",
          success: true,
        });
      }

      console.log(`OTP sent successfully to ${email}`);

    } catch (error) {
      console.error("Failed to send OTP:", error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : "Failed to send verification code. Please try again."
      );
    }
  },
});
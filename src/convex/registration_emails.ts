"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";

export const sendRegistrationConfirmation = internalAction({
  args: {
    userEmail: v.string(),
    userName: v.string(),
    eventName: v.string(),
    eventDate: v.string(),
    eventTime: v.string(),
    eventVenue: v.string(),
    isTeam: v.boolean(),
    teamName: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const provider = process.env.EMAIL_PROVIDER || "vly";
    let apiKey: string | undefined;
    let endpoint: string;
    let fromAddress: string;
    let headers: Record<string, string>;

    if (provider === "resend") {
      apiKey = process.env.RESEND_API_KEY;
      endpoint = "https://api.resend.com/emails";
      fromAddress = "Eventure <noreply@resend.dev>";
      headers = {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      };
    } else {
      apiKey = process.env.VLY_API_KEY || process.env.VLY_INTEGRATION_KEY;
      endpoint = "https://integrations.vly.ai/v1/email/send";
      fromAddress = "noreply@project.vly.sh";
      headers = {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Vly-Version": "0.1.0",
      };
    }

    if (!apiKey) {
      console.warn("[RegistrationEmail] No email API key configured, skipping email");
      return { success: false, message: "Email not configured" };
    }

    const teamLine = args.isTeam && args.teamName
      ? `<p style="font-size: 16px; color: #333;">Team: <strong>${args.teamName}</strong></p>`
      : "";

    const subject = args.isTeam
      ? `Team Registration Confirmed — ${args.eventName}`
      : `Registration Confirmed — ${args.eventName}`;

    const html = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 2px solid #000;">
        <div style="background: #000; color: #fff; padding: 24px 32px;">
          <h1 style="margin: 0; font-size: 24px; letter-spacing: -0.5px;">EVENTURE</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="font-size: 22px; margin: 0 0 16px; color: #000;">You're Registered! 🎉</h2>
          <p style="font-size: 16px; color: #333; margin: 0 0 8px;">
            Hi <strong>${args.userName}</strong>,
          </p>
          <p style="font-size: 16px; color: #333; margin: 0 0 24px;">
            You've successfully registered for the following event:
          </p>
          <div style="background: #f5f0e8; border: 2px solid #000; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 12px; font-size: 20px; text-transform: uppercase; color: #000;">${args.eventName}</h3>
            <p style="font-size: 14px; color: #333; margin: 4px 0;">📅 <strong>Date:</strong> ${args.eventDate}</p>
            <p style="font-size: 14px; color: #333; margin: 4px 0;">🕐 <strong>Time:</strong> ${args.eventTime}</p>
            <p style="font-size: 14px; color: #333; margin: 4px 0;">📍 <strong>Venue:</strong> ${args.eventVenue}</p>
            ${teamLine}
          </div>
          <p style="font-size: 14px; color: #666;">
            Please arrive on time. If you have any questions, contact the event organizers.
          </p>
        </div>
        <div style="background: #f5f5f5; padding: 16px 32px; border-top: 1px solid #ddd;">
          <p style="font-size: 12px; color: #999; margin: 0;">© Eventure — Event Management Platform</p>
        </div>
      </div>
    `;

    const textContent = args.isTeam
      ? `Hi ${args.userName}, your team "${args.teamName}" is registered for ${args.eventName} on ${args.eventDate} at ${args.eventTime} at ${args.eventVenue}.`
      : `Hi ${args.userName}, you're registered for ${args.eventName} on ${args.eventDate} at ${args.eventTime} at ${args.eventVenue}.`;

    try {
      const body = provider === "resend"
        ? { from: fromAddress, to: [args.userEmail], subject, html }
        : { from: fromAddress, to: [args.userEmail], subject, html, text: textContent };

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("[RegistrationEmail] Failed:", response.status, errData);
        return { success: false, message: "Failed to send email" };
      }

      console.log("[RegistrationEmail] Sent to", args.userEmail);
      return { success: true, message: "Email sent" };
    } catch (err) {
      console.error("[RegistrationEmail] Error:", err);
      return { success: false, message: "Email send error" };
    }
  },
});
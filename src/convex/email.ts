"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { generateQRCode, generateCheckInURL } from "../lib/qr-generator";

export const sendCheckInEmails = internalAction({
  args: {
    eventId: v.string(),
    eventName: v.string(),
    eventDate: v.string(),
    eventTime: v.string(),
    eventVenue: v.string(),
    registrations: v.array(
      v.object({
        userEmail: v.string(),
        userName: v.string(),
        checkInCode: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Auto-detect: if a Resend key is configured, use Resend. EMAIL_PROVIDER
    // env var can still override ("resend" | "vly").
    const provider =
      process.env.EMAIL_PROVIDER || (process.env.RESEND_API_KEY ? "resend" : "vly");
    let apiKey: string | undefined;
    let endpoint: string;
    let fromAddress: string;
    let headers: Record<string, string>;

    if (provider === "resend") {
      apiKey = process.env.RESEND_API_KEY;
      endpoint = "https://api.resend.com/emails";
      fromAddress = "Eventure <noreply@resend.dev>";
      headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      };
    } else {
      apiKey = process.env.VLY_API_KEY || process.env.VLY_INTEGRATION_KEY;
      endpoint = "https://integrations.vly.ai/v1/email/send";
      fromAddress = "noreply@project.vly.sh";
      headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Vly-Version": "0.1.0",
      };
    }

    if (!apiKey) {
      console.warn("[CheckInEmail] No email API key configured, skipping");
      return { success: false, sent: 0, message: "Email not configured" };
    }

    let sent = 0;
    let failed = 0;

    // Upload ONE shared QR image per event-batch to Convex storage and link it
    // by https URL. Gmail (and most clients) strip data: URIs, so inline base64
    // images show as broken icons — a real URL renders everywhere.
    // NOTE: the QR encodes the generic check-in URL; the 8-char code below it
    // is the unique per-attendee identifier admins scan/type.
    let qrUrl: string | null = null;
    if (args.registrations.length > 0) {
      try {
        const checkInUrl = generateCheckInURL(args.registrations[0].checkInCode, args.eventId);
        const qrDataUrl = await generateQRCode(checkInUrl);
        const base64 = qrDataUrl.split(",")[1];
        if (base64) {
          const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
          const blob = new Blob([binary], { type: "image/png" });
          const storageId = await ctx.storage.store(blob);
          qrUrl = await ctx.storage.getUrl(storageId);
        }
      } catch (qrErr) {
        console.error("[CheckInEmail] QR upload failed:", qrErr);
      }
    }

    for (const reg of args.registrations) {
      try {
        const checkInUrl = generateCheckInURL(reg.checkInCode, args.eventId);
        // Fall back to data URL if upload failed (still works in some clients)
        const qrSrc = qrUrl || (await generateQRCode(checkInUrl));

        const subject = `Your Check-In Code for ${args.eventName}`;

        const html = `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 2px solid #000;">
            <div style="background: #000; color: #fff; padding: 24px 32px;">
              <h1 style="margin: 0; font-size: 24px; letter-spacing: -0.5px;">EVENTURE</h1>
            </div>
            <div style="padding: 32px;">
              <h2 style="font-size: 22px; margin: 0 0 16px; color: #000;">Your Check-In Code 🎫</h2>
              <p style="font-size: 16px; color: #333; margin: 0 0 8px;">
                Hi <strong>${reg.userName}</strong>,
              </p>
              <p style="font-size: 16px; color: #333; margin: 0 0 24px;">
                Here's your check-in code for the event. Show this QR code or the code below at the venue.
              </p>
              
              <div style="background: #f5f0e8; border: 2px solid #000; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px; font-size: 20px; text-transform: uppercase; color: #000;">${args.eventName}</h3>
                <p style="font-size: 14px; color: #333; margin: 4px 0;">📅 <strong>Date:</strong> ${args.eventDate}</p>
                <p style="font-size: 14px; color: #333; margin: 4px 0;">🕐 <strong>Time:</strong> ${args.eventTime}</p>
                <p style="font-size: 14px; color: #333; margin: 4px 0;">📍 <strong>Venue:</strong> ${args.eventVenue}</p>
              </div>

              <div style="text-align: center; margin: 24px 0;">
                <img src="${qrSrc}" alt="Check-In QR Code" width="200" height="200" style="width: 200px; height: 200px; border: 2px solid #000; display: block; margin: 0 auto;" />
              </div>

              <div style="background: #000; color: #fff; padding: 16px; text-align: center; margin: 24px 0; font-family: monospace;">
                <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Your Check-In Code</p>
                <p style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 4px;">${reg.checkInCode}</p>
              </div>

              <p style="font-size: 14px; color: #666;">
                Show this QR code or provide the code above at the event check-in desk. If you have any issues, contact the event organizers.
              </p>
            </div>
            <div style="background: #f5f5f5; padding: 16px 32px; border-top: 1px solid #ddd;">
              <p style="font-size: 12px; color: #999; margin: 0;">© Eventure — Event Management Platform</p>
            </div>
          </div>
        `;

        const textContent = `Hi ${reg.userName}, your check-in code for ${args.eventName} is: ${reg.checkInCode}. Event on ${args.eventDate} at ${args.eventTime} at ${args.eventVenue}.`;

        const body =
          provider === "resend"
            ? { from: fromAddress, to: [reg.userEmail], subject, html }
            : { from: fromAddress, to: [reg.userEmail], subject, html, text: textContent };

        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.error(`[CheckInEmail] Failed for ${reg.userEmail}:`, response.status, errData);
          failed++;
        } else {
          console.log(`[CheckInEmail] Sent to ${reg.userEmail}`);
          sent++;
        }
      } catch (err) {
        console.error(`[CheckInEmail] Error for ${reg.userEmail}:`, err);
        failed++;
      }
    }

    return { success: true, sent, failed, message: `Sent ${sent} emails, ${failed} failed` };
  },
});

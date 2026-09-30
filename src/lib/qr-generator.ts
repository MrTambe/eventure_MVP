import QRCode from "qrcode";

/**
 * Generate a QR code as a base64 PNG data URL.
 */
export async function generateQRCode(data: string): Promise<string> {
  return await QRCode.toDataURL(data, {
    width: 300,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Generate a check-in URL for a given code and event.
 * Prefers SITE_URL (the real frontend URL, e.g. http://localhost:5173 or the
 * Vercel domain) so the QR actually opens the app; falls back to the Convex
 * site URL and finally a placeholder.
 */
export function generateCheckInURL(code: string, eventId: string): string {
  const baseUrl =
    process.env.SITE_URL || process.env.CONVEX_SITE_URL || "https://eventure.app";
  return `${baseUrl}/admin-checkin?code=${encodeURIComponent(code)}&event=${encodeURIComponent(eventId)}`;
}

/**
 * Maps raw backend errors (e.g. Convex "[CONVEX A(auth:signIn)] Server Error:
 * Uncaught ...") to short, human-friendly messages suitable for toasts.
 * Always returns a user-safe string — never raw stack traces or internals.
 */
export function friendlyErrorMessage(error: unknown, fallback: string): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  const rules: [RegExp, string][] = [
    [/only send testing emails to your own email address/i,
      "Email delivery is in test mode — codes can only be sent to the organizer's email for now."],
    [/Invalid `to` field|testing email address/i,
      "That email can't receive emails in test mode. Please use the organizer's email or contact the admin."],
    [/Too many OTP requests|rate limit|too many/i,
      "Too many attempts. Please wait a few minutes and try again."],
    [/invalid verification code|code is invalid|expired/i,
      "That code is invalid or expired. Please request a new one."],
    [/invalid credentials|invalid email or password|incorrect password/i,
      "Invalid email or password."],
    [/not authenticated|unauthenticated/i,
      "Your session expired. Please sign in again."],
    [/admin access required|not authorized|access denied|permission/i,
      "You don't have permission to do that."],
    [/already (checked in|registered)/i,
      "Already done — no changes were made."],
    [/no email provider configured/i,
      "Email is not configured on the server yet. Please contact the admin."],
    [/failed to fetch|network|fetch failed|networkerror/i,
      "Network problem — check your connection and try again."],
    [/Server Error|CONVEX|uncaught|internal error/i,
      "Something went wrong on our side. Please try again in a moment."],
  ];

  for (const [re, msg] of rules) {
    if (re.test(raw)) return msg;
  }

  // Unknown, empty, or overly technical error: show the friendly fallback.
  if (!raw || raw.length > 160) return fallback;
  return fallback;
}

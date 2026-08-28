/**
 * Map common Supabase / network / auth errors into specific, actionable
 * messages. The goal is to never show "Something went wrong".
 */

export type ErrorContext =
  | "auth"
  | "otp"
  | "notification"
  | "preferences"
  | "network"
  | "generic";

interface SupabaseError {
  code?: string;
  message?: string;
  status?: number;
}

const knownMessages: Record<string, Record<string, string>> = {
  auth: {
    invalid_credentials:
      "The email or password you entered is incorrect. Please check and try again.",
    email_not_confirmed:
      "Your email is not verified yet. Please check your inbox for the verification code.",
    user_already_registered:
      "This email is already registered. Sign in instead or use a different email.",
    weak_password:
      "Your password is too weak. Use at least 8 characters with letters and numbers.",
    otp_expired:
      "This code has expired. Request a new one and try again.",
    otp_incorrect:
      "The code you entered is incorrect. Double-check the digits and try again.",
    session_expired:
      "Your session has expired. Please sign in again to continue.",
    request_timeout:
      "The request took too long. Check your connection and try again.",
  },
  otp: {
    rate_limited:
      "Too many codes requested. Please wait before requesting another one.",
    hourly_limit:
      "Too many codes have been sent to this email. Try again in an hour or contact support@edura.com.ng.",
  },
  notification: {
    load_failed:
      "We couldn't load your notifications. Pull down to retry or check your connection.",
    update_failed:
      "We couldn't update that notification. Please try again.",
    delete_failed:
      "We couldn't delete that notification. Please try again.",
    permission_denied:
      "You don't have permission to access these notifications. Sign in again and retry.",
  },
  preferences: {
    load_failed:
      "We couldn't load your preferences. Check your connection and try again.",
    save_failed:
      "We couldn't save your preferences. Please try again.",
    permission_denied:
      "You don't have permission to change these preferences. Sign in again and retry.",
  },
  network: {
    offline:
      "You appear to be offline. Check your connection and try again.",
    timeout:
      "The request timed out. Check your connection and try again.",
  },
  generic: {
    unknown:
      "Something went wrong on our side. Please try again in a moment.",
  },
};

function normalizeSupabaseCode(error: SupabaseError): string | undefined {
  const code = error.code?.toLowerCase?.() || "";
  const message = (error.message || "").toLowerCase();

  if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return "invalid_credentials";
  }
  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "email_not_confirmed";
  }
  if (code === "user_already_registered" || message.includes("user already registered")) {
    return "user_already_registered";
  }
  if (code === "weak_password" || message.includes("weak_password")) {
    return "weak_password";
  }
  if (code === "otp_expired" || message.includes("token has expired")) {
    return "otp_expired";
  }
  if (code === "flow_state_expired" || message.includes("flow state")) {
    return "otp_expired";
  }
  if (code === "request_timeout" || message.includes("timeout")) {
    return "request_timeout";
  }
  if (code === "rate_limit" || message.includes("rate limit") || message.includes("too many")) {
    return "rate_limited";
  }
  if (code === "42501" || message.includes("new row violates row-level")) {
    return "permission_denied";
  }
  if (!navigator.onLine) return "offline";
  return undefined;
}

export function getSpecificError(
  error: unknown,
  context: ErrorContext = "generic",
  fallback?: string
): string {
  const supabaseError = error as SupabaseError;
  const code = normalizeSupabaseCode(supabaseError);

  if (code === "offline" || code === "request_timeout") {
    return knownMessages.network[code === "offline" ? "offline" : "timeout"];
  }

  if (code) {
    const mapped = knownMessages[context]?.[code] || fallback || knownMessages.generic.unknown;
    return mapped;
  }

  if (fallback) return fallback;

  if (context === "notification") return knownMessages.notification.load_failed;
  if (context === "preferences") return knownMessages.preferences.load_failed;
  if (context === "auth") return "We couldn't complete that account action. Please check your details and try again.";
  if (context === "otp") return knownMessages.auth.otp_incorrect;

  return knownMessages.generic.unknown;
}

export function getOtpError(error: unknown): string {
  const e = error as SupabaseError;
  const code = normalizeSupabaseCode(e);
  if (code === "rate_limited") return knownMessages.otp.rate_limited;
  if (code === "otp_expired") return knownMessages.auth.otp_expired;
  if (code === "otp_incorrect" || e.message?.toLowerCase().includes("token")) {
    return knownMessages.auth.otp_incorrect;
  }
  return e.message || knownMessages.auth.otp_incorrect;
}

export function getAuthError(error: unknown): string {
  const e = error as SupabaseError;
  const code = normalizeSupabaseCode(e);
  if (code && knownMessages.auth[code]) return knownMessages.auth[code];
  return e.message || knownMessages.generic.unknown;
}

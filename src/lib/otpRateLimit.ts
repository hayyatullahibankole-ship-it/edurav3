import { supabase } from "@/integrations/supabase/client";

/**
 * Shared guard for one-time-code emails (signup verification, password reset).
 *
 * Two layers:
 *  1. A per-device cooldown persisted in localStorage, so reloading the page or
 *     navigating away does not reset the timer.
 *  2. A server-side check keyed on the email address (max 5 codes per hour,
 *     one every 45 seconds) so the limit cannot be bypassed by clearing storage.
 */

export const OTP_COOLDOWN_SECONDS = 45;

const key = (purpose: string, email: string) =>
  `otp_next_send:${purpose}:${email.trim().toLowerCase()}`;

/** Seconds still to wait before another code may be requested on this device. */
export const getOtpCooldown = (purpose: string, email: string): number => {
  if (!email?.trim()) return 0;
  try {
    const until = Number(localStorage.getItem(key(purpose, email)) || 0);
    return Math.max(0, Math.ceil((until - Date.now()) / 1000));
  } catch {
    return 0;
  }
};

const setOtpCooldown = (purpose: string, email: string, seconds: number) => {
  try {
    localStorage.setItem(key(purpose, email), String(Date.now() + seconds * 1000));
  } catch {
    /* storage unavailable — the server check still applies */
  }
};

export type OtpGateResult = {
  allowed: boolean;
  retryAfter: number;
  message?: string;
};

/**
 * Call before sending a code. Returns `allowed: false` with a human message when
 * the request is too soon or the hourly cap for the address has been reached.
 */
export const guardOtpSend = async (purpose: string, rawEmail: string): Promise<OtpGateResult> => {
  const email = rawEmail.trim().toLowerCase();

  const local = getOtpCooldown(purpose, email);
  if (local > 0) {
    return {
      allowed: false,
      retryAfter: local,
      message: `Please wait ${local}s before requesting another code.`,
    };
  }

  try {
    const { data, error } = await (supabase as any).rpc("check_otp_send_rate_limit", {
      p_email: email,
      p_purpose: purpose,
    });
    if (error) throw error;

    const result = (data ?? {}) as { allowed?: boolean; reason?: string; retry_after?: number };
    const retryAfter = Number(result.retry_after ?? OTP_COOLDOWN_SECONDS);

    if (result.allowed === false) {
      setOtpCooldown(purpose, email, Math.min(retryAfter, 3600));
      return {
        allowed: false,
        retryAfter,
        message:
          result.reason === "hourly_limit"
            ? "Too many codes requested for this email. Try again in an hour or contact support@edura.com.ng."
            : `Please wait ${retryAfter}s before requesting another code.`,
      };
    }

    setOtpCooldown(purpose, email, OTP_COOLDOWN_SECONDS);
    return { allowed: true, retryAfter: OTP_COOLDOWN_SECONDS };
  } catch {
    // Never block a legitimate user because the limiter is unreachable —
    // the device cooldown still throttles repeated taps.
    setOtpCooldown(purpose, email, OTP_COOLDOWN_SECONDS);
    return { allowed: true, retryAfter: OTP_COOLDOWN_SECONDS };
  }
};

/** Start the cooldown after a code was sent outside `guardOtpSend` (e.g. at signup). */
export const markOtpSent = (purpose: string, email: string, seconds = OTP_COOLDOWN_SECONDS) =>
  setOtpCooldown(purpose, email, seconds);

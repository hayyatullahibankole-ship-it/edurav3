/**
 * Sign-up is a multi-step wizard. Verifying the email OTP creates a real
 * Supabase session mid-wizard, which would otherwise make the app think the
 * user just logged in and redirect them (journey page / dashboard) before they
 * set a password. While this flag is set, auth redirects are suppressed.
 */
const KEY = "edura_signup_in_progress";

export const startSignupFlow = () => {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    /* storage unavailable */
  }
};

export const endSignupFlow = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
};

export const isSignupInProgress = (): boolean => {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

/**
 * Sign-up is a multi-step wizard. Verifying the email OTP creates a real
 * Supabase session mid-wizard, which would otherwise make the app think the
 * user just logged in and redirect them (journey page / dashboard) before they
 * set a password. While this flag is set, auth redirects are suppressed.
 */
const KEY = "edura_signup_in_progress";
const EVENT = "edura:signup-flow-change";
const TTL_MS = 60 * 60 * 1000;

export type SignupFlowStep = 3 | 4;

export interface SignupFlowDraft {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  academicStage: string;
  institutionName: string;
  studyLevel: string;
}

export interface SignupFlowState {
  step: SignupFlowStep;
  draft: SignupFlowDraft;
  updatedAt: number;
}

const notify = () => window.dispatchEvent(new Event(EVENT));

export const getSignupFlow = (): SignupFlowState | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as SignupFlowState;
    if (!state?.draft?.email || ![3, 4].includes(state.step) || Date.now() - state.updatedAt > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return state;
  } catch {
    return null;
  }
};

export const startSignupFlow = (draft: SignupFlowDraft, step: SignupFlowStep = 3) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ step, draft, updatedAt: Date.now() }));
    notify();
  } catch {
    /* storage unavailable */
  }
};

export const updateSignupFlowStep = (step: SignupFlowStep) => {
  const current = getSignupFlow();
  if (current) startSignupFlow(current.draft, step);
};

export const endSignupFlow = () => {
  try {
    localStorage.removeItem(KEY);
    notify();
  } catch {
    /* storage unavailable */
  }
};

export const isSignupInProgress = (): boolean => {
  try {
    return getSignupFlow() !== null;
  } catch {
    return false;
  }
};

export const subscribeSignupFlow = (listener: () => void) => {
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", listener);
  };
};

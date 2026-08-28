import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  endSignupFlow,
  getSignupFlow,
  isSignupInProgress,
  startSignupFlow,
  subscribeSignupFlow,
  updateSignupFlowStep,
} from "@/lib/signupFlow";

const draft = {
  firstName: "Ada",
  lastName: "Okafor",
  email: "ada@edura.com.ng",
  phone: "08012345678",
  academicStage: "undergraduate",
  institutionName: "University of Lagos",
  studyLevel: "100",
};

describe("smoke: persisted mobile signup flow", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("persists verification state and advances to password without navigation", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSignupFlow(listener);

    startSignupFlow(draft, 3);
    expect(isSignupInProgress()).toBe(true);
    expect(getSignupFlow()).toMatchObject({ step: 3, draft });

    updateSignupFlowStep(4);
    expect(getSignupFlow()).toMatchObject({ step: 4, draft });
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it("only clears signup state when completion or cancellation requests it", () => {
    startSignupFlow(draft, 4);
    expect(isSignupInProgress()).toBe(true);

    endSignupFlow();
    expect(isSignupInProgress()).toBe(false);
  });
});
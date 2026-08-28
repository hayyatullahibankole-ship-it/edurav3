import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";


const { supabase } = await vi.hoisted(async () => {
  const { createSupabaseMock } = await import("../supabaseMock");
  return { supabase: createSupabaseMock() };
});

vi.mock("@/integrations/supabase/client", () => ({ supabase }));

const guardOtpSend = vi.fn(async () => ({ allowed: true, retryAfter: 0, message: "" }));
vi.mock("@/lib/otpRateLimit", () => ({
  guardOtpSend: (...args: any[]) => guardOtpSend(...(args as [])),
  getOtpCooldown: () => 0,
  markOtpSent: vi.fn(),
  OTP_COOLDOWN_SECONDS: 45,
}));

import EmailOtpVerify from "@/components/auth/EmailOtpVerify";

const typeCode = async (user: ReturnType<typeof userEvent.setup>, code: string) => {
  const slots = document.querySelectorAll("input");
  await user.click(slots[0] as HTMLElement);
  await user.keyboard(code);
};

describe("smoke: OTP email verification", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends a code and verifies it", async () => {
    const onVerified = vi.fn();
    const user = userEvent.setup();

    render(
      <EmailOtpVerify
        email="student@edura.com.ng"
        type="email"
        alreadySent={false}
        createUser
        onVerified={onVerified}
      />
    );

    await user.click(screen.getByRole("button", { name: /send verification code/i }));

    await waitFor(() => expect(supabase.auth.signInWithOtp).toHaveBeenCalled());
    expect(guardOtpSend).toHaveBeenCalled();

    await screen.findByText(/enter your 6-digit code/i);
    await typeCode(user, "123456");

    await waitFor(() =>
      expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
        email: "student@edura.com.ng",
        token: "123456",
        type: "email",
      })
    );
    await waitFor(() => expect(onVerified).toHaveBeenCalled(), { timeout: 2000 });
    expect(await screen.findByText(/email verified/i)).toBeInTheDocument();
  });

  it("keeps the user on the code screen when the code is wrong", async () => {
    supabase.auth.verifyOtp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "Token has expired or is invalid" },
    } as any);

    const onVerified = vi.fn();
    const user = userEvent.setup();

    render(<EmailOtpVerify email="student@edura.com.ng" type="email" onVerified={onVerified} />);

    await typeCode(user, "000000");

    await waitFor(() => expect(supabase.auth.verifyOtp).toHaveBeenCalled());
    expect(onVerified).not.toHaveBeenCalled();
  });

  it("blocks a resend when the rate limiter refuses", async () => {
    guardOtpSend.mockResolvedValueOnce({
      allowed: false,
      retryAfter: 40,
      message: "Please wait before requesting another code.",
    } as any);

    const user = userEvent.setup();
    render(
      <EmailOtpVerify email="student@edura.com.ng" type="email" alreadySent={false} onVerified={vi.fn()} />
    );

    await user.click(screen.getByRole("button", { name: /send verification code/i }));

    await waitFor(() => expect(guardOtpSend).toHaveBeenCalled());
    expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled();
  });
});

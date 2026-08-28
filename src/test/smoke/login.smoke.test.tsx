import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { createSupabaseMock } from "../supabaseMock";

const supabase = createSupabaseMock();

vi.mock("@/integrations/supabase/client", () => ({ supabase }));
vi.mock("@/utils/sessionManager", () => ({
  generateSessionToken: () => "session-token",
  storeSessionToken: vi.fn(),
  setSessionToken: vi.fn(async () => true),
}));
vi.mock("@/components/security/MfaChallenge", () => ({
  default: () => null,
  needsMfaChallenge: vi.fn(async () => false),
}));

import MobileAuthForm from "@/components/MobileAuthForm";

const renderForm = () =>
  render(
    <MemoryRouter>
      <MobileAuthForm />
    </MemoryRouter>
  );

describe("smoke: login flow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("signs a user in with email and password", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/email address/i), "student@edura.com.ng");
    await user.type(screen.getByLabelText(/^password$/i), "Str0ngPass!23");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "student@edura.com.ng",
        password: "Str0ngPass!23",
      })
    );
  });

  it("rejects an invalid email without calling the auth API", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/email address/i), "not-an-email");
    await user.type(screen.getByLabelText(/^password$/i), "Str0ngPass!23");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled());
  });

  it("surfaces a failure when credentials are wrong", async () => {
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    } as any);

    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/email address/i), "student@edura.com.ng");
    await user.type(screen.getByLabelText(/^password$/i), "WrongPass!23");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(supabase.auth.signInWithPassword).toHaveBeenCalled());
    // The form stays on the login screen instead of navigating away.
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });
});

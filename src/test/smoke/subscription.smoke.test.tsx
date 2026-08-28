import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { createSupabaseMock } from "../supabaseMock";

const PLANS = [
  {
    id: "plan-free",
    name: "Free",
    price: 0,
    duration_days: 30,
    scope: "cbt",
    description: "Get started at no cost",
    features: ["Limited practice"],
    is_active: true,
  },
  {
    id: "plan-premium",
    name: "Premium",
    price: 2500,
    duration_days: 30,
    scope: "cbt",
    description: "Full CBT access",
    features: ["Unlimited practice"],
    is_active: true,
  },
];

const supabase = createSupabaseMock({
  tables: { subscription_plans: { data: PLANS } },
  functions: { "pay-subscription-wallet": { data: { success: true } } },
});

const navigate = vi.fn();
const refreshWallet = vi.fn();
const createSubscriptionPayment = vi.fn(async () => undefined);
let walletBalance = 10000;

vi.mock("@/integrations/supabase/client", () => ({ supabase }));
vi.mock("@/utils/paystack", () => ({
  createSubscriptionPayment: (...args: any[]) => createSubscriptionPayment(...(args as [])),
}));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1", email: "student@edura.com.ng" }, userProfile: { id: "p1" } }),
}));
vi.mock("@/hooks/useWallet", () => ({
  useWallet: () => ({ balance: walletBalance, loading: false, refresh: refreshWallet }),
}));
vi.mock("@/lib/nativePayments", () => ({
  canPurchaseDigitalInApp: () => true,
  DIGITAL_PURCHASE_NOTICE: "Purchases are handled on the web.",
}));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigate };
});

import Payment from "@/pages/Payment";

const renderPayment = () =>
  render(
    <MemoryRouter initialEntries={["/payment"]}>
      <Payment />
    </MemoryRouter>
  );

describe("smoke: subscription purchase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    walletBalance = 10000;
  });

  it("lists active plans for the CBT scope", async () => {
    renderPayment();
    expect(await screen.findByText("Premium")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("₦2,500")).toBeInTheDocument();
  });

  it("charges the wallet and activates the plan when the balance is enough", async () => {
    const user = userEvent.setup();
    renderPayment();
    await screen.findByText("Premium");

    const walletButton = screen.getAllByRole("button", { name: /wallet/i })[0];
    await user.click(walletButton);

    await waitFor(() =>
      expect(supabase.functions.invoke).toHaveBeenCalledWith("pay-subscription-wallet", {
        body: { plan_id: "plan-premium" },
      })
    );
    await waitFor(() => expect(refreshWallet).toHaveBeenCalled());
    expect(navigate).toHaveBeenCalledWith("/dashboard");
  });

  it("redirects to funding when the wallet balance is short", async () => {
    walletBalance = 100;
    const user = userEvent.setup();
    renderPayment();
    await screen.findByText("Premium");

    await user.click(screen.getAllByRole("button", { name: /wallet/i })[0]);

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/wallet"));
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });
});

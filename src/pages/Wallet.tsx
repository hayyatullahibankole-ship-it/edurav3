import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import AppShell from "@/components/edura/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { initializePaystackPayment } from "@/utils/paystack";
import { canPurchaseDigitalInApp, DIGITAL_PURCHASE_NOTICE } from "@/lib/nativePayments";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Copy,
  Loader2,
  RefreshCw,
  Wallet as WalletIcon,
} from "lucide-react";

const naira = (value: number) =>
  `₦${Number(value || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000];

type VirtualAccount = {
  account_number: string;
  account_name: string;
  bank_name: string;
  status: string;
};

const Wallet = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { balance, transactions, loading, refresh } = useWallet();
  const [amount, setAmount] = useState("");
  const [funding, setFunding] = useState(false);
  const [account, setAccount] = useState<VirtualAccount | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [generating, setGenerating] = useState(false);


  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user) {
        setAccount(null);
        setAccountLoading(false);
        return;
      }
      const { data } = await supabase
        .from("user_virtual_accounts")
        .select("account_number, account_name, bank_name, status")
        .eq("user_id", user.id)
        .maybeSingle();
      if (active) {
        setAccount((data as VirtualAccount) || null);
        setAccountLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user || !account) return;

    let active = true;
    const reconcileTransfers = async () => {
      const { data, error } = await supabase.functions.invoke("wallet-sync", { body: {} });
      if (active && !error && data?.credited > 0) await refresh();
    };

    void reconcileTransfers();
    return () => {
      active = false;
    };
  }, [account?.account_number, refresh, user?.id]);

  const generateAccount = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setGenerating(true);
    try {
      const { data: profileData } = await supabase
        .from("users")
        .select("first_name, last_name, phone")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      const firstName =
        (profileData?.first_name as string | undefined) ||
        (user.user_metadata?.first_name as string | undefined) ||
        undefined;

      const lastName =
        (profileData?.last_name as string | undefined) ||
        (user.user_metadata?.last_name as string | undefined) ||
        undefined;

      const rawName = [firstName, lastName].filter(Boolean).join(" ").trim();

      const phone =
        (profileData?.phone as string | undefined) ||
        (user.user_metadata?.phone as string | undefined) ||
        undefined;

      const { data, error } = await supabase.functions.invoke("wallet-virtual-account", {
        body: {
          first_name: firstName || rawName?.split(/\s+/)[0] || undefined,
          last_name: lastName || rawName?.split(/\s+/).slice(1).join(" ") || undefined,
          full_name: rawName || user.user_metadata?.full_name || user.email?.split("@")[0] || "Edura User",
          email: user.email,
          phone,
        },
      });
      if (error || data?.error) {
        toast.error(data?.error || "Could not generate your account number");
      } else if (data?.account) {
        setAccount(data.account as VirtualAccount);
        toast.success("Your dedicated account number is ready");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate account");
    } finally {
      setGenerating(false);
    }
  };

  const copyAccount = async () => {
    if (!account) return;
    try {
      await navigator.clipboard.writeText(account.account_number);
      toast.success("Account number copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  const fundWallet = async () => {
    const value = Number(amount);
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!Number.isFinite(value) || value < 100) {
      toast.error("Enter an amount of at least ₦100");
      return;
    }

    setFunding(true);
    try {
      await initializePaystackPayment(
        {
          amount: value * 100,
          email: user.email || "",
          reference: `wal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          currency: "NGN",
          metadata: { purpose: "wallet_topup", user_id: user.id },
        },
        async (reference) => {
          const { data, error } = await supabase.functions.invoke("wallet-fund", {
            body: { reference },
          });
          if (error || data?.error) {
            toast.error(data?.error || "We could not confirm that payment yet.");
          } else {
            toast.success(`Wallet funded with ${naira(value)}`);
            setAmount("");
            refresh();
          }
          setFunding(false);
        },
        () => setFunding(false),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start payment");
      setFunding(false);
    }
  };

  return (
    <AppShell side="cbt" title="Wallet" subtitle="Fund once, pay instantly">
      <main className="mx-auto max-w-3xl space-y-5">
        <Card className="overflow-hidden rounded-3xl border-0 bg-ink text-ink-foreground shadow-card">
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/15 p-2.5">
                  <WalletIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-ink-foreground/60">Available balance</p>
                  <p className="text-3xl font-bold">{loading ? "—" : naira(balance)}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" aria-label="Refresh wallet balance" onClick={refresh} className="h-10 w-10 text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            <div className="rounded-2xl border border-ink-foreground/10 bg-ink-foreground/5 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/15 p-2">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Dedicated account number</p>
                  {accountLoading ? (
                    <p className="mt-1 text-xs text-ink-foreground/60">Checking…</p>
                  ) : account ? (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-bold tracking-wider">{account.account_number}</p>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyAccount}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="text-xs text-ink-foreground/60">
                        {account.bank_name} • {account.account_name}
                      </p>
                      <p className="text-xs text-ink-foreground/60">
                        Transfer to this account from any bank app and your wallet is funded
                        automatically.
                      </p>
                    </div>

                  ) : (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-ink-foreground/60">
                        Generate a permanent account number in your name. Any transfer to it tops up
                        your wallet instantly.
                      </p>
                      <Button size="sm" onClick={generateAccount} disabled={generating}>
                        {generating && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                        {generating ? "Generating…" : "Generate account number"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>


            {canPurchaseDigitalInApp() ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="amount">Top up amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 2000"
                  />
                  <div className="flex flex-wrap gap-2">
                    {QUICK_AMOUNTS.map((value) => (
                      <Button
                        key={value}
                        size="sm"
                        variant="outline"
                        onClick={() => setAmount(String(value))}
                      >
                        {naira(value)}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button className="w-full" onClick={fundWallet} disabled={funding}>
                  {funding ? "Processing..." : "Fund wallet"}
                </Button>
              </>
            ) : (
              <p className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                {DIGITAL_PURCHASE_NOTICE}
              </p>
            )}
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Recent activity</h2>
          {transactions.length === 0 ? (
            <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
              No wallet activity yet.
            </div>
          ) : (
            <div className="divide-y rounded-lg border">
              {transactions.map((txn) => {
                const credit = txn.transaction_type === "credit";
                return (
                  <div key={txn.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="rounded-md border bg-muted p-2">
                        {credit ? (
                          <ArrowDownLeft className="h-4 w-4 text-success" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {txn.description || (credit ? "Wallet top-up" : "Payment")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(txn.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-sm font-semibold ${credit ? "text-success" : ""}`}>
                        {credit ? "+" : "-"}
                        {naira(Number(txn.amount))}
                      </p>
                      <Badge variant="secondary" className="text-[10px]">
                        {naira(Number(txn.balance_after))}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
};

export default Wallet;

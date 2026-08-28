import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Star, Crown, Zap, CreditCard, Loader2, Wallet as WalletIcon } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { createSubscriptionPayment } from "@/utils/paystack";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { canPurchaseDigitalInApp, DIGITAL_PURCHASE_NOTICE } from "@/lib/nativePayments";

const Payment = () => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { balance, loading: walletLoading, refresh: refreshWallet } = useWallet();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingPlan, setPayingPlan] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const scope = (searchParams.get("scope") === "campus" ? "campus" : "cbt") as "cbt" | "campus";

  const handleWalletPayment = async (plan: any) => {
    if (!user) return;
    if (balance < plan.price) {
      toast({
        title: "Insufficient wallet balance",
        description: `You need ₦${(plan.price - balance).toLocaleString()} more. Fund your wallet to continue.`,
        variant: "destructive",
      });
      navigate("/wallet");
      return;
    }
    setPayingPlan(plan.id);
    try {
      const { data, error } = await supabase.functions.invoke("pay-subscription-wallet", {
        body: { plan_id: plan.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Subscription activated",
        description: `${plan.name} is now active. ₦${plan.price.toLocaleString()} was debited from your wallet.`,
      });
      await refreshWallet();
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Payment failed",
        description: err?.message || "Could not complete the wallet payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPayingPlan(null);
    }
  };


  useEffect(() => {
    fetchPlans();
  }, [scope]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .in('scope', [scope, 'all'])
        .order('price', { ascending: true });

      if (error) throw error;

      // CBT and Campus plans are fully separate. Only the free plan is shared.
      const scoped = (data || []).filter(
        (plan: any) => plan.scope === scope || Number(plan.price) === 0
      );

      // Process plans and add UI-specific data
      const processedPlans = scoped.map((plan: any) => ({
        ...plan,
        displayPrice: plan.price === 0 ? '₦0' : `₦${plan.price.toLocaleString()}`,
        period: plan.price === 0 ? 'forever' : `per ${Math.floor(plan.duration_days / 30) === 1 ? 'month' : Math.floor(plan.duration_days / 30) + ' months'}`,
        icon: plan.price === 0 ? <Zap className="h-6 w-6" /> : 
              plan.price < 3000 ? <Star className="h-6 w-6" /> : 
              <Crown className="h-6 w-6" />,
        popular: plan.name.toLowerCase().includes('premium'),
        paystack: plan.price > 0,
        cta: plan.price === 0 ? "Start Free" : `Choose ${plan.name}`
      }));

      // Only highlight one plan as popular
      let highlighted = false;
      processedPlans.forEach((pl: any) => {
        if (pl.popular && !highlighted) { highlighted = true; } else { pl.popular = false; }
      });

      setPlans(processedPlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to load pricing plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackPayment = async (planName: string, amount: number) => {
    if (!user?.email) {
      toast({
        title: "Authentication Required", 
        description: "Please login first to subscribe",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await createSubscriptionPayment(planName, user.email, amount);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize payment. Please try again.';
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const yearlyDiscount = {
    premium: "₦25,000", 
    pro: "₦45,000"
  };

  useEffect(() => {
    // Load Paystack script
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Hero */}
      <section className="bg-ink text-ink-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Plans &amp; pricing
            </span>
            <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
              Pay once. Practise all season.
            </h1>
            <p className="mt-5 max-w-xl text-base sm:text-lg text-ink-foreground/70">
              Flexible pricing built for Nigerian students. Start free, upgrade whenever you are ready —
              no hidden charges.
            </p>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-start">
            {plans.map((plan: any, index: number) => (
              <div
                key={index}
                className={`relative flex h-full flex-col rounded-2xl border bg-card p-6 ${
                  plan.popular ? "border-primary" : "border-border"
                }`}
              >
                {plan.popular && (
                  <span className="absolute right-5 top-5 rounded bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                    Popular
                  </span>
                )}

                <h3 className="font-display text-lg font-bold">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold tabular-nums">{plan.displayPrice}</span>
                  <span className="text-xs text-muted-foreground">/{plan.period}</span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{plan.description}</p>

                <div className="mt-5 space-y-2.5 border-t border-border pt-5">
                  {(Array.isArray(plan.features) && plan.features.length > 0
                    ? (plan.features as string[])
                    : DEFAULT_PLAN_FEATURES
                  ).map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {plan.name !== "Free" && plan.price > 0 && (
                  <div className="mt-5 rounded-xl bg-surface p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      Yearly billing
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {plan.name === "Premium" ? yearlyDiscount.premium : yearlyDiscount.pro}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">2 months free</span>
                    </p>
                  </div>
                )}

                <div className="mt-auto space-y-2 pt-6">
                  {plan.paystack && !canPurchaseDigitalInApp() ? (
                    <p className="rounded-lg border bg-surface p-3 text-[11px] text-muted-foreground">
                      {DIGITAL_PURCHASE_NOTICE}
                    </p>
                  ) : plan.paystack ? (
                    <>
                      <Button
                        onClick={() => handlePaystackPayment(plan.name, plan.price)}
                        className="w-full h-11 font-bold"
                        variant={plan.popular ? "default" : "outline"}
                        disabled={!user || payingPlan === plan.id}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        {user ? "Pay with card" : "Login to subscribe"}
                      </Button>
                      {user && (
                        <>
                          <Button
                            onClick={() => handleWalletPayment(plan)}
                            className="w-full h-11 font-bold"
                            variant="outline"
                            disabled={payingPlan === plan.id}
                          >
                            {payingPlan === plan.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <WalletIcon className="mr-2 h-4 w-4" />
                            )}
                            {payingPlan === plan.id ? "Processing..." : "Pay from wallet"}
                          </Button>
                          <p className="text-center text-[11px] text-muted-foreground">
                            {walletLoading
                              ? "Checking wallet..."
                              : balance >= plan.price
                                ? `Wallet balance: ₦${balance.toLocaleString()}`
                                : `Wallet balance: ₦${balance.toLocaleString()} — top up ₦${(plan.price - balance).toLocaleString()} more`}
                          </p>
                        </>
                      )}
                    </>
                  ) : (
                    <Link to={user ? "/dashboard" : "/auth"} className="block">
                      <Button className="w-full h-11 font-bold" variant="outline">
                        {user ? "Current plan" : plan.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-surface py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">FAQ</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Questions students ask
          </h2>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              {
                q: "Can I change my plan anytime?",
                a: "Yes. Upgrade or downgrade whenever you like — changes take effect immediately.",
              },
              {
                q: "What payment methods do you accept?",
                a: "Cards, bank transfers and your Edura wallet balance, all processed through Paystack.",
              },
              {
                q: "Is there a money-back guarantee?",
                a: "Yes. If the platform isn't for you, tell us within 7 days and we refund you.",
              },
              {
                q: "Can I share my account with friends?",
                a: "Each account is for one student. We offer group pricing for schools and study groups.",
              },
            ].map((item) => (
              <div key={item.q} className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-display text-base font-bold">{item.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-ink px-6 py-12 sm:px-12 text-ink-foreground">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                Start your journey today
              </h2>
              <p className="mt-4 text-ink-foreground/70">
                Join over 50,000 students preparing for JAMB and WAEC on Edura.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to={user ? "/dashboard" : "/auth"}>
                  <Button size="lg" className="h-12 px-8 text-base font-bold text-ink hover:bg-primary-hover">
                    {user ? "Go to dashboard" : "Create free account"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/demo">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-8 text-base font-bold border-white/15 bg-ink-soft text-ink-foreground hover:bg-ink-soft/70 hover:text-ink-foreground"
                  >
                    Try the demo first
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Payment;

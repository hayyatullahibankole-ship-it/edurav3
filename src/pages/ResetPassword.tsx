import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { passwordSchema } from "@/utils/inputValidation";
import { getOtpCooldown, guardOtpSend, OTP_COOLDOWN_SECONDS } from "@/lib/otpRateLimit";
import eduraLogo from "@/assets/edura-logo.png";

type Step = "email" | "code" | "password" | "done";

export default function ResetPassword() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const backTo = params.get("from") === "school" ? "/school-login" : "/auth";

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Restore any pending cooldown for this address (survives reloads).
  useEffect(() => {
    const pending = getOtpCooldown("recovery", email);
    if (pending > 0) setCooldown(pending);
  }, [email]);


  const sendCode = async () => {
    if (!email.trim()) {
      toast({ title: "Email required", description: "Enter the email on your account.", variant: "destructive" });
      return;
    }
    if (cooldown > 0 || busy) return;
    setBusy(true);
    try {
      const gate = await guardOtpSend("recovery", email);
      if (!gate.allowed) {
        setCooldown(gate.retryAfter);
        setStep("code");
        toast({ title: "Slow down", description: gate.message, variant: "destructive" });
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) throw error;
      setStep("code");
      setCooldown(OTP_COOLDOWN_SECONDS);
      toast({ title: "Code sent", description: "Check your inbox for a 6-digit reset code." });
    } catch (e: any) {
      toast({ title: "Could not send code", description: e?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (value: string) => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: value,
        type: "recovery",
      });
      if (error) throw error;
      setStep("password");
    } catch (e: any) {
      setCode("");
      toast({
        title: "Invalid code",
        description: e?.message || "That code is incorrect or expired.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    try {
      passwordSchema.parse(password);
    } catch (e: any) {
      toast({
        title: "Weak password",
        description: e?.errors?.[0]?.message || "Please choose a stronger password.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      setStep("done");
    } catch (e: any) {
      toast({ title: "Could not update password", description: e?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Helmet>
        <title>Reset your Edura password</title>
        <meta name="description" content="Reset your Edura account password with a secure one-time code." />
      </Helmet>

      <div className="w-full max-w-md">
        <div className="text-center mb-4">
          <Link to={backTo} className="inline-flex items-center gap-2 hover:opacity-80">
            <img src={eduraLogo} alt="Edura" className="h-20 w-auto" />
          </Link>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {step === "done" ? "Password updated" : "Reset your password"}
            </CardTitle>
            <CardDescription>
              {step === "email" && "Enter your email and we'll send you a one-time code."}
              {step === "code" && `Enter the 6-digit code sent to ${email}.`}
              {step === "password" && "Choose a new password for your account."}
              {step === "done" && "You can now sign in with your new password."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {step === "email" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={sendCode} disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send code
                </Button>
              </>
            )}

            {step === "code" && (
              <>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={code}
                    disabled={busy}
                    onChange={(v) => {
                      setCode(v);
                      if (v.length === 6) verifyCode(v);
                    }}
                  >
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button className="w-full" disabled={code.length !== 6 || busy} onClick={() => verifyCode(code)}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify code
                </Button>
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    className="text-primary disabled:text-muted-foreground"
                    disabled={cooldown > 0 || busy}
                    onClick={sendCode}
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                  </button>
                  <button type="button" className="text-muted-foreground underline" onClick={() => setStep("email")}>
                    Change email
                  </button>
                </div>
              </>
            )}

            {step === "password" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={show ? "text" : "password"}
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShow((s) => !s)}
                      aria-label={show ? "Hide password" : "Show password"}
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={show ? "text" : "password"}
                      className="pl-10"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={savePassword} disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update password
                </Button>
              </>
            )}

            {step === "done" && (
              <div className="flex flex-col items-center gap-3 text-center">
                <CheckCircle2 className="h-12 w-12 text-primary" />
                <Button className="w-full" onClick={() => navigate(backTo, { replace: true })}>
                  Back to login
                </Button>
              </div>
            )}

            {step !== "done" && (
              <Button variant="ghost" className="w-full" asChild>
                <Link to={backTo}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

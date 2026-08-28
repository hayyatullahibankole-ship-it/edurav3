import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getOtpCooldown, guardOtpSend, markOtpSent, OTP_COOLDOWN_SECONDS } from "@/lib/otpRateLimit";
import { getOtpError } from "@/lib/errors";

interface Props {
  email: string;
  /** 'signup' for new accounts, 'email' for magic-link style codes */
  type?: "signup" | "email";
  /**
   * true  - a code was already sent by the caller (start the cooldown immediately)
   * false - show a "Send code" button and send it from here
   */
  alreadySent?: boolean;
  /** Allow the OTP request to create the user (email-first signup). */
  createUser?: boolean;
  onVerified: () => void;
  onCancel?: () => void;
}

/**
 * Six digit email verification. The code is delivered by the auth email hook.
 */
export const EmailOtpVerify = ({
  email,
  type = "signup",
  alreadySent = true,
  createUser = false,
  onVerified,
  onCancel,
}: Props) => {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sent, setSent] = useState(alreadySent);

  // When the caller already triggered the send, start (or restore) the timer.
  useEffect(() => {
    if (!alreadySent) return;
    const existing = getOtpCooldown(type, email);
    if (existing > 0) {
      setCooldown(existing);
    } else {
      markOtpSent(type, email);
      setCooldown(OTP_COOLDOWN_SECONDS);
    }
  }, [email, type, alreadySent]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verify = async (value: string) => {
    setVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: value, type });
      if (error) throw error;
      setVerified(true);
      toast({ title: "Email verified", description: "Your email address is confirmed." });
      setTimeout(onVerified, 700);
    } catch (e: any) {
      toast({
        title: "Invalid code",
        description: getOtpError(e),
        variant: "destructive",
      });
      setCode("");
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      const gate = await guardOtpSend(type, email);
      if (!gate.allowed) {
        setCooldown(gate.retryAfter);
        toast({ title: "Slow down", description: gate.message, variant: "destructive" });
        return;
      }

      const { error } =
        type === "signup"
          ? await supabase.auth.resend({ type: "signup", email })
          : await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
      if (error) throw error;
      setCooldown(OTP_COOLDOWN_SECONDS);
      toast({ title: "Code sent", description: `We sent a new code to ${email}.` });
    } catch (e: any) {
      toast({ title: "Could not send code", description: getOtpError(e), variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-primary" />
        <p className="font-semibold">Email verified</p>
        <p className="text-sm text-muted-foreground">{email}</p>
      </div>
    );
  }

  const progressPct = cooldown > 0 ? Math.round((cooldown / OTP_COOLDOWN_SECONDS) * 100) : 0;

  return (
    <div className="space-y-4 rounded-xl border p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Mail className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold">Enter your 6-digit code</p>
          <p className="text-sm text-muted-foreground">
            We sent it to <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={(v) => {
            setCode(v);
            if (v.length === 6) verify(v);
          }}
          disabled={verifying}
        >
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button className="w-full" disabled={code.length !== 6 || verifying} onClick={() => verify(code)}>
        {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Verify email
      </Button>

      <div className="space-y-2">
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || resending}
          className="flex w-full flex-col items-center gap-1 rounded-lg py-2 text-sm text-primary transition-colors disabled:text-muted-foreground"
        >
          {cooldown > 0 ? (
            <>
              <span className="font-medium">Resend code in {cooldown}s</span>
              <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-1000"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">You can request a new code once the timer ends.</span>
            </>
          ) : resending ? (
            <span className="flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</span>
          ) : (
            "Resend code"
          )}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="w-full text-center text-sm text-muted-foreground underline">
            Use a different email
          </button>
        )}
      </div>
    </div>
  );
};

export default EmailOtpVerify;

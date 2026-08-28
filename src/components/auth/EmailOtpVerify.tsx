import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  email: string;
  /** 'signup' for new accounts, 'email' for magic-link style codes */
  type?: "signup" | "email";
  onVerified: () => void;
  onCancel?: () => void;
}

/**
 * Six digit email verification. The code is delivered by the auth email hook.
 */
export const EmailOtpVerify = ({ email, type = "signup", onVerified, onCancel }: Props) => {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(45);

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
        description: e?.message || "That code is incorrect or has expired. Request a new one.",
        variant: "destructive",
      });
      setCode("");
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      const { error } =
        type === "signup"
          ? await supabase.auth.resend({ type: "signup", email })
          : await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
      if (error) throw error;
      setCooldown(45);
      toast({ title: "Code sent", description: `We sent a new code to ${email}.` });
    } catch (e: any) {
      toast({ title: "Could not send code", description: e?.message, variant: "destructive" });
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

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || resending}
          className="text-primary disabled:text-muted-foreground"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending..." : "Resend code"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-muted-foreground underline">
            Use a different email
          </button>
        )}
      </div>
    </div>
  );
};

export default EmailOtpVerify;

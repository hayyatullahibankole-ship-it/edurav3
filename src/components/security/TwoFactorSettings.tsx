import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Enrollment = { factorId: string; qr: string; secret: string };

/**
 * Real authenticator-app (TOTP) two-factor authentication via Supabase MFA.
 * The switch only reflects a verified factor — nothing is stored until a code verifies.
 */
export default function TwoFactorSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [confirmOff, setConfirmOff] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    const verified = data?.totp?.find((f) => f.status === "verified");
    setFactorId(verified?.id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const startEnrollment = async () => {
    setWorking(true);
    try {
      // Clear any half-finished factor so enrollment never fails on a stale one.
      const { data: existing } = await supabase.auth.mfa.listFactors();
      for (const f of existing?.all ?? []) {
        if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Edura ${Date.now()}`,
      });
      if (error) throw error;
      setEnrollment({
        factorId: data.id,
        qr: data.totp.qr_code,
        secret: data.totp.secret,
      });
      setCode("");
    } catch (err: any) {
      toast({
        title: "Could not start setup",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setWorking(false);
    }
  };

  const verify = async () => {
    if (!enrollment || code.trim().length < 6) return;
    setWorking(true);
    try {
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
        factorId: enrollment.factorId,
      });
      if (cErr) throw cErr;

      const { error } = await supabase.auth.mfa.verify({
        factorId: enrollment.factorId,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (error) throw error;

      setEnrollment(null);
      setCode("");
      await refresh();
      toast({
        title: "Two-factor authentication is on",
        description: "You'll be asked for a 6-digit code the next time you sign in.",
      });
    } catch (err: any) {
      toast({
        title: "Wrong code",
        description: err?.message ?? "Check your authenticator app and try again.",
        variant: "destructive",
      });
    } finally {
      setWorking(false);
    }
  };

  const disable = async () => {
    if (!factorId) return;
    setWorking(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      setConfirmOff(false);
      await refresh();
      toast({ title: "Two-factor authentication turned off" });
    } catch (err: any) {
      toast({
        title: "Could not turn it off",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setWorking(false);
    }
  };

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="flex items-center gap-2 font-medium">
            Two-Factor Authentication
            {!loading && (
              <Badge variant={factorId ? "secondary" : "outline"}>{factorId ? "On" : "Off"}</Badge>
            )}
          </h4>
          <p className="text-sm text-muted-foreground">
            Use an authenticator app (Google Authenticator, Authy, Microsoft Authenticator) for a
            6-digit code at sign-in.
          </p>
        </div>
        <Switch
          disabled={loading || working}
          checked={Boolean(factorId)}
          onCheckedChange={(checked) => (checked ? startEnrollment() : setConfirmOff(true))}
        />
      </div>

      {/* Enrollment */}
      <Dialog open={Boolean(enrollment)} onOpenChange={(open) => !open && setEnrollment(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Set up two-factor
            </DialogTitle>
            <DialogDescription>
              Scan this QR code with your authenticator app, then enter the 6-digit code it shows.
            </DialogDescription>
          </DialogHeader>

          {enrollment && (
            <div className="space-y-4">
              <div className="flex justify-center rounded-xl border border-border bg-white p-3">
                <img src={enrollment.qr} alt="Two-factor QR code" className="h-44 w-44" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Can't scan? Enter this key manually:</p>
                <code className="mt-1 block break-all rounded-lg bg-muted p-2 text-xs">
                  {enrollment.secret}
                </code>
              </div>
              <Input
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
              <p className="text-xs text-muted-foreground">
                Keep this authenticator app installed. If you lose the device, contact support to
                regain access.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrollment(null)} disabled={working}>
              Cancel
            </Button>
            <Button onClick={verify} disabled={working || code.length < 6}>
              {working && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify & enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable */}
      <Dialog open={confirmOff} onOpenChange={setConfirmOff}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-destructive" /> Turn off two-factor?
            </DialogTitle>
            <DialogDescription>
              Your account will be protected by your password only.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOff(false)} disabled={working}>
              Keep it on
            </Button>
            <Button variant="destructive" onClick={disable} disabled={working}>
              {working && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Turn off
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

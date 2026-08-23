import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

/** True when the signed-in user has a verified TOTP factor still to be satisfied. */
export async function needsMfaChallenge(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    return data?.nextLevel === "aal2" && data.nextLevel !== data.currentLevel;
  } catch {
    return false;
  }
}

type Props = {
  open: boolean;
  onVerified: () => void;
  onCancel: () => void;
};

/** Second step of sign-in for accounts with an authenticator app enabled. */
export default function MfaChallenge({ open, onVerified, onCancel }: Props) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [working, setWorking] = useState(false);

  const submit = async () => {
    setWorking(true);
    try {
      const { data: factors, error: fErr } = await supabase.auth.mfa.listFactors();
      if (fErr) throw fErr;
      const factor = factors?.totp?.find((f) => f.status === "verified");
      if (!factor) throw new Error("No authenticator app is set up on this account.");

      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
        factorId: factor.id,
      });
      if (cErr) throw cErr;

      const { error } = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (error) throw error;

      setCode("");
      onVerified();
    } catch (err: any) {
      toast({
        title: "Verification failed",
        description: err?.message ?? "Check the 6-digit code and try again.",
        variant: "destructive",
      });
    } finally {
      setWorking(false);
    }
  };

  const cancel = async () => {
    setCode("");
    await supabase.auth.signOut();
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && cancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Enter your 6-digit code
          </DialogTitle>
          <DialogDescription>
            Open your authenticator app and enter the current code for Edura.
          </DialogDescription>
        </DialogHeader>

        <Input
          autoFocus
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && code.length === 6 && submit()}
        />

        <DialogFooter>
          <Button variant="outline" onClick={cancel} disabled={working}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={working || code.length < 6}>
            {working && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

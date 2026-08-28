import MfaChallenge, { needsMfaChallenge } from "@/components/security/MfaChallenge";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, ArrowLeft, CheckCircle2, GraduationCap, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { emailSchema, passwordSchema, nameSchema, phoneSchema } from "@/utils/inputValidation";
import { generateSessionToken, storeSessionToken, setSessionToken } from "@/utils/sessionManager";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import eduraLogo from "@/assets/edura-logo.png";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACADEMIC_STAGES, STUDY_LEVELS, isCampusStage } from "@/lib/academicStages";
import EmailOtpVerify from "@/components/auth/EmailOtpVerify";
import { getAuthError } from "@/lib/errors";

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

type SignupStep = 1 | 2 | 3 | 4;

const stepMeta: Record<number, { title: string; subtitle: string }> = {
  1: { title: "About you", subtitle: "Let's start with the basics." },
  2: { title: "Your path", subtitle: "Tell us where you are in your education." },
  3: { title: "Verify email", subtitle: "Confirm your email address with a 6-digit code." },
  4: { title: "Create password", subtitle: "Set a secure password to finish." },
};

export default function MobileAuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  const [step, setStep] = useState<SignupStep>(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    academicStage: "",
    institutionName: "",
    studyLevel: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mfaOpen, setMfaOpen] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      setReferralCode(refCode);
      setIsLogin(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const preferred = localStorage.getItem("preferredJourney");
    if (preferred && !formData.academicStage) {
      setFormData((prev) => ({
        ...prev,
        academicStage: preferred === "campus" ? "undergraduate" : "jamb_candidate",
      }));
    }
  }, []);

  const handleHaptic = async () => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateStep = (targetStep: SignupStep): boolean => {
    const newErrors: Record<string, string> = {};
    try {
      if (targetStep >= 1) {
        nameSchema.parse(formData.firstName);
        nameSchema.parse(formData.lastName);
        phoneSchema.parse(formData.phone);
      }
      if (targetStep >= 2) {
        if (!formData.academicStage) newErrors.academicStage = "Please select where you are right now";
      }
      if (targetStep >= 3) {
        emailSchema.parse(formData.email);
      }
      if (targetStep >= 4) {
        passwordSchema.parse(formData.password);
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Passwords don't match";
        }
      }
    } catch (e: any) {
      e.issues?.forEach((issue: any) => {
        const field = issue.path[0];
        if (field) newErrors[field] = issue.message;
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  const nextStep = async () => {
    await handleHaptic();
    if (!validateStep(step)) return;
    if (step < 4) setStep((s) => ((s + 1) as SignupStep));
  };

  const prevStep = async () => {
    await handleHaptic();
    if (step > 1) setStep((s) => ((s - 1) as SignupStep));
  };

  const handleForgotPassword = async () => {
    await handleHaptic();
    const email = formData.email?.trim();
    navigate(`/reset-password${email ? `?email=${encodeURIComponent(email)}` : ""}`);
  };

  /** Email is verified (an OTP session now exists) — set the password and profile data. */
  const finishSignup = async () => {
    if (!validateStep(4)) return;
    setLoading(true);
    await handleHaptic();
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: formData.password,
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          academic_stage: formData.academicStage,
          institution_name: formData.institutionName,
          study_level: formData.studyLevel,
        },
      });

      if (error) throw error;

      if (data.user && referralCode) {
        try {
          localStorage.setItem(
            "pending_referral",
            JSON.stringify({ code: referralCode, userId: data.user.id, email: formData.email })
          );
        } catch (refError) {
          console.error("Referral storage error:", refError);
        }
      }

      onVerified();
    } catch (error: any) {
      toast({
        title: "Could not finish setting up your account",
        description: getAuthError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    await handleHaptic();

    try {
      const loginData = loginSchema.parse({
        email: formData.email,
        password: formData.password,
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;

      if (data.user) {
        if (await needsMfaChallenge()) {
          setMfaOpen(true);
          return;
        }
        const newSessionToken = generateSessionToken();
        storeSessionToken(newSessionToken);
        await setSessionToken(data.user.id, newSessionToken);
        toast({ title: "Welcome back!", description: "Login successful" });
      }
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: getAuthError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onVerified = () => {
    toast({ title: "Email verified", description: "Welcome to Edura!" });
    navigate("/dashboard", { replace: true });
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="animate-fade-in space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    className={`pl-10 ${errors.firstName ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    className={`pl-10 ${errors.lastName ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="08012345678"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className={`pl-10 ${errors.phone ? "border-destructive" : ""}`}
                />
              </div>
              {errors.phone ? (
                <p className="text-xs text-destructive">{errors.phone}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Use 08012345678 or +2348012345678</p>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="animate-fade-in space-y-4">
            <div className="space-y-1.5">
              <Label>Where are you right now?</Label>
              <Select value={formData.academicStage} onValueChange={(v) => updateField("academicStage", v)}>
                <SelectTrigger className={errors.academicStage ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select your stage" />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMIC_STAGES.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.academicStage && <p className="text-xs text-destructive">{errors.academicStage}</p>}
            </div>
            {isCampusStage(formData.academicStage) && (
              <div className="animate-fade-in space-y-3 rounded-xl border p-3">
                <div className="space-y-1.5">
                  <Label>Institution name</Label>
                  <Input
                    placeholder="e.g. University of Lagos"
                    value={formData.institutionName}
                    onChange={(e) => updateField("institutionName", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Level</Label>
                  <Select value={formData.studyLevel} onValueChange={(v) => updateField("studyLevel", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDY_LEVELS.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="animate-fade-in space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@email.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  disabled={emailSent}
                  className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            {emailSent && (
              <EmailOtpVerify
                key={formData.email}
                email={formData.email.trim().toLowerCase()}
                type="email"
                alreadySent={false}
                createUser
                onVerified={() => setStep(4)}
                onCancel={() => setEmailSent(false)}
              />
            )}

            {!emailSent && (
              <Button
                className="h-12 w-full rounded-xl text-base font-semibold"
                onClick={async () => {
                  await handleHaptic();
                  if (!validateStep(3)) return;
                  setEmailSent(true);
                }}
              >
                Verify email <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        );
      case 4:
        return (
          <div className="animate-fade-in space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create password"
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              {/* email already verified in step 3 */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  className={`pl-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                />
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="animate-fade-in space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="login-email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="login-email"
            type="email"
            placeholder="you@email.com"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
          />
        </div>
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="login-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter password"
            value={formData.password}
            onChange={(e) => updateField("password", e.target.value)}
            className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleForgotPassword}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Forgot Password?
        </button>
      </div>
      <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl text-base font-semibold">
        {loading ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Signing in…</span> : "Sign In"}
      </Button>
    </form>
  );

  const renderSignupForm = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Step {step} of 4</span>
          <span>{stepMeta[step].title}</span>
        </div>
        <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">{stepMeta[step].subtitle}</p>
      </div>

      {renderStepContent()}

      <div className="flex gap-3 pt-2">
        {step > 1 && step < 4 && (
          <Button variant="outline" className="h-12 flex-1 rounded-xl" onClick={prevStep} disabled={loading}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        )}
        {step < 3 && (
          <Button className="h-12 flex-1 rounded-xl text-base font-semibold" onClick={nextStep}>
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
        {step === 4 && (
          <Button className="h-12 flex-1 rounded-xl text-base font-semibold" onClick={finishSignup} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating…
              </span>
            ) : (
              <>Create account <ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <MfaChallenge open={mfaOpen} onCancel={() => setMfaOpen(false)} onVerified={() => setMfaOpen(false)} />

      <div className="relative flex h-[35vh] shrink-0 flex-col items-center justify-center bg-primary px-6 text-center">
        <div className="rounded-2xl bg-white/20 p-4 backdrop-blur">
          <img src={eduraLogo} alt="Edura" className="h-12 w-auto" />
        </div>
        <h1 className="mt-4 text-3xl font-black text-white">
          {isLogin ? "Welcome back" : stepMeta[step].title}
        </h1>
        <p className="mt-1 text-sm font-medium text-white/90">
          {isLogin ? "Continue your learning journey" : stepMeta[step].subtitle}
        </p>
      </div>

      <div className="relative -mt-6 flex-1 rounded-t-[2rem] bg-background px-6 pb-8 pt-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {referralCode && !isLogin && (
          <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
            <p className="font-semibold text-primary">Referral code: {referralCode}</p>
            <p className="text-xs text-muted-foreground">Earn bonus points when you sign up.</p>
          </div>
        )}

        {isLogin ? renderLoginForm() : renderSignupForm()}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={async () => {
              await handleHaptic();
              setIsLogin(!isLogin);
              setErrors({});
              setStep(1);
            }}
            className="text-sm text-muted-foreground"
          >
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span className="font-bold text-primary">{isLogin ? "Sign up" : "Sign in"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

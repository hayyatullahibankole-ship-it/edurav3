import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { emailSchema, passwordSchema, nameSchema, phoneSchema } from "@/utils/inputValidation";
import { generateSessionToken, storeSessionToken, setSessionToken } from "@/utils/sessionManager";
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import eduraLogo from "@/assets/edura-logo.png";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACADEMIC_STAGES, STUDY_LEVELS, isCampusStage } from "@/lib/academicStages";

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required")
});

const signupSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  academicStage: z.string().min(1, "Please select where you are right now"),
  institutionName: z.string().optional(),
  studyLevel: z.string().optional(),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function MobileAuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    // Capture referral code from URL
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
      setIsLogin(false); // Switch to signup if there's a referral code
    }
  }, [searchParams]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    academicStage: '',
    institutionName: '',
    studyLevel: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleHaptic = async () => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast({
        title: "Email required",
        description: "Please enter your email address first",
        variant: "destructive",
      });
      return;
    }

    try {
      await handleHaptic();
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a password reset link",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    await handleHaptic();

    try {
      if (isLogin) {
        const loginData = loginSchema.parse({
          email: formData.email,
          password: formData.password
        });

        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginData.email,
          password: loginData.password
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password');
          }
          if ((error as any)?.code === 'email_not_confirmed' || error.message.includes('Email not confirmed')) {
            throw new Error('Please verify your email first. Check your inbox for the verification link.');
          }
          throw error;
        }

        // Note: Avoid checking `data.user.email_confirmed_at` here; it may be omitted in the response.

        if (data.user) {
          if (await needsMfaChallenge()) {
            setMfaOpen(true);
            return;
          }
          const newSessionToken = generateSessionToken();
          storeSessionToken(newSessionToken);
          await setSessionToken(data.user.id, newSessionToken);

          toast({
            title: "Welcome back!",
            description: "Login successful",
          });
        }
      } else {
        const signupData = signupSchema.parse(formData);

        const { data: signUpData, error } = await supabase.auth.signUp({
          email: signupData.email,
          password: signupData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              first_name: signupData.firstName,
              last_name: signupData.lastName,
              phone: signupData.phone,
              academic_stage: signupData.academicStage,
              institution_name: signupData.institutionName,
              study_level: signupData.studyLevel,
            }
          }
        });

        if (error) {
          if (error.message.includes('User already registered')) {
            throw new Error('Email already registered. Please sign in.');
          }
          throw error;
        }

        // Don't auto-login - wait for email verification
        if (signUpData.user) {
          // Store referral code for processing after verification
          if (referralCode) {
            try {
              localStorage.setItem('pending_referral', JSON.stringify({
                code: referralCode,
                userId: signUpData.user.id,
                email: signupData.email
              }));
            } catch (refError) {
              console.error('Referral storage error:', refError);
            }
          }
        }

        toast({
          title: "Account created! 🎉",
          description: "Check your email to verify your account",
          duration: 8000,
        });

        // Clear form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          academicStage: '',
          institutionName: '',
          studyLevel: '',
          password: '',
          confirmPassword: ''
        });

        setIsLogin(true);
      }
    } catch (error: any) {
      if (error.issues) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((issue: any) => {
          newErrors[issue.path[0]] = issue.message;
        });
        setErrors(newErrors);
      } else {
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary/10 flex flex-col relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Vibrant Hero Section */}
      <div className="relative h-[40vh] bg-primary overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-primary-glow/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />
        
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-5 shadow-2xl mb-5 border-2 border-white/30 animate-scale-in">
            <img src={eduraLogo} alt="Edura" className="h-14 w-auto drop-shadow-2xl" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2 drop-shadow-lg animate-fade-in">
            {isLogin ? 'Welcome Back! 👋' : 'Join EduRa! 🚀'}
          </h1>
          <p className="text-white/95 text-base font-semibold drop-shadow-md animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {isLogin ? 'Continue your learning journey' : 'Start your path to success'}
          </p>
        </div>
      </div>

      {/* Modern Form Section */}
      <div className="relative flex-1 bg-background px-6 pt-8 pb-8 -mt-8 rounded-t-[2rem] shadow-2xl z-20 animate-slide-up">
        {referralCode && !isLogin && (
          <div className="bg-success/20 border-2 border-success/30 rounded-2xl p-4 text-sm mb-6 shadow-lg animate-fade-in">
            <p className="text-success font-bold flex items-center gap-2">
              🎉 Referral code: <span className="font-black">{referralCode}</span>
            </p>
            <p className="text-foreground/70 mt-1 text-xs font-medium">Earn bonus points when you sign up!</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="phone" className="text-sm font-bold text-foreground/80">Phone Number</Label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="08012345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`h-12 rounded-xl border-2 transition-all ${errors.phone ? 'border-destructive' : 'border-border hover:border-primary focus:border-primary'}`}
                />
              </div>
              {errors.phone ? (
                <p className="text-xs text-destructive font-medium">{errors.phone}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Use 08012345678 or +2348012345678</p>
              )}

            </div>
          )}

          {!isLogin && (
            <div className="grid grid-cols-2 gap-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-bold text-foreground/80">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={`pl-10 h-12 rounded-xl border-2 transition-all ${errors.firstName ? 'border-destructive' : 'border-border hover:border-primary focus:border-primary'}`}
                  />
                </div>
                {errors.firstName && <p className="text-xs text-destructive font-medium">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-bold text-foreground/80">Last Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={`pl-10 h-12 rounded-xl border-2 transition-all ${errors.lastName ? 'border-destructive' : 'border-border hover:border-primary focus:border-primary'}`}
                  />
                </div>
                {errors.lastName && <p className="text-xs text-destructive font-medium">{errors.lastName}</p>}
              </div>
            </div>
          )}

          {!isLogin && (
            <div className="space-y-2 animate-fade-in">
              <Label className="text-sm font-bold text-foreground/80">Where are you right now?</Label>
              <Select
                value={formData.academicStage}
                onValueChange={(value) => setFormData({ ...formData, academicStage: value })}
              >
                <SelectTrigger className={`h-14 rounded-xl border-2 ${errors.academicStage ? 'border-destructive' : 'border-border'}`}>
                  <SelectValue placeholder="Select your stage" />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMIC_STAGES.map((s) => (
                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.academicStage && <p className="text-xs text-destructive font-medium">{errors.academicStage}</p>}
              {isCampusStage(formData.academicStage) && (
                <div className="space-y-2 pt-2">
                  <Input
                    placeholder="Institution name"
                    value={formData.institutionName}
                    onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                    className="h-14 rounded-xl border-2"
                  />
                  <Select
                    value={formData.studyLevel}
                    onValueChange={(value) => setFormData({ ...formData, studyLevel: value })}
                  >
                    <SelectTrigger className="h-14 rounded-xl border-2">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDY_LEVELS.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-bold text-foreground/80">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                className={`pl-12 h-14 rounded-xl text-base border-2 transition-all ${errors.email ? 'border-destructive' : 'border-border hover:border-primary focus:border-primary'}`}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive font-medium">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-bold text-foreground/80">Password</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={isLogin ? "Enter password" : "Create password"}
                className={`pl-12 pr-12 h-14 rounded-xl text-base border-2 transition-all ${errors.password ? 'border-destructive' : 'border-border hover:border-primary focus:border-primary'}`}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:text-primary-hover transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive font-medium">{errors.password}</p>}
          </div>

          {isLogin && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm font-semibold text-primary hover:text-primary-glow transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {!isLogin && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="confirmPassword" className="text-sm font-bold text-foreground/80">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  className={`pl-12 h-14 rounded-xl text-base border-2 transition-all ${errors.confirmPassword ? 'border-destructive' : 'border-border hover:border-primary focus:border-primary'}`}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive font-medium">{errors.confirmPassword}</p>}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 text-lg font-black rounded-2xl shadow-2xl bg-primary hover:opacity-90 hover:scale-105 active:scale-95 transition-all mt-8 border-0"
            style={{ boxShadow: '0 15px 40px rgba(0, 123, 255, 0.4)' }}
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="h-6 w-6" />
              </div>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={async () => {
              await handleHaptic();
              setIsLogin(!isLogin);
              setErrors({});
            }}
            className="text-base text-foreground/70 font-medium"
          >
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span className="text-primary font-black text-lg">
              {isLogin ? 'Sign Up' : 'Sign In'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

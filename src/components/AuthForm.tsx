import MfaChallenge, { needsMfaChallenge } from '@/components/security/MfaChallenge';
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Phone,
  GraduationCap,
  BookOpen
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { emailSchema, passwordSchema, nameSchema, phoneSchema } from "@/utils/inputValidation";
import eduraLogo from "@/assets/edura-logo.png";
import EmailOtpVerify from "@/components/auth/EmailOtpVerify";
import { generateSessionToken, storeSessionToken, setSessionToken } from "@/utils/sessionManager";
import { ACADEMIC_STAGES, STUDY_LEVELS, isCampusStage } from "@/lib/academicStages";

// Enhanced validation schemas for security
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required") // Don't validate length on login
});

const signupSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  academicStage: z.string().min(1, "Please select where you are right now"),
  examType: z.string().optional(),
  currentClass: z.string().optional(),
  institutionName: z.string().optional(),
  studyLevel: z.string().optional(),
  password: passwordSchema,
  confirmPassword: z.string(),
  agreedToTerms: z.boolean().refine(val => val === true, "You must agree to the terms")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => isCampusStage(data.academicStage) || !!data.examType, {
  message: "Please select an exam type",
  path: ["examType"],
}).refine((data) => !isCampusStage(data.academicStage) || !!data.institutionName?.trim(), {
  message: "Please enter your institution",
  path: ["institutionName"],
});

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [pendingOtpEmail, setPendingOtpEmail] = useState<string | null>(null);

  useEffect(() => {
    // Capture referral code from URL
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
      setIsLogin(false); // Switch to signup if there's a referral code
    }
  }, [searchParams]);
  useEffect(() => {
    const preferred = localStorage.getItem("preferredJourney");
    if (preferred && !formData.academicStage) {
      setFormData(prev => ({
        ...prev,
        academicStage: preferred === "campus" ? "undergraduate" : "jamb_candidate",
        examType: preferred === "candidate" ? "JAMB" : prev.examType
      }));
    }
  }, []);


  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    academicStage: '',
    examType: '',
    currentClass: '',
    institutionName: '',
    studyLevel: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mfaOpen, setMfaOpen] = useState(false);

  const examTypes = [
    { value: "JAMB", label: "JAMB (Joint Admissions and Matriculation Board)" },
    { value: "WAEC", label: "WAEC (West African Examinations Council)" },
    { value: "NECO", label: "NECO (National Examinations Council)" },
    { value: "GCE", label: "GCE (General Certificate of Education)" }
  ];

  const currentClasses = [
    { value: "SS1", label: "SS1 (Senior Secondary 1)" },
    { value: "SS2", label: "SS2 (Senior Secondary 2)" },
    { value: "SS3", label: "SS3 (Senior Secondary 3)" },
    { value: "Graduate", label: "Graduate" },
    { value: "Other", label: "Other" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Check if account is locked
      const { data: isLocked } = await supabase.rpc('is_account_locked', {
        user_email: formData.email
      });

      if (isLocked) {
        setErrors({ 
          general: 'Account temporarily locked due to multiple failed login attempts. Please try again in 15 minutes or reset your password.' 
        });
        toast({
          title: 'Account Locked',
          description: 'Too many failed login attempts. Please try again later.',
          variant: 'destructive',
        });
        return;
      }

      // Optional rate limit check (non-blocking if unavailable)
      let rateLimited = false;
      try {
        const { data: rateLimitResult } = await supabase.rpc('check_auth_rate_limit');
        const allowed = typeof rateLimitResult === 'boolean' 
          ? rateLimitResult 
          : (rateLimitResult as any)?.allowed;
        if (allowed === false) {
          rateLimited = true;
        }
      } catch (e) {
        // If the RPC is missing or errors out, do not block login
      }
      if (rateLimited) {
        setErrors({ general: 'Too many authentication attempts. Please try again in 15 minutes.' });
        toast({
          title: 'Rate limit hit',
          description: 'Please wait 15 minutes before trying again.',
          variant: 'destructive',
        });
        return;
      }

      if (isLogin) {
        // Validate login form
        const loginData = loginSchema.parse({
          email: formData.email,
          password: formData.password
        });

        const email = loginData.email.trim().toLowerCase();

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: loginData.password
        });

        // Record login attempt (non-blocking)
        try {
          await supabase.rpc('record_login_attempt', {
            user_email: loginData.email,
            attempt_success: !error
          });
        } catch (recordError) {
          console.warn('Failed to record login attempt:', recordError);
        }

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password. Please check your credentials and try again.');
          }
          // Supabase returns code "email_not_confirmed" when confirmation is required
          if ((error as any)?.code === 'email_not_confirmed' || error.message.includes('Email not confirmed')) {
            throw new Error('Please verify your email address first. Check your inbox for the verification link we sent you.');
          }
          throw error;
        }

        // Note: Avoid client-side checks like `data.user.email_confirmed_at` here.
        // Supabase may omit that field from the sign-in response, which can cause false negatives.
        // If sign-in succeeds, we treat the user as allowed to proceed.

        if (data.user) {
          // Accounts with an authenticator app must clear the second step first
          if (await needsMfaChallenge()) {
            setMfaOpen(true);
            return;
          }

          // Generate and store new session token (invalidates other sessions)
          const newSessionToken = generateSessionToken();
          storeSessionToken(newSessionToken);
          
          // Update session token in database
          const tokenSet = await setSessionToken(data.user.id, newSessionToken);
          
          if (!tokenSet) {
            console.error('Failed to set session token');
          }

          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
          });

          // Let the Auth page handle redirect based on role

        }
      } else {
        // Validate signup form
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
              exam_type: signupData.examType,
              current_class: signupData.currentClass,
              academic_stage: signupData.academicStage,
              institution_name: signupData.institutionName,
              study_level: signupData.studyLevel
            }
          }
        });

        if (error) {
          if (error.message.includes('User already registered')) {
            throw new Error('This email is already registered. Please sign in instead.');
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Please check your email and confirm your account before signing in.');
          }
          throw new Error(`Account creation failed: ${error.message}`);
        }

        // Don't auto-login - wait for email verification
        if (signUpData.user) {
          // Send welcome email (only if signup succeeded)
          try {
            await supabase.functions.invoke('send-welcome-email', {
              body: {
                userId: signUpData.user.id,
                email: signupData.email,
                firstName: signupData.firstName,
                lastName: signupData.lastName
              }
            });
          } catch (emailError) {
            console.error('Welcome email error:', emailError);
            // Don't block signup if email fails
          }

          // Store referral code for processing after verification
          if (referralCode) {
            try {
              // Store referral code in local storage to process after email verification
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
          title: "Account created",
          description: "Enter the 6-digit code we sent to your email to verify your account.",
          duration: 8000,
        });

        setPendingOtpEmail(signupData.email);
        return;

      }
    } catch (error: any) {
      if (error.issues) {
        // Zod validation errors
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

  const handleForgotPassword = () => {
    const email = formData.email?.trim();
    navigate(`/reset-password${email ? `?email=${encodeURIComponent(email)}` : ""}`);
  };


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <MfaChallenge
        open={mfaOpen}
        onCancel={() => setMfaOpen(false)}
        onVerified={() => {
          setMfaOpen(false);
          toast({ title: "Welcome back!", description: "You have successfully signed in." });
        }}
      />
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-4">
          <Link to="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={eduraLogo} alt="Edura" className="h-28 w-auto animate-bounce-slow" />
          </Link>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-foreground">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isLogin 
                ? 'Sign in to continue your exam preparation' 
                : 'Join thousands of students achieving their exam goals'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {pendingOtpEmail && (
              <EmailOtpVerify
                email={pendingOtpEmail}
                type="signup"
                onVerified={() => {
                  setPendingOtpEmail(null);
                  navigate('/dashboard', { replace: true });
                }}
                onCancel={() => {
                  setPendingOtpEmail(null);
                  setIsLogin(true);
                }}
              />
            )}
            {!pendingOtpEmail && referralCode && !isLogin && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm">
                <p className="text-primary font-medium">🎉 Referral code applied: {referralCode}</p>
                <p className="text-muted-foreground mt-1">You'll earn bonus points when you sign up!</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className={`space-y-4 ${pendingOtpEmail ? 'hidden' : ''}`}>
              {!isLogin && (
                <>
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
                        First Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="John"
                          className={`pl-10 ${errors.firstName ? 'border-destructive' : ''}`}
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                      </div>
                      {errors.firstName && (
                        <p className="text-xs text-destructive">{errors.firstName}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
                        Last Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Doe"
                          className={`pl-10 ${errors.lastName ? 'border-destructive' : ''}`}
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                      </div>
                      {errors.lastName && (
                        <p className="text-xs text-destructive">{errors.lastName}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              {!isLogin && (
                <>
                  {/* Phone Field */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        placeholder="08012345678"
                        className={`pl-10 ${errors.phone ? 'border-destructive' : ''}`}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    {errors.phone ? (
                      <p className="text-xs text-destructive">{errors.phone}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Use 08012345678 or +2348012345678
                      </p>
                    )}
                  </div>


                  {/* Academic stage */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Where are you right now?</Label>
                    <Select
                      value={formData.academicStage}
                      onValueChange={(value) => setFormData({ ...formData, academicStage: value })}
                    >
                      <SelectTrigger className={errors.academicStage ? 'border-destructive' : ''}>
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
                    {errors.academicStage && (
                      <p className="text-xs text-destructive">{errors.academicStage}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      This decides your dashboard — exam prep and services for candidates, Edura Campus for higher
                      institution students.
                    </p>
                  </div>

                  {isCampusStage(formData.academicStage) ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="institutionName" className="text-sm font-medium text-foreground">
                          Institution
                        </Label>
                        <Input
                          id="institutionName"
                          value={formData.institutionName}
                          onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                          placeholder="University of Ibadan"
                          className={errors.institutionName ? 'border-destructive' : ''}
                        />
                        {errors.institutionName && (
                          <p className="text-xs text-destructive">{errors.institutionName}</p>
                        )}
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label className="text-sm font-medium text-foreground">Level</Label>
                        <Select
                          value={formData.studyLevel}
                          onValueChange={(value) => setFormData({ ...formData, studyLevel: value })}
                        >
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
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="examType" className="text-sm font-medium text-foreground">
                          Exam Type
                        </Label>
                        <Select 
                          value={formData.examType} 
                          onValueChange={(value) => setFormData({ ...formData, examType: value })}
                        >
                          <SelectTrigger className={errors.examType ? 'border-destructive' : ''}>
                            <SelectValue placeholder="Select exam" />
                          </SelectTrigger>
                          <SelectContent>
                            {examTypes.map((exam) => (
                              <SelectItem key={exam.value} value={exam.value}>
                                {exam.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.examType && (
                          <p className="text-xs text-destructive">{errors.examType}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="currentClass" className="text-sm font-medium text-foreground">
                          Current Class
                        </Label>
                        <Select 
                          value={formData.currentClass} 
                          onValueChange={(value) => setFormData({ ...formData, currentClass: value })}
                        >
                          <SelectTrigger className={errors.currentClass ? 'border-destructive' : ''}>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            {currentClasses.map((cls) => (
                              <SelectItem key={cls.value} value={cls.value}>
                                {cls.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.currentClass && (
                          <p className="text-xs text-destructive">{errors.currentClass}</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                    className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              {/* Remember Me / Terms Agreement */}
              <div className="flex items-center justify-between">
                {isLogin ? (
                  <>
                    <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                    />
                      <Label htmlFor="remember" className="text-sm text-muted-foreground">
                        Remember me
                      </Label>
                    </div>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </>
                ) : (
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="terms" 
                      checked={formData.agreedToTerms}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, agreedToTerms: Boolean(checked) })
                      }
                    />
                    <Label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                      I agree to the{' '}
                      <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                      {' '}and{' '}
                      <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                    </Label>
                  </div>
                )}
              </div>
              {errors.agreedToTerms && (
                <p className="text-xs text-destructive">{errors.agreedToTerms}</p>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
              </Button>
            </form>

            {/* Toggle Auth Mode */}
            <div className="text-center space-y-3">
              {isLogin ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsLogin(false);
                      setErrors({});
                      setFormData({
                        firstName: '',
                        lastName: '',
                        email: formData.email, // Keep email when switching
                        phone: '+234',
                        academicStage: '',
                        examType: '',
                        currentClass: '',
                        institutionName: '',
                        studyLevel: '',
                        password: '',
                        confirmPassword: '',
                        agreedToTerms: false
                      });
                    }}
                    className="w-full"
                  >
                    Create Account
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setErrors({});
                      setFormData({
                        firstName: '',
                        lastName: '',
                        email: formData.email, // Keep email when switching
                        phone: '+234',
                        academicStage: '',
                        examType: '',
                        currentClass: '',
                        institutionName: '',
                        studyLevel: '',
                        password: '',
                        confirmPassword: '',
                        agreedToTerms: false
                      });
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                  Sign in instead
                </button>
              </p>
            )}
            
            <div className="mt-4 pt-4 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Are you a school administrator?{' '}
                <Link to="/school-login" className="text-primary hover:underline font-medium">
                  Login as School
                </Link>
              </p>
            </div>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
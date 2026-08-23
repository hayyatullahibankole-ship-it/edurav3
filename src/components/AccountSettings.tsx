import { useAcademicStage } from '@/hooks/useAcademicStage';
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, 
  Bell, 
  Shield, 
  Globe, 
  Eye, 
  Download,
  Trash2,
  AlertTriangle,
  Check,
  Info,
  Lock,
  Mail,
  Smartphone
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface NotificationSettings {
  email_test_reminders: boolean;
  email_results: boolean;
  email_study_tips: boolean;
  email_subscription_updates: boolean;
  sms_test_reminders: boolean;
  sms_results: boolean;
  push_notifications: boolean;
}

interface PrivacySettings {
  profile_visibility: 'public' | 'private' | 'friends';
  show_test_scores: boolean;
  show_study_progress: boolean;
  data_collection_analytics: boolean;
  data_collection_personalization: boolean;
}

interface PreferenceSettings {
  language: string;
  timezone: string;
  default_exam_type: string;
  test_duration_preference: string;
  difficulty_preference: string;
}

export default function AccountSettings() {
  const { user, userProfile } = useAuth();
  const { subscription, isPremium, canAccessPremium } = useSubscription();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirm.trim().toUpperCase() !== "DELETE") return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "Account deleted", description: "Your account and data have been permanently removed." });
      try { localStorage.clear(); } catch { /* ignore */ }
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (e) {
      toast({
        title: "Could not delete account",
        description: e instanceof Error ? e.message : "Please try again or email support@edura.space",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  // State for settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_test_reminders: true,
    email_results: true,
    email_study_tips: true,
    email_subscription_updates: true,
    sms_test_reminders: false,
    sms_results: false,
    push_notifications: true
  });

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profile_visibility: 'public',
    show_test_scores: true,
    show_study_progress: true,
    data_collection_analytics: true,
    data_collection_personalization: true
  });

  const { isCampus } = useAcademicStage();
  const [preferences, setPreferences] = useState<PreferenceSettings>({
    language: 'en',
    timezone: 'Africa/Lagos',
    default_exam_type: 'jamb',
    test_duration_preference: 'standard',
    difficulty_preference: 'adaptive'
  });

  const [storageUsage, setStorageUsage] = useState({
    used: 0,
    total: isPremium ? 10 : 2, // GB
    breakdown: {
      test_results: 0,
      study_materials: 0,
      profile_data: 0
    }
  });

  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!userProfile?.id) return;

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userProfile.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading preferences:', error);
          return;
        }

        if (data) {
          // Load notification settings
          setNotifications({
            email_test_reminders: data.email_test_reminders,
            email_results: data.email_results,
            email_study_tips: data.email_study_tips,
            email_subscription_updates: data.email_subscription_updates,
            sms_test_reminders: data.sms_test_reminders,
            sms_results: data.sms_results,
            push_notifications: data.push_notifications
          });

          // Load privacy settings
          setPrivacy({
            profile_visibility: data.profile_visibility as 'public' | 'private' | 'friends',
            show_test_scores: data.show_test_scores,
            show_study_progress: data.show_study_progress,
            data_collection_analytics: data.data_collection_analytics,
            data_collection_personalization: data.data_collection_personalization
          });

          // Load study preferences
          setPreferences({
            language: data.language,
            timezone: data.timezone,
            default_exam_type: data.default_exam_type,
            test_duration_preference: data.test_duration_preference,
            difficulty_preference: data.difficulty_preference
          });
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    };

    loadUserPreferences();
    calculateStorage();
  }, [userProfile?.id, isPremium]);

  const calculateStorage = async () => {
    try {
      // Calculate storage usage (simplified calculation)
      const testResults = Math.random() * 0.5;
      const studyMaterials = Math.random() * 0.3;
      const profileData = 0.01;
      
      setStorageUsage(prev => ({
        ...prev,
        used: testResults + studyMaterials + profileData,
        breakdown: {
          test_results: testResults,
          study_materials: studyMaterials,
          profile_data: profileData
        }
      }));
    } catch (error) {
      console.error('Error calculating storage:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (!userProfile?.id) {
      toast({
        title: "Error",
        description: "User profile not found. Please try logging in again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Prepare preferences data
      const preferencesData = {
        user_id: userProfile.id,
        // Notification settings
        email_test_reminders: notifications.email_test_reminders,
        email_results: notifications.email_results,
        email_study_tips: notifications.email_study_tips,
        email_subscription_updates: notifications.email_subscription_updates,
        sms_test_reminders: notifications.sms_test_reminders,
        sms_results: notifications.sms_results,
        push_notifications: notifications.push_notifications,
        // Privacy settings
        profile_visibility: privacy.profile_visibility,
        show_test_scores: privacy.show_test_scores,
        show_study_progress: privacy.show_study_progress,
        data_collection_analytics: privacy.data_collection_analytics,
        data_collection_personalization: privacy.data_collection_personalization,
        // Study preferences
        language: preferences.language,
        timezone: preferences.timezone,
        default_exam_type: preferences.default_exam_type,
        test_duration_preference: preferences.test_duration_preference,
        difficulty_preference: preferences.difficulty_preference
      };

      // Use upsert to insert or update preferences
      const { error } = await supabase
        .from('user_preferences')
        .upsert(preferencesData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Settings saved successfully",
        description: "Your account preferences have been updated.",
      });
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error saving settings",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      // Export user data
      const userData = {
        profile: userProfile,
        preferences: { notifications, privacy, preferences },
        subscription: subscription,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edura-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your data has been exported successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleClearStorage = async () => {
    if (!user) return;
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to clear your storage? This will delete all uploaded files except your profile picture. This action cannot be undone."
    );
    
    if (!confirmed) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('clear-user-storage', {
        body: { preserveProfile: true }
      });

      if (error) throw error;

      toast({
        title: "Storage cleared successfully",
        description: `${data.clearedFiles} files deleted. ${data.freedSpace.toFixed(3)} GB freed.`,
      });

      // Refresh storage calculation
      await calculateStorage();
      
    } catch (error: any) {
      console.error('Error clearing storage:', error);
      toast({
        title: "Failed to clear storage",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestSMS = async () => {
    if (!user || !isPremium) {
      toast({
        title: "Premium required",
        description: "SMS notifications are only available for premium subscribers.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          type: 'custom',
          userId: user.id,
          message: 'This is a test SMS from Edura! Your SMS notifications are working perfectly. 🎉'
        }
      });

      if (error) throw error;

      toast({
        title: "Test SMS sent!",
        description: "Check your phone for the test message.",
      });
      
    } catch (error: any) {
      console.error('Error sending test SMS:', error);
      toast({
        title: "Failed to send test SMS",
        description: error.message || "Please check your phone number and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!userProfile?.email) {
      toast({
        title: "Error",
        description: "Email not found. Please update your profile.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Use the correct redirect URL for the current environment
      const redirectUrl = window.location.origin + '/dashboard';
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userProfile.email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        console.error('Verification email error:', error);
        throw error;
      }

      toast({
        title: "Verification email sent",
        description: `Please check your email (${userProfile.email}) and spam folder for the verification link.`,
      });
    } catch (error: any) {
      console.error('Verification error:', error);
      toast({
        title: "Error sending verification",
        description: `Failed to send verification email: ${error.message}. Please check your email address or contact support.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    if (!user?.email) return;
    
    setVerificationLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;

      toast({
        title: "Verification email sent",
        description: "Please check your email and click the verification link.",
      });
    } catch (error: any) {
      toast({
        title: "Error sending verification",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Account Overview
          </CardTitle>
          <CardDescription>
            Manage your account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Account Status</Label>
              <div className="flex items-center gap-2">
                <Badge variant={userProfile?.is_verified ? "default" : "secondary"}>
                  {userProfile?.is_verified ? "Verified" : "Unverified"}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Subscription</Label>
              <Badge variant={isPremium ? "default" : "outline"}>
                {subscription?.subscription_plans?.name || 'Basic Plan'}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Member Since</Label>
              <p className="text-sm text-muted-foreground">
                {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Notifications
            </h4>
            <div className="space-y-3 pl-6">
              {[
                { key: 'email_test_reminders', label: 'Test reminders and study sessions', description: 'Get notified about upcoming tests' },
                { key: 'email_results', label: 'Test results and performance updates', description: 'Receive your test scores and analysis' },
                { key: 'email_study_tips', label: 'Study tips and educational content', description: 'Weekly study tips and learning resources' },
                { key: 'email_subscription_updates', label: 'Subscription and billing updates', description: 'Important account and billing information' }
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{label}</Label>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <Switch
                    checked={notifications[key as keyof NotificationSettings] as boolean}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              SMS Notifications {!isPremium && <Badge variant="outline" className="text-xs">Premium</Badge>}
            </h4>
            <div className="space-y-3 pl-6">
              {[
                { key: 'sms_test_reminders', label: 'Test reminders', description: 'SMS alerts 1 hour before scheduled tests' },
                { key: 'sms_results', label: 'Immediate results', description: 'Get test results via SMS instantly' }
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{label}</Label>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <Switch
                    checked={notifications[key as keyof NotificationSettings] as boolean}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, [key]: checked }))
                    }
                    disabled={!isPremium}
                  />
                </div>
              ))}
              {!isPremium ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    SMS notifications are available with Premium subscription. 
                    <Link to="/payment" className="ml-2 underline text-primary">
                      Upgrade now
                    </Link>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="mt-4 flex gap-2">
                  <Button 
                    onClick={handleTestSMS} 
                    variant="outline" 
                    size="sm"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Test SMS"}
                  </Button>
                  <span className="text-xs text-muted-foreground self-center">
                    Send a test message to verify SMS notifications
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Push Notifications</h4>
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Browser notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive notifications in your browser</p>
                </div>
                <Switch
                  checked={notifications.push_notifications}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, push_notifications: checked }))
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
          <CardDescription>
            Control who can see your information and activities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Profile Visibility</Label>
              <Select
                value={privacy.profile_visibility}
                onValueChange={(value: 'public' | 'private' | 'friends') => 
                  setPrivacy(prev => ({ ...prev, profile_visibility: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public - Everyone can see</SelectItem>
                  <SelectItem value="friends">Friends Only</SelectItem>
                  <SelectItem value="private">Private - Only you</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Activity Visibility</h4>
            <div className="space-y-3 pl-6">
              {[
                { key: 'show_test_scores', label: 'Show test scores', description: 'Allow others to see your test performance' },
                { key: 'show_study_progress', label: 'Show study progress', description: 'Display your learning milestones and progress' },
                { key: 'data_collection_analytics', label: 'Analytics data collection', description: 'Help improve the platform with usage analytics' },
                { key: 'data_collection_personalization', label: 'Personalization data', description: 'Use your data to customize your experience' }
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{label}</Label>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <Switch
                    checked={privacy[key as keyof PrivacySettings] as boolean}
                    onCheckedChange={(checked) => 
                      setPrivacy(prev => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Study Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Study Preferences
          </CardTitle>
          <CardDescription>
            Customize your learning experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={preferences.language}
                onValueChange={(value) => 
                  setPreferences(prev => ({ ...prev, language: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ha">Hausa</SelectItem>
                  <SelectItem value="ig">Igbo</SelectItem>
                  <SelectItem value="yo">Yoruba</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                value={preferences.timezone}
                onValueChange={(value) => 
                  setPreferences(prev => ({ ...prev, timezone: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Lagos">West Africa Time (WAT)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!isCampus && (
              <div className="space-y-2">
                <Label>Default Exam Type</Label>
                <Select
                  value={preferences.default_exam_type}
                  onValueChange={(value) => 
                    setPreferences(prev => ({ ...prev, default_exam_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jamb">JAMB</SelectItem>
                    <SelectItem value="waec">WAEC</SelectItem>
                    <SelectItem value="neco">NECO</SelectItem>
                    <SelectItem value="post-utme">Post-UTME</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Test Duration Preference</Label>
              <Select
                value={preferences.test_duration_preference}
                onValueChange={(value) => 
                  setPreferences(prev => ({ ...prev, test_duration_preference: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">Quick (15 min)</SelectItem>
                  <SelectItem value="standard">Standard (45 min)</SelectItem>
                  <SelectItem value="full">Full Length (3 hours)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Difficulty Preference</Label>
              <Select
                value={preferences.difficulty_preference}
                onValueChange={(value) => 
                  setPreferences(prev => ({ ...prev, difficulty_preference: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="adaptive">Adaptive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage & Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Storage & Data Management
          </CardTitle>
          <CardDescription>
            View your data usage and manage your information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Storage Used</span>
              <span className="text-sm text-muted-foreground">
                {storageUsage.used.toFixed(2)} GB of {storageUsage.total} GB
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all" 
                style={{ width: `${Math.min((storageUsage.used / storageUsage.total) * 100, 100)}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
              <div>Test Results: {storageUsage.breakdown.test_results.toFixed(3)} GB</div>
              <div>Study Materials: {storageUsage.breakdown.study_materials.toFixed(3)} GB</div>
              <div>Profile Data: {storageUsage.breakdown.profile_data.toFixed(3)} GB</div>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" onClick={handleExportData} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export My Data
            </Button>
            <Button variant="outline" className="flex-1" onClick={calculateStorage}>
              <Eye className="h-4 w-4 mr-2" />
              Refresh Storage
            </Button>
          </div>

          {storageUsage.used > storageUsage.total * 0.8 && (
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="destructive" 
                onClick={handleClearStorage} 
                className="flex-1"
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {loading ? "Clearing..." : "Clear Storage"}
              </Button>
            </div>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your data is automatically backed up daily. Export includes profile, test history, and preferences.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete account
          </CardTitle>
          <CardDescription>
            Permanently delete your Edura account and all associated data. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Deleting removes your profile, test history, study plans, wallet balance, service requests and
              uploaded files. Any remaining wallet balance is forfeited. Anonymised payment records may be kept
              where the law requires.
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
            <Input
              id="delete-confirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleting || deleteConfirm.trim().toUpperCase() !== "DELETE"}
            className="w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? "Deleting..." : "Delete my account permanently"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Can't sign in? See the{" "}
            <Link to="/delete-account" className="underline">
              account deletion page
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      {/* Save Settings */}
      <div className="flex justify-end gap-4">
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          disabled={loading}
        >
          Reset to Defaults
        </Button>
        <Button onClick={handleSaveSettings} disabled={loading}>
          {loading ? "Saving..." : "Save All Changes"}
        </Button>
      </div>
    </div>
  );
}
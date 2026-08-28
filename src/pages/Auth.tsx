import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AuthForm from '@/components/AuthForm';
import MobileAuthForm from '@/components/MobileAuthForm';
import { useInstalledApp } from '@/hooks/useInstalledApp';
import { supabase } from '@/integrations/supabase/client';
import { isSignupInProgress } from '@/lib/signupFlow';

export default function Auth() {
  const { user, loading, isAdmin, isSchoolAdmin, userRole, userProfile } = useAuth();
  const navigate = useNavigate();
  const { isInstalledApp } = useInstalledApp();

  const hasMeaningfulPhone = Boolean(
    typeof userProfile?.phone === 'string' &&
    userProfile.phone.trim() !== '' &&
    userProfile.phone.trim() !== '+234'
  );

  const isProfileComplete = Boolean(
    userProfile?.first_name?.trim() &&
    userProfile?.last_name?.trim() &&
    hasMeaningfulPhone
  );

  useEffect(() => {
    const checkSchoolStatus = async () => {
      // Mid-signup the OTP step creates a session before the password step —
      // stay on the form instead of redirecting.
      if (isSignupInProgress()) return;
      if (user && !loading && userRole !== null) {
        if (isInstalledApp && !isProfileComplete) {
          navigate('/mobile-home', { replace: true });
          return;
        }

        // Process pending referral if exists
        try {
          const pendingReferral = localStorage.getItem('pending_referral');
          if (pendingReferral) {
            const referralData = JSON.parse(pendingReferral);
            
            // Check if this is the user who just verified
            if (referralData.userId === user.id) {
              const { data: userProfile } = await supabase
                .from('users')
                .select('id')
                .eq('auth_user_id', user.id)
                .maybeSingle();

              if (userProfile?.id) {
                const { data: referralProcessed } = await supabase.rpc('process_referral_signup', {
                  new_user_id: userProfile.id,
                  referral_code_param: referralData.code
                });

                if (referralProcessed) {
                  // Show success toast would go here but we're in useEffect
                  console.log('Referral processed successfully');
                }
              }
              
              // Clear the pending referral
              localStorage.removeItem('pending_referral');
            }
          }
        } catch (error) {
          console.error('Error processing pending referral:', error);
          localStorage.removeItem('pending_referral');
        }

        // Redirect based on role
        if (isAdmin) {
          navigate('/admin', { replace: true });
        } else if (isSchoolAdmin) {
          // Check if school has active subscription
          const { data: schoolData } = await supabase
            .from('schools')
            .select('is_active')
            .eq('admin_user_id', userProfile?.id as string)
            .maybeSingle();
          
          if (!schoolData || !schoolData.is_active) {
            // School missing or not active, go complete subscription
            navigate('/school-subscription', { replace: true });
          } else {
            navigate('/school-dashboard', { replace: true });
          }
        } else {
          navigate(isInstalledApp ? '/mobile-home' : '/dashboard', { replace: true });
        }
      }
    };
    
    checkSchoolStatus();
  }, [user, loading, userRole, isAdmin, isSchoolAdmin, navigate, userProfile, isInstalledApp, isProfileComplete]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user && userRole !== null) {
    const redirectTo = isAdmin
      ? "/admin"
      : (isSchoolAdmin ? "/school-dashboard" : (isInstalledApp ? "/mobile-home" : "/dashboard"));
    return <Navigate to={redirectTo} replace />;
  }

  // Show mobile auth form only for installed apps (PWA or native)
  if (isInstalledApp) {
    return <MobileAuthForm />;
  }

  return <AuthForm />;
}
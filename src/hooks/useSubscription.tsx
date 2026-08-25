import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SubscriptionData {
  id: string;
  status: string;
  plan_id: string;
  start_date: string;
  end_date: string | null;
  subscription_plans?: {
    name: string;
    price: number;
    resource_access_level: string;
    features?: any;
  };
  // Free access fields
  isFreeAccess?: boolean;
  freeAccessExpiry?: string | null;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [trialInfo, setTrialInfo] = useState<{ startedAt: string | null; source: string | null; expiry: string | null }>({
    startedAt: null,
    source: null,
    expiry: null,
  });
  const { user, userProfile } = useAuth();


  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        // No user authenticated, clear subscription and stop loading
        setSubscription(null);
        setLoading(false);
        return;
      }

      // Wait for the public.users profile to load (required for all access checks)
      if (!userProfile?.id) {
        setSubscription(null);
        setLoading(true);
        return;
      }

      try {
        setLoading(true);
        
        // First check for free promo / trial access
        const { data: userData } = await supabase
          .from('users')
          .select('free_practice_access, free_access_expiry_date, trial_started_at, trial_source')
          .eq('id', userProfile.id)
          .single();
        
        const hasFreeAccess = userData?.free_practice_access === true;
        const freeAccessExpiry = userData?.free_access_expiry_date;
        const freeAccessValid = hasFreeAccess && freeAccessExpiry && new Date(freeAccessExpiry) >= new Date();
        setTrialInfo({
          startedAt: (userData as any)?.trial_started_at || null,
          source: (userData as any)?.trial_source || null,
          expiry: freeAccessExpiry || null,
        });
        

        
        // Use the new function that checks both school and personal subscriptions
        const { data, error } = await supabase
          .rpc('get_user_effective_subscription', {
            target_user_id: userProfile.id
          });

        if (error) {
          console.error('Error fetching subscription:', error);
          // Check if free access applies
          if (freeAccessValid) {
            setSubscription({
              id: 'free-promo',
              status: 'ACTIVE',
              plan_id: 'free-promo',
              start_date: new Date().toISOString(),
              end_date: freeAccessExpiry,
              subscription_plans: {
                name: 'Complimentary Access',
                price: 0,
                resource_access_level: 'premium',
                features: ['1-month complimentary access', 'All CBT practice content']
              },
              isFreeAccess: true,
              freeAccessExpiry
            });
          } else {
            // Set a basic subscription as fallback
            setSubscription({
              id: 'fallback',
              status: 'ACTIVE',
              plan_id: 'basic',
              start_date: new Date().toISOString(),
              end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              subscription_plans: {
                name: 'Basic Access',
                price: 0,
                resource_access_level: 'basic',
                features: ['Basic practice tests']
              }
            });
          }
        } else if (data && data.length > 0) {
          // Transform the RPC result to match SubscriptionData format
          const effectiveSub = data[0];
          const effectiveAccessLevel = String(effectiveSub.resource_access_level || '').toLowerCase();
          const effectivePlanName = String(effectiveSub.plan_name || '').toLowerCase();
          const effectiveLooksPremium =
            effectiveAccessLevel === 'premium' ||
            effectiveAccessLevel === 'enterprise' ||
            effectivePlanName.includes('premium') ||
            effectivePlanName.includes('enterprise') ||
            (typeof effectiveSub.price === 'number' && effectiveSub.price > 0);

          // If user has a valid promo/free access window, it should upgrade them even if
          // their "effective" subscription is otherwise basic.
          if (freeAccessValid && !effectiveLooksPremium) {
            setSubscription({
              id: 'free-promo',
              status: 'ACTIVE',
              plan_id: 'free-promo',
              start_date: new Date().toISOString(),
              end_date: freeAccessExpiry,
              subscription_plans: {
                name: 'Complimentary Access',
                price: 0,
                resource_access_level: 'premium',
                features: ['1-month complimentary access', 'All CBT practice content'],
              },
              isFreeAccess: true,
              freeAccessExpiry,
            });
            return;
          }

          setSubscription({
            id: effectiveSub.id,
            status: effectiveSub.status,
            plan_id: effectiveSub.plan_id,
            start_date: effectiveSub.start_date,
            end_date: effectiveSub.end_date,
            subscription_plans: {
              name: effectiveSub.plan_name,
              price: effectiveSub.price,
              resource_access_level: effectiveSub.resource_access_level,
              features:
                effectiveSub.source === 'school'
                  ? ['School Premium Access', 'All WAEC, JAMB & NECO questions', 'Unlimited practice tests', 'Detailed analytics']
                  : ['Premium access'],
            },
            isFreeAccess: false,
            freeAccessExpiry: null,
          });
        } else if (freeAccessValid) {
          // No paid subscription but has valid free access
          setSubscription({
            id: 'free-promo',
            status: 'ACTIVE',
            plan_id: 'free-promo',
            start_date: new Date().toISOString(),
            end_date: freeAccessExpiry,
            subscription_plans: {
              name: 'Complimentary Access',
              price: 0,
              resource_access_level: 'premium',
              features: ['1-month complimentary access', 'All CBT practice content']
            },
            isFreeAccess: true,
            freeAccessExpiry
          });
        } else {
          // No subscription found - user has basic/free access
          setSubscription({
            id: 'free',
            status: 'ACTIVE',
            plan_id: 'free',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            subscription_plans: {
              name: 'Free Access',
              price: 0,
              resource_access_level: 'basic',
              features: ['Limited practice tests']
            },
            isFreeAccess: hasFreeAccess,
            freeAccessExpiry: freeAccessExpiry || null
          });
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        // Set fallback subscription on error
        setSubscription({
          id: 'fallback',
          status: 'ACTIVE', 
          plan_id: 'basic',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          subscription_plans: {
            name: 'Basic Access',
            price: 0,
            resource_access_level: 'basic',
            features: ['Basic practice tests']
          }
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSubscription();
  }, [user?.id, userProfile?.id]);

  // Normalize subscription state - fix the premium detection logic
  const active = subscription?.status === 'ACTIVE';
  const notExpired = subscription?.end_date ? new Date(subscription.end_date) > new Date() : true;
  const accessLevel = subscription?.subscription_plans?.resource_access_level?.toLowerCase();
  const planName = (subscription?.subscription_plans?.name || '').toLowerCase();
  
  // Free promo access check
  const hasFreePromoAccess = subscription?.isFreeAccess === true && 
    subscription?.freeAccessExpiry && 
    new Date(subscription.freeAccessExpiry) >= new Date();
  const freeAccessExpired = subscription?.isFreeAccess === true && 
    subscription?.freeAccessExpiry && 
    new Date(subscription.freeAccessExpiry) < new Date();

  // User has any active (non-expired) subscription
  const hasPremiumAccess = Boolean(!loading && active && notExpired);
  
  // User is premium if access level is premium OR plan name contains premium OR has paid subscription OR has free promo access
  const isPremium = Boolean(
    !loading && active && notExpired && (
      accessLevel === 'premium' || 
      planName.includes('premium') ||
      planName.includes('complimentary') ||
      hasFreePromoAccess ||
      (subscription?.subscription_plans?.price && subscription.subscription_plans.price > 0)
    )
  );
  
  // User is enterprise if access level is enterprise OR plan name contains enterprise
  const isEnterprise = Boolean(
    hasPremiumAccess && (
      accessLevel === 'enterprise' || 
      planName.includes('enterprise')
    )
  );
  
  // User can access premium content (premium or enterprise or free promo)
  const canAccessPremium = Boolean(isPremium || isEnterprise || hasFreePromoAccess);
  
  // User is on free/basic plan (has access but not premium/enterprise)
  const isFree = Boolean(hasPremiumAccess && accessLevel === 'basic' && !isPremium && !isEnterprise && !hasFreePromoAccess);
  
  if (typeof window !== 'undefined') {
    console.debug('useSubscription', {
      userId: user?.id,
      profileId: userProfile?.id,
      subscription,
      accessLevel,
      active,
      notExpired,
      isPremium: Boolean(isPremium),
      hasFreePromoAccess,
      loading
    });
  }

  // Trial state (signup / backfill granted free window)
  const trialExpiry = trialInfo.expiry ? new Date(trialInfo.expiry) : null;
  const msLeft = trialExpiry ? trialExpiry.getTime() - Date.now() : 0;
  const isOnTrial = Boolean(trialInfo.startedAt && trialExpiry && msLeft >= 0);
  const trialDaysLeft = isOnTrial ? Math.max(0, Math.ceil(msLeft / 86400000)) : 0;
  const trialExpired = Boolean(trialInfo.startedAt && trialExpiry && msLeft < 0);

  return {

    subscription,
    loading,
    hasPremiumAccess: !!hasPremiumAccess,
    isPremium: !!isPremium,
    isEnterprise: !!isEnterprise,
    canAccessPremium: !!canAccessPremium,
    isFree: !!isFree,
    // Free promo access fields
    hasFreePromoAccess: !!hasFreePromoAccess,
    freeAccessExpiry: subscription?.freeAccessExpiry || null,
    freeAccessExpired: !!freeAccessExpired,
  };
}
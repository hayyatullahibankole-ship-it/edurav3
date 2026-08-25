import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Share2, Copy, Users, Gift, TrendingUp, CheckCircle2, ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';

const ReferralProgram = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalRewards: 0,
    pendingRewards: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.id) {
      fetchReferralData();
    }
  }, [userProfile]);

  const fetchReferralData = async () => {
    try {
      setLoading(true);

      const [codeRes, referralsRes, rewardsRes] = await Promise.all([
        supabase
          .from('referral_codes')
          .select('*')
          .eq('user_id', userProfile?.id)
          .single(),

        supabase
          .from('referrals')
          .select(`
            *,
            referred_user:users!referrals_referred_user_id_fkey(first_name, last_name, email)
          `)
          .eq('referrer_id', userProfile?.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('referral_rewards')
          .select('*')
          .eq('user_id', userProfile?.id)
          .order('created_at', { ascending: false }),
      ]);

      if (codeRes.data) {
        setReferralCode(codeRes.data.code);
      }

      if (referralsRes.data) {
        setReferrals(referralsRes.data);
        
        const active = referralsRes.data.filter(r => r.status === 'active').length;
        setStats(prev => ({
          ...prev,
          totalReferrals: referralsRes.data.length,
          activeReferrals: active,
        }));
      }

      if (rewardsRes.data) {
        setRewards(rewardsRes.data);
        
        const total = rewardsRes.data
          .filter(r => r.claimed)
          .reduce((sum, r) => sum + r.reward_value, 0);
        
        const pending = rewardsRes.data
          .filter(r => !r.claimed)
          .reduce((sum, r) => sum + r.reward_value, 0);

        setStats(prev => ({
          ...prev,
          totalRewards: total,
          pendingRewards: pending,
        }));
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/auth?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link Copied!',
      description: 'Referral link copied to clipboard.',
    });
  };

  const shareReferral = async () => {
    const link = `${window.location.origin}/auth?ref=${referralCode}`;
    const text = `Join Edura CBT and ace your exams! Use my referral code: ${referralCode}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Edura CBT',
          text,
          url: link,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      copyReferralLink();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: 'default',
      active: 'secondary',
      completed: 'outline',
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Layout showNavbar={false} showMobileNav={false}>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
          {/* Back Navigation */}
          <div className="flex items-center gap-2 mb-4">
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          {/* Header */}
          <div className="mb-6 sm:mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-primary">
              Referral Program
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Invite friends and earn rewards for every successful referral!
            </p>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 stagger-animation">
          {/* Total Referrals */}
          <div className="group relative overflow-hidden rounded-2xl bg-primary/10 backdrop-blur-sm border border-primary/10 p-4 sm:p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/20 active:scale-95">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 text-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats.totalReferrals}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Total Referrals</p>
            </div>
          </div>

          {/* Active Referrals */}
          <div className="group relative overflow-hidden rounded-2xl bg-green-500/10 backdrop-blur-sm border border-green-500/10 p-4 sm:p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/20 active:scale-95">
            <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 text-center">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats.activeReferrals}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Active</p>
            </div>
          </div>

          {/* Points Earned */}
          <div className="group relative overflow-hidden rounded-2xl bg-amber-500/10 backdrop-blur-sm border border-amber-500/10 p-4 sm:p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-amber-500/20 active:scale-95">
            <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 text-center">
              <Gift className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-amber-500" />
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats.totalRewards}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Points Earned</p>
            </div>
          </div>

          {/* Pending */}
          <div className="group relative overflow-hidden rounded-2xl bg-blue-500/10 backdrop-blur-sm border border-blue-500/10 p-4 sm:p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 active:scale-95">
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 text-center">
              <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats.pendingRewards}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Pending</p>
            </div>
          </div>
        </div>

        {/* Referral Link Card */}
        <div className="relative overflow-hidden rounded-3xl bg-primary/10 backdrop-blur-sm border border-primary/20 p-4 sm:p-6 mb-6 sm:mb-8 animate-fade-in shadow-xl">
          <div className="absolute inset-0 bg-primary/5 opacity-50" />
          
          <div className="relative z-10">
            <h2 className="text-xl sm:text-2xl font-bold mb-1">Your Referral Link</h2>
            <p className="text-sm text-muted-foreground mb-4">Share this link to invite friends</p>
            
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <Input
                value={`${window.location.origin}/auth?ref=${referralCode}`}
                readOnly
                className="flex-1 bg-background/50 backdrop-blur-sm border-primary/20"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={copyReferralLink}
                  className="flex-1 sm:flex-none bg-primary hover:from-primary/90 hover:to-primary/70 transition-all duration-300"
                >
                  <Copy className="h-4 w-4 sm:mr-2" />
                  {!isMobile && 'Copy'}
                </Button>
                <Button 
                  onClick={shareReferral} 
                  variant="outline"
                  className="flex-1 sm:flex-none border-primary/30 hover:bg-primary/10 transition-all duration-300"
                >
                  <Share2 className="h-4 w-4 sm:mr-2" />
                  {!isMobile && 'Share'}
                </Button>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-primary/5 backdrop-blur-sm border border-primary/10 p-4">
              <p className="font-semibold mb-3 text-sm sm:text-base">How it works:</p>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3 group">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">Share your unique referral link with friends</span>
                </li>
                <li className="flex items-start gap-3 group">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">They sign up using your link</span>
                </li>
                <li className="flex items-start gap-3 group">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">You both earn rewards when they subscribe!</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Referrals and Rewards Grid */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 stagger-animation">
          {/* Referrals List */}
          <div className="relative overflow-hidden rounded-3xl bg-background backdrop-blur-sm border border-primary/10 shadow-xl">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold">Your Referrals</h2>
                <Badge variant="secondary" className="text-xs sm:text-sm">{referrals.length}</Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">People who joined using your link</p>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  <p className="text-muted-foreground mt-2 text-sm">Loading...</p>
                </div>
              ) : referrals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-primary/50" />
                  </div>
                  <p className="font-medium mb-1">No referrals yet</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Start sharing your link!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {referrals.map((referral, index) => (
                    <div 
                      key={referral.id} 
                      className="group relative overflow-hidden rounded-2xl bg-primary/5 backdrop-blur-sm border border-primary/10 p-3 sm:p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-primary/20"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm sm:text-base truncate flex-1 mr-2">
                          {referral.referred_user?.first_name || 'User'} {referral.referred_user?.last_name || ''}
                        </p>
                        {getStatusBadge(referral.status)}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                        <p>Joined: {new Date(referral.created_at).toLocaleDateString()}</p>
                        {referral.reward_points > 0 && (
                          <p className="text-green-500 font-medium">+{referral.reward_points} points</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Rewards */}
          <div className="relative overflow-hidden rounded-3xl bg-background backdrop-blur-sm border border-amber-500/10 shadow-xl">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold">Rewards</h2>
                <Badge variant="secondary" className="text-xs sm:text-sm">{rewards.length}</Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">Your referral rewards</p>
              
              {rewards.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                    <Gift className="h-8 w-8 text-amber-500/50" />
                  </div>
                  <p className="font-medium mb-1">No rewards yet</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Refer friends to earn rewards!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {rewards.map((reward, index) => (
                    <div 
                      key={reward.id} 
                      className="group relative overflow-hidden rounded-2xl bg-amber-500/5 backdrop-blur-sm border border-amber-500/10 p-3 sm:p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-amber-500/20"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                          <Gift className="h-4 w-4 text-amber-500 flex-shrink-0" />
                          <p className="font-medium text-sm sm:text-base truncate">{reward.reward_type}</p>
                        </div>
                        {reward.claimed ? (
                          <Badge variant="secondary" className="text-xs flex-shrink-0">Claimed</Badge>
                        ) : (
                          <Badge className="text-xs flex-shrink-0">Pending</Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">{reward.description}</p>
                      <p className="text-base sm:text-lg font-bold bg-amber-500">
                        +{reward.reward_value} points
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReferralProgram;

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Users, 
  Calendar,
  TrendingUp,
  Package,
  Settings,
  ExternalLink,
  Activity,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Cell, Pie, LineChart, Line } from 'recharts';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  currency: string;
  description: string;
  features: any;
  resource_access_level: string;
  scope?: string;
  tier?: string;
  max_attempts: number;
  is_active: boolean;
  created_at: string;
}

interface SubscriptionData {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  payment_reference: string;
  created_at: string;
  users: {
    first_name: string;
    last_name: string;
    email: string;
  };
  subscription_plans: {
    name: string;
    price: number;
    currency: string;
  };
}

const PricingManager = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedSubscriber, setSelectedSubscriber] = useState<any>(null);
  const [isSubscriberModalOpen, setIsSubscriberModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration_days: '',
    currency: 'NGN',
    description: '',
    features: '',
    resource_access_level: 'basic',
    scope: 'cbt',
    tier: 'premium',
    max_attempts: '',
    is_active: true
  });

  useEffect(() => {
    fetchAllData();
    
    // Set up real-time subscriptions
    const channel = supabase
      .channel('pricing-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscription_plans' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchAllData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calculate analytics whenever data changes
  useEffect(() => {
    if (transactions.length > 0 || subscriptions.length > 0 || plans.length > 0) {
      calculateAnalytics();
    }
  }, [transactions, subscriptions, plans]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('admin-get-billing', { body: {} });
      if (error) throw error;
      setPlans((data as any)?.plans || []);
      setSubscriptions(((data as any)?.subscriptions || []) as any);
      setTransactions(((data as any)?.transactions || []) as any);
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast({ title: 'Error', description: 'Failed to load billing data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to fetch subscription plans",
        variant: "destructive",
      });
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Ensure type compatibility when user relation isn't selected
      const normalized = (data || []).map((s: any) => ({ ...s, users: null }));
      setSubscriptions(normalized as any);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch subscriptions",
        variant: "destructive",
      });
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };
  const calculateAnalytics = () => {
    try {
      console.log('Calculating analytics with', transactions.length, 'transactions');
      const totalRevenue = transactions
        .filter(t => t.status === 'SUCCESS')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE');
      const expiredSubscriptions = subscriptions.filter(s => s.status === 'EXPIRED');
      
      // Revenue by plan
      const revenueByPlan = plans.map(plan => {
        const planRevenue = transactions
          .filter(t => t.subscription_id && subscriptions.find(s => s.id === t.subscription_id)?.plan_id === plan.id)
          .reduce((sum, t) => sum + Number(t.amount), 0);
        return {
          name: plan.name,
          revenue: planRevenue,
          subscribers: subscriptions.filter(s => s.plan_id === plan.id).length
        };
      });

      // Monthly revenue trend (last 6 months)
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
      });

      const monthlyRevenue = months.map(month => {
        const nextMonth = new Date(month);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        const revenue = transactions
          .filter(t => {
            const date = new Date(t.created_at);
            return date >= month && date < nextMonth && t.status === 'SUCCESS';
          })
          .reduce((sum, t) => sum + Number(t.amount), 0);

        return {
          month: month.toLocaleDateString('en-US', { month: 'short' }),
          revenue
        };
      });

      // Real-time revenue tracking
      const liveRevenue = transactions
        .filter(t => {
          const transDate = new Date(t.created_at);
          const today = new Date();
          return transDate.toDateString() === today.toDateString() && t.status === 'SUCCESS';
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Subscription growth rate
      const last30Days = subscriptions.filter(s => {
        const subDate = new Date(s.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return subDate >= thirtyDaysAgo;
      });

      // Churn rate calculation
      const churnRate = expiredSubscriptions.length > 0 
        ? Math.round((expiredSubscriptions.length / subscriptions.length) * 100) 
        : 0;
      setAnalytics({
        totalRevenue,
        liveRevenue,
        activeSubscriptions: activeSubscriptions.length,
        expiredSubscriptions: expiredSubscriptions.length,
        newSubscriptions: last30Days.length,
        conversionRate: subscriptions.length > 0 ? Math.round((activeSubscriptions.length / subscriptions.length) * 100) : 0,
        churnRate,
        revenueByPlan,
        monthlyRevenue,
        averageOrderValue: transactions.length > 0 ? totalRevenue / transactions.filter(t => t.status === 'SUCCESS').length : 0,
        revenueGrowth: monthlyRevenue.length > 1 
          ? Math.round(((monthlyRevenue[monthlyRevenue.length - 1].revenue - monthlyRevenue[monthlyRevenue.length - 2].revenue) / monthlyRevenue[monthlyRevenue.length - 2].revenue) * 100) 
          : 0
      });
    } catch (error) {
      console.error('Error calculating analytics:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const features = formData.features.split('\n').filter(f => f.trim());
      
      const planData = {
        name: formData.name,
        price: parseFloat(formData.price),
        duration_days: parseInt(formData.duration_days),
        currency: formData.currency,
        description: formData.description,
        features: features,
        resource_access_level: formData.resource_access_level,
        scope: formData.scope,
        tier: formData.tier,
        max_attempts: formData.max_attempts ? parseInt(formData.max_attempts) : null,
        is_active: formData.is_active
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', editingPlan.id);
        
        if (error) throw error;
        toast({
          title: "Success",
          description: "Subscription plan updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert([planData]);
        
        if (error) throw error;
        toast({
          title: "Success",
          description: "Subscription plan created successfully",
        });
      }

      fetchAllData();
      setIsCreateModalOpen(false);
      setEditingPlan(null);
      resetForm();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: "Error",
        description: "Failed to save subscription plan",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price.toString(),
      duration_days: plan.duration_days.toString(),
      currency: plan.currency,
      description: plan.description || '',
      features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
      resource_access_level: plan.resource_access_level,
      scope: plan.scope || 'cbt',
      tier: plan.tier || 'premium',
      max_attempts: plan.max_attempts?.toString() || '',
      is_active: plan.is_active
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan? This will also affect existing subscriptions.')) return;

    try {
      // First check if there are active subscriptions using this plan
      const { data: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('plan_id', planId)
        .eq('status', 'ACTIVE');

      if (activeSubscriptions && activeSubscriptions.length > 0) {
        const confirmForce = confirm(`This plan has ${activeSubscriptions.length} active subscriptions. Do you want to deactivate the plan instead of deleting it?`);
        
        if (confirmForce) {
          // Deactivate instead of delete
          const { error } = await supabase
            .from('subscription_plans')
            .update({ is_active: false })
            .eq('id', planId);

          if (error) throw error;
          
          toast({
            title: "Plan Deactivated",
            description: "Plan has been deactivated due to active subscriptions",
          });
        }
        return;
      }

      // If no active subscriptions, proceed with deletion
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Subscription plan deleted successfully",
      });
      fetchAllData();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete subscription plan. It may be referenced by existing subscriptions.",
        variant: "destructive",
      });
    }
  };

  const togglePlanStatus = async (planId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: !isActive })
        .eq('id', planId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Plan ${!isActive ? 'activated' : 'deactivated'} successfully`,
      });
      fetchAllData();
    } catch (error) {
      console.error('Error updating plan status:', error);
      toast({
        title: "Error",
        description: "Failed to update plan status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      duration_days: '',
      currency: 'NGN',
      description: '',
      features: '',
      resource_access_level: 'basic',
      scope: 'cbt',
      tier: 'premium',
      max_attempts: '',
      is_active: true
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-600';
      case 'EXPIRED': return 'bg-red-600';
      case 'TRIAL': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const viewSubscriberDetails = async (subscription: SubscriptionData) => {
    try {
      // Fetch detailed subscriber info
      const { data: userTransactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', subscription.user_id)
        .order('created_at', { ascending: false });

      const { data: userSubscriptions } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (name, price, currency, features)
        `)
        .eq('user_id', subscription.user_id)
        .order('created_at', { ascending: false });

      setSelectedSubscriber({
        ...subscription,
        transactions: userTransactions || [],
        allSubscriptions: userSubscriptions || []
      });
      setIsSubscriberModalOpen(true);
    } catch (error) {
      console.error('Error fetching subscriber details:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Pricing Management</h2>
          <p className="text-slate-400">Manage subscription plans, pricing, and subscriber analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.open('/payment', '_blank')}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Public Payment Page
          </Button>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Create Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
                </DialogTitle>
                <DialogDescription>
                  Configure the subscription plan details and features
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-white">Plan Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Premium Plan"
                      required
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price" className="text-white">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="0.00"
                      required
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="duration" className="text-white">Duration (Days)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration_days}
                      onChange={(e) => setFormData({...formData, duration_days: e.target.value})}
                      placeholder="30"
                      required
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency" className="text-white">Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NGN">NGN (₦)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="access_level" className="text-white">Access Level</Label>
                    <Select value={formData.resource_access_level} onValueChange={(value) => setFormData({...formData, resource_access_level: value})}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Product</Label>
                    <Select value={formData.scope} onValueChange={(value) => setFormData({...formData, scope: value})}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cbt">CBT (JAMB/WAEC)</SelectItem>
                        <SelectItem value="campus">Campus (Higher institution)</SelectItem>
                        <SelectItem value="all">All-Access bundle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white">Tier</Label>
                    <Select value={formData.tier} onValueChange={(value) => setFormData({...formData, tier: value})}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="max_attempts" className="text-white">Max Attempts (Optional)</Label>
                  <Input
                    id="max_attempts"
                    type="number"
                    value={formData.max_attempts}
                    onChange={(e) => setFormData({...formData, max_attempts: e.target.value})}
                    placeholder="Leave empty for unlimited"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-white">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Plan description"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="features" className="text-white">Features (one per line)</Label>
                  <Textarea
                    id="features"
                    value={formData.features}
                    onChange={(e) => setFormData({...formData, features: e.target.value})}
                    placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                    rows={4}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                  />
                  <Label htmlFor="is_active" className="text-white">Active Plan</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setEditingPlan(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Revenue Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Revenue</p>
                <p className="text-2xl font-bold text-green-400">
                  ₦{analytics.totalRevenue?.toLocaleString() || 0}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Subscribers</p>
                <p className="text-2xl font-bold text-blue-400">{analytics.activeSubscriptions || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Plans</p>
                <p className="text-2xl font-bold text-purple-400">{plans.length}</p>
              </div>
              <Package className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Conversion Rate</p>
                <p className="text-2xl font-bold text-orange-400">{analytics.conversionRate || 0}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg. Order Value</p>
                <p className="text-2xl font-bold text-yellow-400">
                  ₦{Math.round(analytics.averageOrderValue || 0).toLocaleString()}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="plans" className="text-white">Plans & Pricing</TabsTrigger>
          <TabsTrigger value="subscribers" className="text-white">Subscribers</TabsTrigger>
          <TabsTrigger value="transactions" className="text-white">Transactions</TabsTrigger>
          <TabsTrigger value="analytics" className="text-white">Revenue Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Subscription Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card key={plan.id} className="bg-slate-700 border-slate-600">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-lg">{plan.name}</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge variant={plan.is_active ? "default" : "secondary"}>
                            {plan.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline" className="text-xs uppercase">
                            {plan.scope || 'cbt'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {plan.resource_access_level}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-3xl font-bold text-primary">
                          {formatCurrency(plan.price, plan.currency)}
                        </span>
                        <span className="text-sm text-slate-400">
                          /{plan.duration_days} days
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-slate-300">{plan.description}</p>
                      
                      <div className="space-y-2">
                        <p className="text-xs text-slate-400 uppercase font-medium">Features</p>
                        {Array.isArray(plan.features) && plan.features.length > 0 ? (
                          <ul className="text-sm text-slate-300 space-y-1">
                            {plan.features.slice(0, 3).map((feature: string, index: number) => (
                              <li key={index} className="flex items-center">
                                <CheckCircle className="w-3 h-3 text-green-400 mr-2 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                            {plan.features.length > 3 && (
                              <li className="text-xs text-slate-500">
                                +{plan.features.length - 3} more features
                              </li>
                            )}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-500">No features listed</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-600">
                        <div className="text-xs text-slate-400">
                          Subscribers: {subscriptions.filter(s => s.plan_id === plan.id).length}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(plan)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(plan.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Subscriber Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-slate-300" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-white">
                            {subscription.users?.first_name && subscription.users?.last_name
                              ? `${subscription.users.first_name} ${subscription.users.last_name}`
                              : 'Subscriber'}
                          </p>
                          <Badge className={getStatusColor(subscription.status)}>
                            {subscription.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400">{subscription.users?.email || 'N/A'}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-slate-500">
                          {(() => { const p = plans.find(pl => pl.id === subscription.plan_id); return (
                            <>
                              <span>Plan: {p?.name || '—'}</span>
                              <span>Amount: {formatCurrency(p?.price || 0, p?.currency || 'NGN')}</span>
                            </>
                          ); })()}
                          <span>Started: {new Date(subscription.start_date).toLocaleDateString()}</span>
                          <span>Expires: {new Date(subscription.end_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => viewSubscriberDetails(subscription)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {subscriptions.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">No subscribers found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        transaction.status === 'SUCCESS' ? 'bg-green-400' :
                        transaction.status === 'PENDING' ? 'bg-yellow-400' :
                        'bg-red-400'
                      }`}></div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-white">
                            {transaction.users?.first_name && transaction.users?.last_name
                              ? `${transaction.users.first_name} ${transaction.users.last_name}`
                              : transaction.metadata?.paystack_data?.customer?.email || 
                                transaction.metadata?.customer_email ||
                                'Unknown User'
                            }
                          </p>
                          <Badge className={
                            transaction.status === 'SUCCESS' ? 'bg-green-600' :
                            transaction.status === 'PENDING' ? 'bg-yellow-600' :
                            'bg-red-600'
                          }>
                            {transaction.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400">
                          {transaction.users?.email || 
                           transaction.metadata?.paystack_data?.customer?.email ||
                           transaction.metadata?.customer_email ||
                           'No email available'}
                        </p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-slate-500">
                          <span>Amount: {formatCurrency(transaction.amount, transaction.currency)}</span>
                          <span>Gateway: {transaction.gateway || 'Paystack'}</span>
                          <span>Date: {new Date(transaction.created_at).toLocaleDateString()}</span>
                          <span>Ref: {transaction.gateway_reference}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(transaction.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {transactions.length === 0 && (
                  <div className="text-center py-12">
                    <CreditCard className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">No transactions found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.monthlyRevenue || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#374151', 
                          border: 'none', 
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Revenue by Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.revenueByPlan || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#374151', 
                          border: 'none', 
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                      <Bar dataKey="revenue" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Subscriber Details Modal */}
      <Dialog open={isSubscriberModalOpen} onOpenChange={setIsSubscriberModalOpen}>
        <DialogContent className="max-w-4xl bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              Subscriber Details - {selectedSubscriber?.users?.first_name} {selectedSubscriber?.users?.last_name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedSubscriber && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Card className="bg-slate-700 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-slate-300">{selectedSubscriber.users?.email}</p>
                    <p className="text-sm text-slate-400">User ID: {selectedSubscriber.user_id}</p>
                    <p className="text-sm text-slate-400">
                      Member since: {new Date(selectedSubscriber.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-700 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Current Subscription</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-slate-300">{selectedSubscriber.subscription_plans?.name}</p>
                    <p className="text-sm text-slate-400">
                      {formatCurrency(selectedSubscriber.subscription_plans?.price || 0, selectedSubscriber.subscription_plans?.currency || 'NGN')}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(selectedSubscriber.status)}>
                        {selectedSubscriber.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="subscriptions" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                  <TabsTrigger value="subscriptions">All Subscriptions</TabsTrigger>
                  <TabsTrigger value="transactions">Transaction History</TabsTrigger>
                </TabsList>

                <TabsContent value="subscriptions" className="space-y-4">
                  {selectedSubscriber.allSubscriptions?.map((sub: any) => (
                    <Card key={sub.id} className="bg-slate-700 border-slate-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{sub.subscription_plans?.name}</p>
                            <p className="text-sm text-slate-400">
                              {new Date(sub.start_date).toLocaleDateString()} - {new Date(sub.end_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(sub.status)}>{sub.status}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                  {selectedSubscriber.transactions?.map((tx: any) => (
                    <Card key={tx.id} className="bg-slate-700 border-slate-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">
                              {formatCurrency(tx.amount, tx.currency)}
                            </p>
                            <p className="text-sm text-slate-400">
                              {new Date(tx.created_at).toLocaleDateString()} - {tx.gateway_reference}
                            </p>
                          </div>
                          <Badge className={
                            tx.status === 'SUCCESS' ? 'bg-green-600' :
                            tx.status === 'PENDING' ? 'bg-yellow-600' : 'bg-red-600'
                          }>
                            {tx.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingManager;
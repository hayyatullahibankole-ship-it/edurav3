import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { z } from 'zod';
import AddAdminModal from '@/components/AddAdminModal';

const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function AdminLogin() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);

  // Redirect if already logged in as admin
  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      navigate('/admin');
    } else if (!authLoading && user && !isAdmin) {
      navigate('/dashboard');
    }
  }, [user, isAdmin, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form data first
      const validatedData = adminLoginSchema.parse(formData);
      setErrors({});
      setLoading(true);

      console.log('Attempting admin login...');

      // Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      console.log('Login result:', { data: !!data, error: error?.message });

      if (error) {
        console.error('Authentication error:', error);
        toast({
          title: "Login Failed",
          description: error.message === 'Invalid login credentials' 
            ? 'Invalid email or password' 
            : error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        console.log('User authenticated, checking admin privileges...');
        
        // Verify admin privileges via secure RPC
        const { data: isAdminFlag, error: adminCheckError } = await supabase
          .rpc('is_admin', { _user_id: data.user.id });

        console.log('Admin check result:', { isAdmin: isAdminFlag, error: adminCheckError?.message });

        if (adminCheckError) {
          console.error('Error verifying admin privileges:', adminCheckError);
          await supabase.auth.signOut();
          toast({
            title: "Access Denied",
            description: "Error verifying admin privileges. Please try again.",
            variant: "destructive",
          });
          return;
        }

        if (!isAdminFlag) {
          console.warn('User is not an admin');
          await supabase.auth.signOut();
          toast({
            title: "Access Denied",
            description: "This account does not have admin privileges",
            variant: "destructive",
          });
          return;
        }

        console.log('Admin login successful, navigating to dashboard...');
        
        toast({
          title: "Welcome Admin",
          description: "Successfully logged into admin dashboard",
        });

        // Navigate immediately since auth state will handle the rest
        navigate('/admin', { replace: true });
      }
    } catch (error) {
      console.error('Login process error:', error);
      
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
            <CardDescription className="text-base">
              Secure access to Edura administration
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert className="border-amber-200 bg-amber-50/50">
            <Shield className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              This is a restricted area. Only authorized administrators can access this portal.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Admin Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@edura.com"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? 'border-destructive' : ''}
                required
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Access Admin Portal
                </>
              )}
            </Button>
          </form>

          <div className="text-center space-y-3">
            <Button 
              variant="outline" 
              onClick={() => setShowAddAdminModal(true)}
              className="w-full text-sm"
            >
              + Add Admin Account
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-sm"
            >
              ← Back to Main Site
            </Button>
          </div>
        </CardContent>
      </Card>

      <AddAdminModal 
        isOpen={showAddAdminModal}
        onClose={() => setShowAddAdminModal(false)}
      />
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Plus, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Search,
  UserPlus,
  Shield,
  AlertTriangle,
  CheckCircle,
  Mail,
  Clock,
  Filter,
  UserPlus,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { emailSchema, passwordSchema, nameSchema, adminUserSchema } from '@/utils/inputValidation';
import {
  countUsersJoinedWithinHours,
  countUsersLoggedInWithinDays,
  filterAdminUsers,
  type AccountFilter,
  type EnrollmentWindow,
  type LoginWindow,
  type UserSort,
  type VerificationFilter,
} from '@/lib/adminUserActivity';

interface UserManagementProps {
  users: any[];
  onRefresh: () => void;
}

export default function UserManagement({ users: initialUsers, onRefresh }: UserManagementProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [enrollmentFilter, setEnrollmentFilter] = useState<EnrollmentWindow>('all');
  const [loginFilter, setLoginFilter] = useState<LoginWindow>('all');
  const [accountFilter, setAccountFilter] = useState<AccountFilter>('all');
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>('all');
  const [sortBy, setSortBy] = useState<UserSort>('newest');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localUsers, setLocalUsers] = useState<any[]>(initialUsers);

  // Sync local users with prop changes (from real-time updates)
  React.useEffect(() => {
    setLocalUsers(initialUsers);
  }, [initialUsers]);
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'student'
  });

  const exportUsers = async () => {
    try {
      // Create CSV content
      const headers = ['Email', 'First Name', 'Last Name', 'Phone', 'Country', 'Created At', 'Last Login', 'Is Suspended', 'Is Verified'];
      const csvContent = [
        headers.join(','),
        ...filteredUsers.map(user => [
          user.email || '',
          user.first_name || '',
          user.last_name || '',
          user.phone || '',
          user.country || '',
          user.auth_created_at || user.created_at || '',
          user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never',
          user.is_suspended ? 'Yes' : 'No'
          , user.is_verified ? 'Yes' : 'No'
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: `${filteredUsers.length} filtered users exported successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export users",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = useMemo(() => filterAdminUsers(localUsers, {
    search: searchTerm,
    enrollment: enrollmentFilter,
    login: loginFilter,
    account: accountFilter,
    verification: verificationFilter,
    sort: sortBy,
  }), [localUsers, searchTerm, enrollmentFilter, loginFilter, accountFilter, verificationFilter, sortBy]);

  const handleAddUser = async () => {
    try {
      setLoading(true);
      
      // Create user profile in database
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: newUser.email,
          first_name: newUser.firstName,
          last_name: newUser.lastName,
          phone: newUser.phone || null
        })
        .select()
        .single();

      if (error) throw error;

      // Assign role
      await supabase
        .from('user_roles')
        .insert({
          user_id: data.id,
          role: newUser.role as 'student' | 'admin' | 'super_admin' | 'tutor'
        });

      toast({
        title: "Success",
        description: "User created successfully"
      });

      setIsAddModalOpen(false);
      setNewUser({ email: '', firstName: '', lastName: '', phone: '', role: 'student' });
      onRefresh();
      
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('users')
        .update({
          first_name: selectedUser.first_name,
          last_name: selectedUser.last_name,
          phone: selectedUser.phone,
          email: selectedUser.email
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({
        title: "Success", 
        description: "User updated successfully"
      });

      setIsEditModalOpen(false);
      setSelectedUser(null);
      onRefresh();
      
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This will permanently delete all their data including exam attempts, results, and subscriptions.')) return;
    
    // Optimistic update - remove from UI immediately
    const userToDelete = localUsers.find(u => u.id === userId);
    setLocalUsers(prevUsers => prevUsers.filter(user => user.id !== userId));

    try {
      console.log('Starting delete for user:', userId);
      
      // Call the database function to delete user by app ID
      const { data: rpcResult, error: rpcError } = await supabase.rpc('delete_user_completely_by_app_id', {
        user_app_id: userId
      });

      if (rpcError) {
        console.error('Error from delete function:', rpcError);
        throw rpcError;
      }

      if (!rpcResult) {
        throw new Error('User deletion failed - function returned false');
      }

      console.log('User deleted successfully');

      toast({
        title: "Success",
        description: "User and all associated data deleted permanently"
      });

      // Background refresh to ensure sync
      onRefresh();
      
    } catch (error: any) {
      console.error('Error deleting user:', error);
      // Revert optimistic update
      if (userToDelete) {
        setLocalUsers(prevUsers => [...prevUsers, userToDelete]);
      }
      toast({
        title: "Error", 
        description: `Failed to delete user: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const toggleUserSuspension = async (userId: string, currentStatus: boolean) => {
    // Optimistic update
    setLocalUsers(prevUsers => prevUsers.map(user => 
      user.id === userId ? { ...user, is_suspended: !currentStatus } : user
    ));

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_suspended: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${!currentStatus ? 'suspended' : 'activated'} successfully`
      });

      // Background refresh to ensure sync
      onRefresh();
      
    } catch (error) {
      console.error('Error toggling user suspension:', error);
      // Revert optimistic update
      setLocalUsers(prevUsers => prevUsers.map(user => 
        user.id === userId ? { ...user, is_suspended: currentStatus } : user
      ));
      toast({
        title: "Error",
        description: "Failed to update user status", 
        variant: "destructive"
      });
    }
  };

  const verifyUserEmail = async (user: any): Promise<boolean> => {
    const userId = user?.id as string | undefined;
    const authUserId = user?.auth_user_id as string | undefined;
    const alreadyVerifiedInApp = !!user?.is_verified;

    if (!userId) {
      toast({
        title: "Error",
        description: "Missing user record id",
        variant: "destructive",
      });
      return false;
    }

    // IMPORTANT: Auth verification must use auth.users.id
    // Note: Some older records may have is_verified=true but still have unconfirmed auth email.
    // In that case we still allow running this action to sync auth confirmation.
    if (!authUserId) {
      toast({
        title: "Cannot verify",
        description: "This user is missing an auth account link (auth_user_id).",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);

    // Optimistic update
    setLocalUsers((prevUsers) =>
      prevUsers.map((u) => (u.id === userId ? { ...u, is_verified: true } : u)),
    );

    try {
      const { data, error } = await supabase.functions.invoke('admin-verify-user', {
        body: { authUserId },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Verification failed');

      // Add a small delay to ensure database writes are propagated
      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        title: alreadyVerifiedInApp ? "Synced" : "Success",
        description: alreadyVerifiedInApp
          ? "Supabase Auth email confirmation synced successfully."
          : "User email verified successfully",
      });

      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, is_verified: true });
      }

      // Trigger refresh to reload from database
      onRefresh();
      return true;
    } catch (error: any) {
      // Revert optimistic update only if they weren't already verified
      setLocalUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === userId ? { ...u, is_verified: alreadyVerifiedInApp } : u,
        ),
      );

      toast({
        title: "Error",
        description: `Failed to verify user email: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-slate-400">Manage system users and permissions</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="user@edura.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                    placeholder="+234 xxx xxx xxxx"
                  />
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={loading} className="w-full sm:flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleAddUser} disabled={loading} className="w-full sm:flex-1">
                    {loading ? 'Creating...' : 'Create User'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={exportUsers} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 p-4">
          <UserPlus className="h-4 w-4 shrink-0 text-emerald-400" />
          <div><p className="text-xs text-slate-400">Joined in 24 hours</p><p className="text-lg font-semibold text-white">{countUsersJoinedWithinHours(localUsers, 24)}</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 p-4">
          <Clock className="h-4 w-4 shrink-0 text-emerald-400" />
          <div><p className="text-xs text-slate-400">Logged in within 7 days</p><p className="text-lg font-semibold text-white">{countUsersLoggedInWithinDays(localUsers, 7)}</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 p-4">
          <Users className="h-4 w-4 shrink-0 text-slate-300" />
          <div><p className="text-xs text-slate-400">Never logged in</p><p className="text-lg font-semibold text-white">{localUsers.filter((user) => !user.last_login_at).length}</p></div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white w-full"
              />
            </div>
            <Badge className="bg-slate-700 text-slate-300 whitespace-nowrap">
              {filteredUsers.length} users
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            Filter and sort
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Select value={enrollmentFilter} onValueChange={(value) => setEnrollmentFilter(value as EnrollmentWindow)}>
              <SelectTrigger aria-label="Filter by enrollment date" className="bg-slate-700 border-slate-600 text-white"><SelectValue placeholder="Enrollment date" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any enrollment date</SelectItem><SelectItem value="24h">Joined in 24 hours</SelectItem><SelectItem value="7d">Joined in 7 days</SelectItem><SelectItem value="30d">Joined in 30 days</SelectItem><SelectItem value="90d">Joined in 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={loginFilter} onValueChange={(value) => setLoginFilter(value as LoginWindow)}>
              <SelectTrigger aria-label="Filter by recent login" className="bg-slate-700 border-slate-600 text-white"><SelectValue placeholder="Login activity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any login activity</SelectItem><SelectItem value="7d">Logged in within 7 days</SelectItem><SelectItem value="30d">Logged in within 30 days</SelectItem><SelectItem value="90d">Logged in within 90 days</SelectItem><SelectItem value="never">Never logged in</SelectItem>
              </SelectContent>
            </Select>
            <Select value={accountFilter} onValueChange={(value) => setAccountFilter(value as AccountFilter)}>
              <SelectTrigger aria-label="Filter by account status" className="bg-slate-700 border-slate-600 text-white"><SelectValue placeholder="Account status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All account statuses</SelectItem><SelectItem value="active">Not suspended</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent>
            </Select>
            <Select value={verificationFilter} onValueChange={(value) => setVerificationFilter(value as VerificationFilter)}>
              <SelectTrigger aria-label="Filter by verification status" className="bg-slate-700 border-slate-600 text-white"><SelectValue placeholder="Verification" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All verification statuses</SelectItem><SelectItem value="verified">Verified</SelectItem><SelectItem value="unverified">Unverified</SelectItem></SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as UserSort)}>
              <SelectTrigger aria-label="Sort users" className="bg-slate-700 border-slate-600 text-white"><SelectValue placeholder="Sort users" /></SelectTrigger>
              <SelectContent><SelectItem value="newest">Newest enrollment</SelectItem><SelectItem value="recent-login">Most recent login</SelectItem><SelectItem value="name">Name A–Z</SelectItem></SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="bg-slate-800 border-slate-700 overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {filteredUsers.map((user: any) => (
              <div key={user.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-700 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors gap-4">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-600 rounded-full flex-shrink-0 flex items-center justify-center">
                    {user.profile_image_url ? (
                      <img src={user.profile_image_url} alt="Profile" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
                    ) : (
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-white truncate">
                        {user.first_name} {user.last_name}
                      </p>
                      {user.is_verified && (
                        <Shield className="w-4 h-4 text-green-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-slate-400 truncate">{user.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        Joined {user.auth_created_at || user.created_at ? new Date(user.auth_created_at || user.created_at).toLocaleDateString() : 'Unknown'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {user.last_login_at ? `Last login: ${new Date(user.last_login_at).toLocaleDateString()}` : 'Never logged in'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
                  {user.is_suspended && (
                    <Badge className="bg-red-600 text-white text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Suspended
                    </Badge>
                  )}
                  {!user.is_verified && (
                    <Badge className="bg-yellow-600 text-white text-xs">
                      <Mail className="w-3 h-3 mr-1" />
                      Unverified
                    </Badge>
                  )}
                  
                  <Button variant="ghost" size="sm" onClick={() => {
                    setSelectedUser(user);
                    setIsViewModalOpen(true);
                  }} className="h-8 w-8 p-0">
                    <Eye className="w-4 h-4" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user);
                      setIsEditModalOpen(true);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  {!user.is_verified && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => verifyUserEmail(user)}
                      disabled={loading}
                      className="text-green-400 hover:text-green-300 h-8 w-8 p-0"
                      title="Manually verify email"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleUserSuspension(user.id, user.is_suspended)}
                    disabled={loading}
                    className="h-8 px-2 text-xs"
                  >
                    {user.is_suspended ? 'Activate' : 'Suspend'}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={loading}
                    className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No users found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input
                    id="editFirstName"
                    value={selectedUser.first_name || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, first_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input
                    id="editLastName"
                    value={selectedUser.last_name || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, last_name: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={selectedUser.email || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="editPhone">Phone</Label>
                <Input
                  id="editPhone"
                  value={selectedUser.phone || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={loading} className="w-full sm:flex-1">
                  Cancel
                </Button>
                <Button onClick={handleEditUser} disabled={loading} className="w-full sm:flex-1">
                  {loading ? 'Updating...' : 'Update User'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View User Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center">
                  {selectedUser.profile_image_url ? (
                    <img src={selectedUser.profile_image_url} alt="Profile" className="w-16 h-16 rounded-full" />
                  ) : (
                    <Users className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.first_name} {selectedUser.last_name}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {selectedUser.is_verified && (
                      <Badge className="bg-green-600">Verified</Badge>
                    )}
                    {selectedUser.is_suspended && (
                      <Badge className="bg-red-600">Suspended</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-muted-foreground">Phone:</span> {selectedUser.phone || 'Not provided'}</div>
                    <div><span className="text-muted-foreground">Date of Birth:</span> {selectedUser.date_of_birth ? new Date(selectedUser.date_of_birth).toLocaleDateString() : 'Not provided'}</div>
                    <div><span className="text-muted-foreground">Country:</span> {selectedUser.country || 'Not provided'}</div>
                    <div><span className="text-muted-foreground">State:</span> {selectedUser.state || 'Not provided'}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Account Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-muted-foreground">Enrolled:</span> {selectedUser.auth_created_at || selectedUser.created_at ? new Date(selectedUser.auth_created_at || selectedUser.created_at).toLocaleDateString() : 'Unknown'}</div>
                    <div><span className="text-muted-foreground">Last Login:</span> {selectedUser.last_login_at ? new Date(selectedUser.last_login_at).toLocaleDateString() : 'Never'}</div>
                    <div><span className="text-muted-foreground">2FA Enabled:</span> {selectedUser.two_fa_enabled ? 'Yes' : 'No'}</div>
                    <div><span className="text-muted-foreground">Account Status:</span> {selectedUser.is_suspended ? 'Suspended' : 'Active'}</div>
                  </div>
                </div>
              </div>

              {selectedUser.address && (
                <div>
                  <h4 className="font-medium mb-2">Address</h4>
                  <p className="text-sm text-muted-foreground">{selectedUser.address}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4">
                <Button 
                  onClick={async () => {
                    await verifyUserEmail(selectedUser);
                    setIsViewModalOpen(false);
                  }}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {selectedUser.is_verified ? 'Sync Auth Verification' : 'Verify Email Manually'}
                </Button>
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
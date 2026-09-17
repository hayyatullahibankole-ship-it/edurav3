import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, Search, Download, CheckCircle, XCircle, 
  Eye, Filter, RefreshCw, Image as ImageIcon
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

interface Registration {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  gender: string | null;
  academic_level: string | null;
  tutorial_id: string | null;
  tutorial_name: string;
  mode_of_learning: string;
  tutorial_type: string;
  price: number;
  guardian_name: string | null;
  guardian_phone: string | null;
  referral_source: string | null;
  special_requests: string | null;
  student_photo_url: string | null;
  payment_proof_url: string | null;
  payment_verified: boolean | null;
  payment_verified_at: string | null;
  status: string | null;
  created_at: string | null;
}

export function AkboyRegistrationsManager() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("akboy_tutorial_registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (registration: Registration, verified: boolean) => {
    try {
      const { error } = await supabase
        .from("akboy_tutorial_registrations")
        .update({
          payment_verified: verified,
          payment_verified_at: verified ? new Date().toISOString() : null,
          status: verified ? 'confirmed' : 'pending'
        })
        .eq("id", registration.id);

      if (error) throw error;
      toast({ title: verified ? "Payment verified" : "Payment unverified" });
      fetchRegistrations();
      if (selectedRegistration?.id === registration.id) {
        setSelectedRegistration({ ...registration, payment_verified: verified, status: verified ? 'confirmed' : 'pending' });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateStatus = async (registration: Registration, status: string) => {
    try {
      const { error } = await supabase
        .from("akboy_tutorial_registrations")
        .update({ status })
        .eq("id", registration.id);

      if (error) throw error;
      toast({ title: `Status updated to ${status}` });
      fetchRegistrations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    const filtered = getFilteredRegistrations();
    const headers = [
      "Name", "Phone", "Email", "Gender", "Academic Level", "Tutorial", 
      "Mode", "Type", "Price", "Guardian Name", "Guardian Phone",
      "Referral Source", "Payment Verified", "Status", "Registered At"
    ];
    
    const rows = filtered.map(r => [
      r.full_name,
      r.phone,
      r.email || "",
      r.gender || "",
      r.academic_level || "",
      r.tutorial_name,
      r.mode_of_learning,
      r.tutorial_type,
      r.price,
      r.guardian_name || "",
      r.guardian_phone || "",
      r.referral_source || "",
      r.payment_verified ? "Yes" : "No",
      r.status || "pending",
      r.created_at ? format(new Date(r.created_at), "yyyy-MM-dd HH:mm") : ""
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `akboy-registrations-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export complete" });
  };

  const getFilteredRegistrations = () => {
    return registrations.filter(r => {
      const matchesSearch = 
        r.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.phone.includes(searchTerm) ||
        (r.email && r.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        r.tutorial_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const matchesPayment = 
        paymentFilter === "all" || 
        (paymentFilter === "verified" && r.payment_verified) ||
        (paymentFilter === "unverified" && !r.payment_verified);
      
      return matchesSearch && matchesStatus && matchesPayment;
    });
  };

  const printConfirmation = (registration: Registration) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Registration Confirmation - ${registration.full_name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; background: white; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
          .header h1 { color: #10b981; margin: 0; }
          .header p { color: #666; margin-top: 5px; }
          .section { margin-bottom: 20px; }
          .section h3 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          .row { display: flex; margin-bottom: 8px; }
          .label { font-weight: bold; width: 150px; color: #555; }
          .value { flex: 1; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; }
          .verified { background: #d1fae5; color: #065f46; }
          .pending { background: #fef3c7; color: #92400e; }
          .footer { margin-top: 40px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>AKBOY Creative Hub</h1>
          <p>Tutorial Registration Confirmation</p>
        </div>
        
        <div class="section">
          <h3>Student Information</h3>
          <div class="row"><span class="label">Full Name:</span><span class="value">${registration.full_name}</span></div>
          <div class="row"><span class="label">Phone:</span><span class="value">${registration.phone}</span></div>
          <div class="row"><span class="label">Email:</span><span class="value">${registration.email || 'N/A'}</span></div>
          <div class="row"><span class="label">Gender:</span><span class="value">${registration.gender || 'N/A'}</span></div>
          <div class="row"><span class="label">Academic Level:</span><span class="value">${registration.academic_level || 'N/A'}</span></div>
        </div>
        
        <div class="section">
          <h3>Tutorial Details</h3>
          <div class="row"><span class="label">Tutorial:</span><span class="value">${registration.tutorial_name}</span></div>
          <div class="row"><span class="label">Mode:</span><span class="value">${registration.mode_of_learning}</span></div>
          <div class="row"><span class="label">Type:</span><span class="value">${registration.tutorial_type}</span></div>
          <div class="row"><span class="label">Price:</span><span class="value">₦${registration.price.toLocaleString()}</span></div>
        </div>
        
        <div class="section">
          <h3>Guardian Information</h3>
          <div class="row"><span class="label">Guardian Name:</span><span class="value">${registration.guardian_name || 'N/A'}</span></div>
          <div class="row"><span class="label">Guardian Phone:</span><span class="value">${registration.guardian_phone || 'N/A'}</span></div>
        </div>
        
        <div class="section">
          <h3>Registration Status</h3>
          <div class="row"><span class="label">Registration ID:</span><span class="value">${registration.id.slice(0, 8).toUpperCase()}</span></div>
          <div class="row"><span class="label">Payment Status:</span><span class="value"><span class="status ${registration.payment_verified ? 'verified' : 'pending'}">${registration.payment_verified ? 'Verified' : 'Pending'}</span></span></div>
          <div class="row"><span class="label">Registered:</span><span class="value">${registration.created_at ? format(new Date(registration.created_at), "PPP 'at' p") : 'N/A'}</span></div>
        </div>
        
        <div class="footer">
          <p>AKBOY Creative Hub | 08101466977 | akboycreativehub@gmail.com</p>
          <p>This is an official registration confirmation.</p>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AKBOY_Confirmation_${registration.full_name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Confirmation downloaded", description: "Registration confirmation has been downloaded successfully" });
  };

  const filteredRegistrations = getFilteredRegistrations();
  const stats = {
    total: registrations.length,
    verified: registrations.filter(r => r.payment_verified).length,
    pending: registrations.filter(r => !r.payment_verified).length,
    totalRevenue: registrations.filter(r => r.payment_verified).reduce((sum, r) => sum + r.price, 0)
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-400">Loading registrations...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <p className="text-slate-400 text-sm">Total Registrations</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <p className="text-slate-400 text-sm">Verified Payments</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.verified}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <p className="text-slate-400 text-sm">Pending Payments</p>
            <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <p className="text-slate-400 text-sm">Total Revenue</p>
            <p className="text-2xl font-bold text-white">₦{stats.totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Tutorial Registrations
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button onClick={fetchRegistrations} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportToCSV} className="bg-emerald-600 hover:bg-emerald-700" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, phone, email, or tutorial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700 border-slate-600">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-40 bg-slate-700 border-slate-600">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Registrations Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-2 text-slate-400 font-medium text-sm">Student</th>
                  <th className="text-left py-3 px-2 text-slate-400 font-medium text-sm">Tutorial</th>
                  <th className="text-left py-3 px-2 text-slate-400 font-medium text-sm">Price</th>
                  <th className="text-left py-3 px-2 text-slate-400 font-medium text-sm">Payment</th>
                  <th className="text-left py-3 px-2 text-slate-400 font-medium text-sm">Date</th>
                  <th className="text-right py-3 px-2 text-slate-400 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No registrations found
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((reg) => (
                    <tr key={reg.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          {reg.student_photo_url ? (
                            <img 
                              src={reg.student_photo_url} 
                              alt={reg.full_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                              <Users className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-white font-medium text-sm">{reg.full_name}</p>
                            <p className="text-slate-400 text-xs">{reg.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <p className="text-white text-sm">{reg.tutorial_name}</p>
                        <p className="text-slate-400 text-xs">{reg.mode_of_learning} / {reg.tutorial_type}</p>
                      </td>
                      <td className="py-3 px-2">
                        <p className="text-white text-sm">₦{reg.price.toLocaleString()}</p>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={reg.payment_verified ? "default" : "secondary"} className={reg.payment_verified ? "bg-emerald-600" : "bg-amber-600"}>
                          {reg.payment_verified ? "Verified" : "Pending"}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-slate-400 text-sm">
                        {reg.created_at ? format(new Date(reg.created_at), "MMM d, yyyy") : "N/A"}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedRegistration(reg);
                              setDetailsOpen(true);
                            }}
                            className="text-slate-300 hover:text-white"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => verifyPayment(reg, !reg.payment_verified)}
                            className={reg.payment_verified ? "text-amber-400 hover:text-amber-300" : "text-emerald-400 hover:text-emerald-300"}
                          >
                            {reg.payment_verified ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => printConfirmation(reg)}
                            className="text-slate-300 hover:text-white"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
          </DialogHeader>
          {selectedRegistration && (
            <div className="space-y-6">
              {/* Student Photo */}
              {selectedRegistration.student_photo_url && (
                <div className="flex justify-center">
                  <img 
                    src={selectedRegistration.student_photo_url} 
                    alt={selectedRegistration.full_name}
                    className="w-32 h-32 rounded-lg object-cover"
                  />
                </div>
              )}

              {/* Student Info */}
              <div className="bg-slate-700 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-emerald-400 mb-3">Student Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-400">Full Name:</span>
                  <span>{selectedRegistration.full_name}</span>
                  <span className="text-slate-400">Phone:</span>
                  <span>{selectedRegistration.phone}</span>
                  <span className="text-slate-400">Email:</span>
                  <span>{selectedRegistration.email || "N/A"}</span>
                  <span className="text-slate-400">Gender:</span>
                  <span>{selectedRegistration.gender || "N/A"}</span>
                  <span className="text-slate-400">Academic Level:</span>
                  <span>{selectedRegistration.academic_level || "N/A"}</span>
                </div>
              </div>

              {/* Tutorial Info */}
              <div className="bg-slate-700 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-emerald-400 mb-3">Tutorial Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-400">Tutorial:</span>
                  <span>{selectedRegistration.tutorial_name}</span>
                  <span className="text-slate-400">Mode:</span>
                  <span className="capitalize">{selectedRegistration.mode_of_learning}</span>
                  <span className="text-slate-400">Type:</span>
                  <span className="capitalize">{selectedRegistration.tutorial_type}</span>
                  <span className="text-slate-400">Price:</span>
                  <span className="text-emerald-400 font-semibold">₦{selectedRegistration.price.toLocaleString()}</span>
                </div>
              </div>

              {/* Guardian Info */}
              <div className="bg-slate-700 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-emerald-400 mb-3">Guardian Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-400">Guardian Name:</span>
                  <span>{selectedRegistration.guardian_name || "N/A"}</span>
                  <span className="text-slate-400">Guardian Phone:</span>
                  <span>{selectedRegistration.guardian_phone || "N/A"}</span>
                </div>
              </div>

              {/* Payment Proof */}
              {selectedRegistration.payment_proof_url && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <h4 className="font-semibold text-emerald-400 mb-3">Payment Proof</h4>
                  <PrivateFileImage
                    bucket="tutorial-uploads"
                    path={selectedRegistration.payment_proof_url}
                    alt="Payment Proof"
                    className="max-w-full rounded-lg border border-slate-600"
                  />
                </div>
              )}

              {/* Additional Info */}
              {(selectedRegistration.referral_source || selectedRegistration.special_requests) && (
                <div className="bg-slate-700 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-emerald-400 mb-3">Additional Information</h4>
                  {selectedRegistration.referral_source && (
                    <p className="text-sm"><span className="text-slate-400">Referral Source:</span> {selectedRegistration.referral_source}</p>
                  )}
                  {selectedRegistration.special_requests && (
                    <p className="text-sm"><span className="text-slate-400">Special Requests:</span> {selectedRegistration.special_requests}</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => verifyPayment(selectedRegistration, !selectedRegistration.payment_verified)}
                  className={selectedRegistration.payment_verified ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}
                >
                  {selectedRegistration.payment_verified ? (
                    <><XCircle className="w-4 h-4 mr-2" /> Unverify Payment</>
                  ) : (
                    <><CheckCircle className="w-4 h-4 mr-2" /> Verify Payment</>
                  )}
                </Button>
                <Button variant="outline" onClick={() => printConfirmation(selectedRegistration)}>
                  <Download className="w-4 h-4 mr-2" /> Download Confirmation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

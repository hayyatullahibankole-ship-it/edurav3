import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInstalledApp } from "@/hooks/useInstalledApp";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import AppShell from "@/components/edura/AppShell";
import UpgradeToCampus from "@/components/edura/UpgradeToCampus";
import ProviderLogo, { providerInfo } from "@/components/edura/ProviderLogo";
import eduraLogo from "@/assets/edura-logo.png";
import {
  AlertCircle,
  ArrowLeft,
  Upload,
  X,
  Briefcase,
  ClipboardList,
  CheckCircle2,
  Clock,
  FileText,
  Search,
  Calendar as CalendarIcon,
  Wallet as WalletIcon,
  LayoutGrid,
  User,
} from "lucide-react";
import ScratchCardDialog from "@/components/edura/ScratchCardDialog";
import ScratchCardHistory from "@/components/edura/ScratchCardHistory";
import { useWallet } from "@/hooks/useWallet";
import { initializePaystackPayment } from "@/utils/paystack";
import { CreditCard, Loader2 } from "lucide-react";



type ServiceField = {
  key: string;
  label: string;
  type: "text" | "tel" | "number" | "textarea" | "select";
  required?: boolean;
  options?: string[];
};

type Service = {
  id: string;
  provider: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  turnaround: string | null;
  fields: ServiceField[];
  product_type?: string | null;
  pricing_mode?: string | null;
};

type Institution = {
  id: string;
  name: string;
  short_code: string | null;
  type: string;
  state: string | null;
  form_fee: number;
  service_fee_override: number | null;
};

const tierFee = (formFee: number) => {
  if (formFee <= 5000) return 3000;
  if (formFee < 10000) return 4000;
  return 5000;
};

type ServiceRequest = {
  id: string;
  service_id?: string | null;
  service_name: string;
  provider: string;
  amount: number;
  status: string;
  created_at: string;
  admin_note: string | null;
  quote_status?: string | null;
  quoted_amount?: number | null;
  institution_name?: string | null;
  result_files?: ResultFile[];
  user_files?: ResultFile[];
  form_data?: Record<string, string> | null;
};

type ResultFile = { path: string; name: string; type: string };


const PROVIDERS = [
  { key: "all", label: "All" },
  { key: "jamb", label: "JAMB" },
  { key: "waec", label: "WAEC" },
  { key: "neco", label: "NECO" },
  { key: "nabteb", label: "NABTEB" },
  { key: "admission", label: "Admissions" },
];

const naira = (value: number) =>
  `₦${Number(value || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

const statusStyles: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  awaiting_details: "bg-primary/10 text-primary",
  needs_resubmission: "bg-destructive/10 text-destructive",



  processing: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  failed: "bg-destructive/10 text-destructive",
  cancelled: "bg-destructive/10 text-destructive",
};

const ServicesHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isInstalledApp } = useInstalledApp();
  const { balance, refresh: refreshWallet } = useWallet();
  const [searchParams, setSearchParams] = useSearchParams();


  const [services, setServices] = useState<Service[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [scratchService, setScratchService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState(searchParams.get("provider") || "all");
  const [activeService, setActiveService] = useState<Service | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"pay" | "details">("pay");
  const [uploads, setUploads] = useState<ResultFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [resubmitNote, setResubmitNote] = useState<string | null>(null);
  const [paidRequestId, setPaidRequestId] = useState<string | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institutionId, setInstitutionId] = useState("");
  const [instSearch, setInstSearch] = useState("");
  const [notListed, setNotListed] = useState(false);
  const [quoteSchool, setQuoteSchool] = useState("");
  const [quoteCourse, setQuoteCourse] = useState("");
  const [payingQuote, setPayingQuote] = useState<ServiceRequest | null>(null);


  const view = searchParams.get("tab") === "requests" ? "requests" : "services";

  const setView = (next: "services" | "requests") => {
    const params = new URLSearchParams(searchParams);
    if (next === "requests") params.set("tab", "requests");
    else params.delete("tab");
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    document.title = "Educational Services | Edura";
  }, []);

  useEffect(() => {
    setProvider(searchParams.get("provider") || "all");
  }, [searchParams]);



  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("service_catalog")
        .select("id, provider, slug, name, description, price, turnaround, fields, product_type, pricing_mode")
        .eq("is_active", true)
        .order("provider")
        .order("sort_order");

      if (error) {
        toast.error("Could not load services");
      } else {
        setServices(
          (data || []).map((row) => ({
            ...row,
            fields: Array.isArray(row.fields) ? (row.fields as unknown as ServiceField[]) : [],
          })) as Service[]
        );
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const loadInstitutions = async () => {
      const { data } = await supabase
        .from("institutions")
        .select("id, name, short_code, type, state, form_fee, service_fee_override")
        .eq("is_active", true)
        .order("name");
      setInstitutions((data as Institution[]) || []);
    };
    loadInstitutions();
  }, []);

  const openResultFile = async (file: ResultFile) => {
    const { data, error } = await supabase.storage
      .from("service-results")
      .createSignedUrl(file.path, 600);
    if (error || !data?.signedUrl) {
      toast.error("Could not open this file");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const openUserFile = async (file: ResultFile) => {
    const { data, error } = await supabase.storage
      .from("service-uploads")
      .createSignedUrl(file.path, 600);
    if (error || !data?.signedUrl) {
      toast.error("Could not open this file");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const loadRequests = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("service_requests")
      .select(
        "id, service_id, service_name, provider, amount, status, created_at, admin_note, result_files, user_files, form_data, quote_status, quoted_amount, institution_name"
      )
      .order("created_at", { ascending: false })
      .limit(50);
    setRequests(
      ((data as any[]) || []).map((r) => ({
        ...r,
        result_files: Array.isArray(r.result_files) ? (r.result_files as ResultFile[]) : [],
        user_files: Array.isArray(r.user_files) ? (r.user_files as ResultFile[]) : [],
        form_data: (r.form_data && typeof r.form_data === "object" ? r.form_data : {}) as Record<string, string>,
      })) as ServiceRequest[]
    );
  };


  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Deep link to a specific service
  useEffect(() => {
    if (!services.length) return;
    const slug = searchParams.get("service");
    if (slug) {
      const match = services.find((s) => s.slug === slug);
      if (match) {
        if (match.product_type === "scratch_card") {
          setScratchService(match);
        } else {
          openService(match);

        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return services.filter((s) => {
      const matchProvider = provider === "all" || s.provider === provider;
      const matchTerm =
        !term ||
        s.name.toLowerCase().includes(term) ||
        s.provider.toLowerCase().includes(term) ||
        (s.description || "").toLowerCase().includes(term);
      return matchProvider && matchTerm;
    });
  }, [services, search, provider]);

  const providerCards = useMemo(() => {
    const keys = Array.from(new Set(services.map((s) => s.provider)));
    return keys.map((key) => ({
      key,
      ...providerInfo(key),
      count: services.filter((s) => s.provider === key).length,
    }));
  }, [services]);

  const showProviderCards = provider === "all" && !search.trim();



  const counts = useMemo(() => {
    const IN_PROGRESS = [
      "pending",
      "processing",
      "awaiting_details",
      "needs_resubmission",
      "quote_requested",
      "in_progress",
    ];
    const DONE = ["completed", "delivered", "success"];
    const pending = requests.filter((r) => IN_PROGRESS.includes((r.status ?? "").toLowerCase())).length;
    const completed = requests.filter((r) => DONE.includes((r.status ?? "").toLowerCase())).length;
    return { total: requests.length, pending, completed };
  }, [requests]);

  const openService = (service: Service) => {
    setActiveService(service);
    setFormValues({});
    setPaidRequestId(null);
    setUploads([]);
    setResubmitNote(null);
    setInstitutionId("");
    setInstSearch("");
    setNotListed(false);
    setQuoteSchool("");
    setQuoteCourse("");
    setStep("pay");
  };

  const closeDialog = () => {
    setActiveService(null);
    setFormValues({});
    setPaidRequestId(null);
    setUploads([]);
    setResubmitNote(null);
    setInstitutionId("");
    setInstSearch("");
    setNotListed(false);
    setQuoteSchool("");
    setQuoteCourse("");
    setStep("pay");
  };

  const selectedInstitution = institutions.find((i) => i.id === institutionId) || null;
  const institutionMatches = useMemo(() => {
    const q = instSearch.trim().toLowerCase();
    const list = q
      ? institutions.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            (i.short_code || "").toLowerCase().includes(q) ||
            (i.state || "").toLowerCase().includes(q),
        )
      : institutions;
    return list.slice(0, 25);
  }, [institutions, instSearch]);

  const isInstitutionService = activeService?.pricing_mode === "institution";
  const institutionFee = selectedInstitution
    ? selectedInstitution.service_fee_override ?? tierFee(Number(selectedInstitution.form_fee) || 0)
    : 0;
  const payableAmount = isInstitutionService
    ? Number(selectedInstitution?.form_fee || 0) + Number(institutionFee)
    : Number(activeService?.price || 0);

  const requestQuote = async () => {
    if (!activeService || !user) {
      toast.error("Please sign in to continue");
      return;
    }
    if (!quoteSchool.trim()) {
      toast.error("Enter the name of your institution");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("service_requests").insert({
      user_id: user.id,
      service_id: activeService.id,
      service_slug: activeService.slug,
      service_name: activeService.name,
      provider: activeService.provider,
      amount: 0,
      institution_name: quoteSchool.trim(),
      status: "quote_requested",
      quote_status: "requested",
      form_data: { institution: quoteSchool.trim(), course: quoteCourse.trim() },
    } as any);
    setSubmitting(false);
    if (error) {
      console.error("quote request failed", error);
      toast.error("Could not send your request. Please try again.");
      return;
    }
    toast.success("Request sent. We'll price it and notify you shortly.");
    closeDialog();
    loadRequests();
    setView("requests");
  };

  const payQuote = async (request: ServiceRequest, method: "wallet" | "card") => {
    if (!user) return;
    const amount = Number(request.quoted_amount) || 0;
    setSubmitting(true);
    const finish = async (payload: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke("pay-service-request", {
        body: { request_id: request.id, ...payload },
      });
      if (error || data?.error) {
        toast.error(data?.error || "Payment could not be completed.");
        return;
      }
      toast.success("Payment received. Now complete your details.");
      setPayingQuote(null);
      refreshWallet();
      await loadRequests();
    };

    if (method === "wallet") {
      await finish({ payment_method: "wallet" });
      setSubmitting(false);
      return;
    }
    try {
      await initializePaystackPayment(
        {
          amount: amount * 100,
          email: user.email || "",
          reference: `srq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          currency: "NGN",
          metadata: { purpose: "service_quote", request_id: request.id },
        },
        async (reference) => {
          await finish({ payment_method: "card", payment_reference: reference });
          setSubmitting(false);
        },
        () => setSubmitting(false),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start payment");
      setSubmitting(false);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length || !user || !paidRequestId) return;
    setUploadingFile(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 15 * 1024 * 1024) {
          toast.error(`${file.name} is larger than 15MB`);
          continue;
        }
        const ext = file.name.split(".").pop() || "dat";
        const path = `${user.id}/${paidRequestId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("service-uploads").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (error) {
          toast.error(`Could not upload ${file.name}`);
          continue;
        }
        setUploads((prev) => [...prev, { path, name: file.name, type: file.type }]);
      }
    } finally {
      setUploadingFile(false);
    }
  };

  const afterPayment = async (payload: Record<string, unknown>) => {
    if (!activeService) return;
    const { data, error } = await supabase.functions.invoke("pay-service-request", {
      body: { service_id: activeService.id, institution_id: institutionId || undefined, ...payload },
    });

    if (error || data?.error) {
      toast.error(data?.error || "Payment could not be completed. Please try again.");
      return;
    }

    setPaidRequestId(data.request_id as string);
    setStep("details");
    refreshWallet();
    loadRequests();
    toast.success("Payment received. Now fill in your details.");
  };

  const payWithWallet = async () => {
    if (!activeService) return;
    if (!user) {
      toast.error("Please sign in to continue");
      navigate("/auth");
      return;
    }
    setSubmitting(true);
    await afterPayment({ payment_method: "wallet" });
    setSubmitting(false);
  };

  const payWithCard = async () => {
    if (!activeService) return;
    if (!user) {
      toast.error("Please sign in to continue");
      navigate("/auth");
      return;
    }
    setSubmitting(true);
    try {
      await initializePaystackPayment(
        {
          amount: payableAmount * 100,
          email: user.email || "",
          reference: `srv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          currency: "NGN",
          metadata: { purpose: "service_request", service_slug: activeService.slug },
        },
        async (reference) => {
          await afterPayment({ payment_method: "card", payment_reference: reference });
          setSubmitting(false);
        },
        () => setSubmitting(false),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start payment");
      setSubmitting(false);
    }
  };

  const submitDetails = async () => {
    if (!activeService || !paidRequestId) return;

    const missing = activeService.fields.filter(
      (field) => field.required && !formValues[field.key]?.trim()
    );
    if (missing.length) {
      toast.error(`Please fill: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }

    const existingFiles =
      requests.find((r) => r.id === paidRequestId)?.user_files ?? [];

    setSubmitting(true);
    const { error } = await supabase
      .from("service_requests")
      .update({
        form_data: formValues,
        user_files: [...existingFiles, ...uploads] as any,
        status: "pending",
      })
      .eq("id", paidRequestId);
    setSubmitting(false);

    if (error) {
      toast.error("Could not save your details. Please try again.");
      return;
    }

    toast.success(
      resubmitNote
        ? "Documents resubmitted. We'll review them shortly."
        : "Details submitted. We'll process your request shortly."
    );
    closeDialog();
    loadRequests();
    setView("requests");
  };

  const resumeRequest = (request: ServiceRequest) => {
    const service = services.find((s) => s.id === request.service_id);
    if (!service) {
      toast.error("This service is no longer available. Please contact support.");
      return;
    }
    setActiveService(service);
    setFormValues(
      request.status === "needs_resubmission" ? { ...(request.form_data || {}) } : {}
    );
    setUploads([]);
    setResubmitNote(request.status === "needs_resubmission" ? request.admin_note || "" : null);
    setPaidRequestId(request.id);
    setStep("details");
  };


  const firstName =
    (user?.user_metadata?.first_name as string | undefined)?.trim() ||
    ((user?.user_metadata?.full_name as string | undefined)?.trim()?.split(" ")[0]) ||
    "there";
  const homePath = isInstalledApp ? "/mobile-home" : "/dashboard";

  return (
    <AppShell
      side="services"
      title={`Hi, ${firstName}`}
      subtitle="Pick a service below and we'll handle it for you."
      action={<UpgradeToCampus />}
    >
      <main className="space-y-5">


        <section className="rounded-2xl bg-ink p-5 text-ink-foreground">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">How it works</p>
          <h2 className="mt-2 font-display text-xl font-bold">Choose, pay, send details, track</h2>
          <p className="mt-2 text-xs leading-relaxed text-ink-foreground/70">
            Prices and turnaround are shown before payment. Your request appears here until it is completed.
          </p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: "Requests", value: counts.total, icon: ClipboardList },
            { label: "In progress", value: counts.pending, icon: Clock },
            { label: "Completed", value: counts.completed, icon: CheckCircle2 },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="rounded-2xl border p-3 sm:p-4">
                <div className="mb-2 w-fit rounded-md border bg-muted p-1.5">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                <p className="text-[11px] sm:text-xs text-muted-foreground">{stat.label}</p>
              </Card>
            );
          })}
        </section>

        {/* View switch */}
        <div className="grid w-full grid-cols-2 rounded-xl border bg-muted p-1">
          {(["services", "requests"] as const).map((key) => (
            <Button
              key={key}
              type="button"
              variant="ghost"
              onClick={() => setView(key)}
              className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${
                view === key ? "bg-card text-foreground shadow-sm hover:bg-card" : "text-muted-foreground"
              }`}
            >
              {key === "services" ? "Browse services" : "My requests"}
            </Button>
          ))}
        </div>

        {view === "services" ? (
          <div className="space-y-4">
            <Card className="border">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg border bg-muted p-2.5">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold">Expert Consultation</h2>
                  <p className="text-xs text-muted-foreground">
                    Book a session with an admission or subject expert
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => window.open("https://wa.me/2347050757085?text=Hello%20Edura%2C%20I%20would%20like%20to%20book%20an%20expert%20consultation%20session.", "_blank", "noopener,noreferrer")}>
                  Book
                </Button>
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg border bg-muted p-2">
                  <WalletIcon className="h-5 w-5 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold">Wallet</h2>
                  <p className="text-xs text-muted-foreground">
                    Fund once and pay for services instantly
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate("/wallet")}>
                  Open
                </Button>
              </CardContent>
            </Card>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search a service..."
                className="pl-9"
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-36 w-full rounded-xl" />
                ))}
              </div>
            ) : showProviderCards ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {providerCards.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setProvider(p.key)}
                    className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition-colors hover:border-primary/60"
                  >
                    <ProviderLogo provider={p.key} className="h-14 w-14" />
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold leading-tight">{p.label}</p>
                      <p className="line-clamp-2 text-[11px] text-muted-foreground">{p.full}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {p.count} service{p.count === 1 ? "" : "s"}
                    </Badge>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {provider !== "all" && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setProvider("all")}>
                      <ArrowLeft className="mr-1.5 h-4 w-4" />
                      All providers
                    </Button>
                    <div className="flex items-center gap-2">
                      <ProviderLogo provider={provider} className="h-7 w-7" />
                      <span className="text-sm font-semibold">
                        {providerInfo(provider).label}
                      </span>
                    </div>
                  </div>
                )}

                {filtered.length === 0 ? (
                  <div className="rounded-lg border p-10 text-center">
                    <Briefcase className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No services match your search.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {filtered.map((service) => (
                      <Card
                        key={service.id}
                        className="border transition-colors hover:border-primary/60"
                      >
                        <CardContent className="flex h-full flex-col gap-3 p-4">
                          <div className="flex items-start gap-3">
                            <ProviderLogo provider={service.provider} className="h-10 w-10 shrink-0" />
                            <div className="min-w-0 space-y-1">
                              <h3 className="font-semibold leading-tight">{service.name}</h3>
                              <p className="line-clamp-2 text-sm text-muted-foreground">
                                {service.description}
                              </p>
                              {service.product_type === "scratch_card" && (
                                <Badge variant="secondary" className="text-[10px]">
                                  Instant delivery
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="mt-auto flex items-center justify-between gap-3">
                            <div>
                              <p className="text-lg font-bold">{naira(service.price)}</p>
                              {service.turnaround && (
                                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" /> {service.turnaround}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                if (service.product_type === "scratch_card") {
                                  setScratchService(service);
                                  return;
                                }
                                openService(service);

                              }}
                            >
                              {service.product_type === "scratch_card" ? "Buy now" : "Pay & request"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        ) : (
          <div className="space-y-4">
            <ScratchCardHistory />
            {requests.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border py-12 text-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No requests yet.</p>
                <Button size="sm" className="mt-2" onClick={() => setView("services")}>
                  Browse services
                </Button>
              </div>
            ) : (
              requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{request.service_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString()} · {naira(request.amount)}
                    </p>
                    {request.status === "needs_resubmission" && (
                      <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 p-2">
                        <p className="flex items-center gap-1 text-xs font-medium text-destructive">
                          <AlertCircle className="h-3 w-3" /> Resubmission requested
                        </p>
                        {request.admin_note && (
                          <p className="mt-1 text-xs text-muted-foreground">{request.admin_note}</p>
                        )}
                      </div>
                    )}
                    {request.admin_note && request.status !== "needs_resubmission" && (
                      <p className="mt-1 text-xs text-muted-foreground">{request.admin_note}</p>
                    )}
                    {(request.user_files?.length ?? 0) > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {request.user_files!.map((file) => (
                          <Button
                            key={file.path}
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 border px-2 text-xs"
                            onClick={() => openUserFile(file)}
                          >
                            <Upload className="h-3 w-3" />
                            <span className="max-w-[140px] truncate">{file.name}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                    {(request.result_files?.length ?? 0) > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {request.result_files!.map((file) => (
                          <Button
                            key={file.path}
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 px-2 text-xs"
                            onClick={() => openResultFile(file)}
                          >
                            <FileText className="h-3 w-3" />
                            <span className="max-w-[140px] truncate">{file.name}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  {request.quote_status === "quoted" ? (
                    <Button size="sm" className="shrink-0" onClick={() => setPayingQuote(request)}>
                      Pay {naira(Number(request.quoted_amount) || 0)}
                    </Button>
                  ) : request.quote_status === "requested" ? (
                    <Badge variant="secondary" className="shrink-0">
                      Awaiting price
                    </Badge>
                  ) : request.status === "awaiting_details" ? (
                    <Button size="sm" className="shrink-0" onClick={() => resumeRequest(request)}>
                      Complete details
                    </Button>
                  ) : request.status === "needs_resubmission" ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="shrink-0"
                      onClick={() => resumeRequest(request)}
                    >
                      Resubmit
                    </Button>
                  ) : (
                    <Badge
                      className={`shrink-0 border-0 capitalize ${
                        statusStyles[request.status] || statusStyles.pending
                      }`}
                    >
                      {request.status.replace(/_/g, " ")}
                    </Badge>

                  )}

                </div>
              ))
            )}
          </div>
        )}
      </main>

      <Dialog open={!!activeService} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{activeService?.name}</DialogTitle>
            <DialogDescription>
              {activeService
                ? step === "pay"
                  ? `${naira(activeService.price)} · pay first, then fill in your details`
                  : `Payment received · ${activeService.turnaround ?? "we'll process shortly"}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {step === "pay" ? (
            <div className="space-y-4">
              {isInstitutionService && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Choose your institution</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Search school name or state"
                        value={instSearch}
                        onChange={(e) => {
                          setInstSearch(e.target.value);
                          setNotListed(false);
                        }}
                      />
                    </div>
                  </div>

                  {!notListed && (
                    <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border p-1">
                      {institutionMatches.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground">No school matched.</p>
                      ) : (
                        institutionMatches.map((inst) => {
                          const fee = inst.service_fee_override ?? tierFee(Number(inst.form_fee) || 0);
                          const active = inst.id === institutionId;
                          return (
                            <button
                              key={inst.id}
                              type="button"
                              onClick={() => setInstitutionId(inst.id)}
                              className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm ${
                                active ? "bg-primary/10 text-primary" : "hover:bg-muted"
                              }`}
                            >
                              <span className="min-w-0">
                                <span className="block truncate font-medium">{inst.name}</span>
                                <span className="block text-xs text-muted-foreground">
                                  {inst.state || inst.type}
                                </span>
                              </span>
                              <span className="shrink-0 text-xs font-semibold">
                                {naira(Number(inst.form_fee) + Number(fee))}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline"
                    onClick={() => {
                      setNotListed((v) => !v);
                      setInstitutionId("");
                    }}
                  >
                    {notListed ? "Back to the school list" : "My school is not listed"}
                  </button>

                  {notListed && (
                    <div className="space-y-3 rounded-lg border p-3">
                      <div className="space-y-2">
                        <Label>Institution name</Label>
                        <Input
                          value={quoteSchool}
                          onChange={(e) => setQuoteSchool(e.target.value)}
                          placeholder="e.g. Federal Polytechnic Offa"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Course / programme (optional)</Label>
                        <Input
                          value={quoteCourse}
                          onChange={(e) => setQuoteCourse(e.target.value)}
                          placeholder="e.g. Computer Science"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        We'll check the school's form fee and send you a price. You only pay after
                        we confirm it.
                      </p>
                      <Button className="w-full" onClick={requestQuote} disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Request a price
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {!notListed && (
                <>
                  {isInstitutionService && selectedInstitution && (
                    <div className="rounded-lg border p-3 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>{selectedInstitution.name} form fee</span>
                        <span>{naira(Number(selectedInstitution.form_fee))}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Processing fee</span>
                        <span>{naira(Number(institutionFee))}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="text-lg font-bold">
                      {isInstitutionService && !selectedInstitution ? "—" : naira(payableAmount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <WalletIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm">Wallet balance</span>
                    </div>
                    <Badge variant="secondary">{naira(balance)}</Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    After payment you'll be asked for the details we need to process this service.
                  </p>

                  <div className="grid gap-2">
                    <Button
                      onClick={payWithWallet}
                      disabled={
                        submitting ||
                        payableAmount <= 0 ||
                        (isInstitutionService && !selectedInstitution) ||
                        balance < payableAmount
                      }
                    >
                      {submitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <WalletIcon className="mr-2 h-4 w-4" />
                      )}
                      Pay from wallet
                    </Button>
                    {balance < payableAmount && (
                      <button
                        className="text-left text-xs text-muted-foreground underline"
                        onClick={() => navigate("/wallet")}
                      >
                        Balance too low — fund your wallet
                      </button>
                    )}
                    <Button
                      variant="outline"
                      onClick={payWithCard}
                      disabled={
                        submitting ||
                        payableAmount <= 0 ||
                        (isInstitutionService && !selectedInstitution)
                      }
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay with card
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {resubmitNote !== null ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <p className="flex items-center gap-2 text-sm font-medium text-destructive">
                      <AlertCircle className="h-4 w-4" /> Resubmission requested
                    </p>
                    {resubmitNote && (
                      <p className="mt-1 text-xs text-muted-foreground">{resubmitNote}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Correct the details below and upload the missing or corrected documents.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border bg-muted p-3">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <p className="text-sm font-medium">Payment confirmed</p>
                  </div>
                )}
                {activeService?.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>
                      {field.label}
                      {field.required && <span className="text-destructive"> *</span>}
                    </Label>
                    {field.type === "textarea" ? (
                      <Textarea
                        id={field.key}
                        value={formValues[field.key] || ""}
                        onChange={(e) =>
                          setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                      />
                    ) : field.type === "select" ? (
                      <Select
                        value={formValues[field.key] || ""}
                        onValueChange={(value) =>
                          setFormValues((prev) => ({ ...prev, [field.key]: value }))
                        }
                      >
                        <SelectTrigger id={field.key}>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {(field.options || []).map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={field.key}
                        type={field.type}
                        value={formValues[field.key] || ""}
                        onChange={(e) =>
                          setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                      />
                    )}
                  </div>
                ))}

                <div className="space-y-2">
                  <Label>Documents {resubmitNote !== null ? "" : "(optional)"}</Label>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground hover:border-primary hover:text-primary">
                    {uploadingFile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploadingFile ? "Uploading..." : "Upload images or documents"}
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      disabled={uploadingFile}
                      onChange={(e) => {
                        handleUpload(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {uploads.length > 0 && (
                    <div className="space-y-1">
                      {uploads.map((file) => (
                        <div
                          key={file.path}
                          className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-xs"
                        >
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            aria-label={`Remove ${file.name}`}
                            onClick={() =>
                              setUploads((prev) => prev.filter((f) => f.path !== file.path))
                            }
                          >
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>
                  Later
                </Button>
                <Button onClick={submitDetails} disabled={submitting || uploadingFile}>
                  {submitting
                    ? "Submitting..."
                    : resubmitNote !== null
                      ? "Resubmit"
                      : "Submit details"}
                </Button>
              </DialogFooter>

            </>
          )}
        </DialogContent>
      </Dialog>


      <Dialog open={!!payingQuote} onOpenChange={(open) => !open && setPayingQuote(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Pay for {payingQuote?.service_name}</DialogTitle>
            <DialogDescription>
              {payingQuote?.institution_name
                ? `${payingQuote.institution_name} — priced by our team.`
                : "Priced by our team."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-lg font-bold">
                {naira(Number(payingQuote?.quoted_amount) || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <WalletIcon className="h-4 w-4 text-primary" />
                <span className="text-sm">Wallet balance</span>
              </div>
              <Badge variant="secondary">{naira(balance)}</Badge>
            </div>
            <div className="grid gap-2">
              <Button
                onClick={() => payingQuote && payQuote(payingQuote, "wallet")}
                disabled={submitting || balance < (Number(payingQuote?.quoted_amount) || 0)}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <WalletIcon className="mr-2 h-4 w-4" />
                )}
                Pay from wallet
              </Button>
              <Button
                variant="outline"
                onClick={() => payingQuote && payQuote(payingQuote, "card")}
                disabled={submitting}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Pay with card
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ScratchCardDialog service={scratchService} onClose={() => setScratchService(null)} />
    </AppShell>

  );
};

export default ServicesHome;

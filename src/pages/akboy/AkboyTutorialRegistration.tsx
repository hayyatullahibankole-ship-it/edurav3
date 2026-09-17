import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useDomainDetection } from '@/hooks/useDomainDetection';
import { AkboyLayout } from '@/components/akboy/AkboyLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  BookOpen, Palette, Globe, BookOpenCheck, 
  Upload, Printer, CheckCircle, Loader2,
  Phone, Mail, ArrowLeft, ArrowRight
} from 'lucide-react';

const registrationSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  gender: z.string().min(1, 'Please select gender'),
  academic_level: z.string().min(1, 'Please select academic level'),
  tutorial_id: z.string().min(1, 'Please select a tutorial'),
  mode_of_learning: z.string().min(1, 'Please select mode of learning'),
  tutorial_type: z.string().min(1, 'Please select tutorial type'),
  guardian_name: z.string().optional(),
  guardian_phone: z.string().optional(),
  referral_source: z.string().optional(),
  special_requests: z.string().max(500).optional(),
  agreement: z.boolean().refine(val => val === true, 'You must agree to the terms'),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

interface Tutorial {
  id: string;
  name: string;
  slug: string;
  description: string;
  online_group_price: number;
  online_private_price: number;
  physical_group_price: number;
  physical_private_price: number;
  whatsapp_group_link: string | null;
  flyer_url: string | null;
}

interface PaymentAccount {
  bank_name: string;
  account_number: string;
  account_name: string;
}

const tutorialIcons: Record<string, typeof BookOpen> = {
  'exam-prep': BookOpen,
  'akboy-exam-prep-academy': BookOpen,
  'jamb-waec': BookOpen,
  'graphics-design': Palette,
  'web-design': Globe,
  'quran-memorization': BookOpenCheck,
};

const withTimeout = async <T,>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> => {
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(`${label} timed out`)), ms);
  });
  try {
    return await Promise.race([Promise.resolve(promise), timeoutPromise]);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
};

const createUuidV4 = (): string => {
  const c = globalThis.crypto as Crypto | undefined;
  if (typeof c?.randomUUID === 'function') return c.randomUUID();
  if (!c?.getRandomValues) throw new Error('Secure random generator not available');
  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
};

export default function AkboyTutorialRegistration() {
  const [searchParams] = useSearchParams();
  const { isAkboy } = useDomainDetection();
  const basePath = isAkboy ? '' : '/akboy';
  
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [paymentAccount, setPaymentAccount] = useState<PaymentAccount | null>(null);
  const [step, setStep] = useState(1); // 1 = choose tutorial, 2 = fill form, 3 = payment
  const [submissionData, setSubmissionData] = useState<{
    registrationId: string;
    tutorialName: string;
    price: number;
    whatsappLink: string | null;
  } | null>(null);
  
  const printRef = useRef<HTMLDivElement>(null);
  const preselectedTutorial = searchParams.get('tutorial');

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      gender: '',
      academic_level: '',
      tutorial_id: '',
      mode_of_learning: '',
      tutorial_type: '',
      guardian_name: '',
      guardian_phone: '',
      referral_source: '',
      special_requests: '',
      agreement: false,
    },
  });

  const selectedTutorialId = form.watch('tutorial_id');
  const modeOfLearning = form.watch('mode_of_learning');
  const tutorialType = form.watch('tutorial_type');
  const selectedTutorial = tutorials.find(t => t.id === selectedTutorialId);
  
  const calculatePrice = () => {
    if (!selectedTutorial || !modeOfLearning || !tutorialType) return 0;
    const key = `${modeOfLearning}_${tutorialType}_price` as keyof Tutorial;
    return selectedTutorial[key] as number || 0;
  };
  const price = calculatePrice();

  useEffect(() => {
    fetchTutorials();
    fetchPaymentAccount();
  }, []);

  useEffect(() => {
    if (preselectedTutorial && tutorials.length > 0) {
      const tutorial = tutorials.find(t => t.slug === preselectedTutorial);
      if (tutorial) {
        form.setValue('tutorial_id', tutorial.id);
        setStep(2);
      }
    }
  }, [preselectedTutorial, tutorials]);

  const fetchTutorials = async () => {
    try {
      const { data, error } = await supabase
        .from('akboy_tutorials')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      setTutorials(data || []);
    } catch (error) {
      console.error('Error fetching tutorials:', error);
      toast.error('Failed to load tutorials');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentAccount = async () => {
    try {
      const { data, error } = await supabase
        .from('akboy_settings')
        .select('value')
        .eq('key', 'payment_account')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data?.value) setPaymentAccount(data.value as unknown as PaymentAccount);
    } catch (error) {
      console.error('Error fetching payment account:', error);
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const { error } = await supabase.storage.from('tutorial-uploads').upload(fileName, file);
    if (error) { console.error('Upload error:', error); return null; }
    // Bucket is private: store the path and sign it on demand for admins only.
    return fileName;
  };

  const selectTutorial = (tutorialId: string) => {
    form.setValue('tutorial_id', tutorialId, { shouldValidate: true });
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPaymentStep = async () => {
    // Validate step 2 fields
    const valid = await form.trigger(['full_name', 'phone', 'gender', 'academic_level', 'mode_of_learning', 'tutorial_type']);
    if (!valid) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!price) {
      toast.error('Please select mode and type to see pricing');
      return;
    }
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data: RegistrationForm) => {
    if (!selectedTutorial) { toast.error('Please select a tutorial'); return; }
    setSubmitting(true);
    try {
      let paymentProofUrl: string | null = null;
      if (paymentProof) {
        setUploadingProof(true);
        try {
          paymentProofUrl = await withTimeout(uploadFile(paymentProof, 'payments'), 60_000, 'Payment proof upload');
        } finally { setUploadingProof(false); }
        if (!paymentProofUrl) { toast.error('Failed to upload payment proof'); return; }
      }

      const registrationId = createUuidV4();
      const insertPromise = (async () => {
        return await supabase.from('akboy_tutorial_registrations').insert({
          id: registrationId,
          tutorial_id: data.tutorial_id,
          full_name: data.full_name,
          phone: data.phone,
          email: data.email || null,
          gender: data.gender,
          academic_level: data.academic_level,
          tutorial_name: selectedTutorial.name,
          mode_of_learning: data.mode_of_learning,
          tutorial_type: data.tutorial_type,
          price: price,
          payment_proof_url: paymentProofUrl,
          guardian_name: data.guardian_name || null,
          guardian_phone: data.guardian_phone || null,
          referral_source: data.referral_source || null,
          special_requests: data.special_requests || null,
        });
      })();

      const { error: insertError } = await withTimeout(
        insertPromise,
        30_000,
        'Registration submission'
      );
      if (insertError) throw insertError;

      setSubmissionData({
        registrationId,
        tutorialName: selectedTutorial.name,
        price,
        whatsappLink: selectedTutorial.whatsapp_group_link,
      });
      toast.success('Registration submitted successfully!');
    } catch (error) {
      console.error('Registration error:', error);
      const isTimeout = error instanceof Error && /timed out/i.test(error.message);
      toast.error(isTimeout ? 'Network timeout. Please try again.' : 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Success Page
  if (submissionData) {
    return (
      <AkboyLayout>
        <div className="min-h-screen bg-emerald-50 py-16">
          <div className="container mx-auto px-4 max-w-lg">
            <div ref={printRef} className="print:p-8">
              <Card className="border-emerald-200 shadow-lg">
                <CardHeader className="text-center bg-emerald-50 rounded-t-lg">
                  <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                  </div>
                  <CardTitle className="text-2xl text-emerald-800">Registration Successful!</CardTitle>
                  <CardDescription className="text-emerald-600">Thank you for registering</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">ID:</span><span className="font-mono">{submissionData.registrationId.slice(0, 8).toUpperCase()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Tutorial:</span><span className="font-medium">{submissionData.tutorialName}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Amount:</span><span className="font-medium text-emerald-600">₦{submissionData.price.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Status:</span><span className="text-amber-600 font-medium">Pending Verification</span></div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                    <p className="text-amber-800 text-sm">Your registration will be confirmed once payment is verified. You'll be added to the WhatsApp group after verification.</p>
                  </div>
                  {submissionData.whatsappLink && (
                    <a href={submissionData.whatsappLink} target="_blank" rel="noopener noreferrer"
                      className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium">
                      Join WhatsApp Group
                    </a>
                  )}
                  <div className="flex gap-3 print:hidden">
                    <Button onClick={() => window.print()} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                      <Printer className="w-4 h-4 mr-2" /> Print
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = basePath || '/'} className="flex-1">Home</Button>
                  </div>
                  <p className="text-center text-xs text-gray-500 pt-2 border-t">Questions? 08101466977 | akboycreativehub@gmail.com</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AkboyLayout>
    );
  }

  return (
    <AkboyLayout>
      {/* Compact Hero */}
      <section className="bg-emerald-600 py-10 md:py-14">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">Tutorial Registration</h1>
          <p className="text-emerald-100 text-sm md:text-base">Choose a program, fill your details, and pay — it's that simple!</p>
        </div>
      </section>

      {/* Step Indicator */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
            {[
              { num: 1, label: "Choose" },
              { num: 2, label: "Details" },
              { num: 3, label: "Pay" },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step >= s.num ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
                </div>
                <span className={`text-xs font-medium hidden sm:inline ${step >= s.num ? 'text-emerald-700' : 'text-gray-400'}`}>
                  {s.label}
                </span>
                {i < 2 && <div className={`w-8 h-0.5 ${step > s.num ? 'bg-emerald-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* STEP 1: Choose Tutorial */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-center mb-2">Select a Tutorial</h2>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
            ) : (
              <div className="space-y-3">
                {tutorials.map((tutorial) => {
                  const Icon = tutorialIcons[tutorial.slug] || BookOpen;
                  return (
                    <Card
                      key={tutorial.id}
                      className="cursor-pointer hover:border-emerald-400 transition-colors active:scale-[0.99]"
                      onClick={() => selectTutorial(tutorial.id)}
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                        {tutorial.flyer_url ? (
                          <img src={tutorial.flyer_url} alt={tutorial.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                            <Icon className="w-7 h-7 text-emerald-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm">{tutorial.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{tutorial.description}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-emerald-600 shrink-0" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Personal Details + Tutorial Options */}
        {step === 2 && selectedTutorial && (
          <div className="space-y-6">
            <button onClick={() => { setStep(1); form.setValue('tutorial_id', ''); }} className="flex items-center gap-1 text-sm text-emerald-600 hover:underline">
              <ArrowLeft className="w-4 h-4" /> Change tutorial
            </button>

            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4 flex items-center gap-3">
                {selectedTutorial.flyer_url ? (
                  <img src={selectedTutorial.flyer_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-emerald-200 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-emerald-700" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-emerald-800">{selectedTutorial.name}</h3>
                  <p className="text-xs text-emerald-600">Selected tutorial</p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="font-semibold">Your Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Full Name *</Label>
                  <Input {...form.register('full_name')} placeholder="Your full name" />
                  {form.formState.errors.full_name && <p className="text-xs text-red-500">{form.formState.errors.full_name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Phone (WhatsApp) *</Label>
                  <Input {...form.register('phone')} placeholder="08101234567" />
                  {form.formState.errors.phone && <p className="text-xs text-red-500">{form.formState.errors.phone.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Gender *</Label>
                  <Select value={form.watch('gender')} onValueChange={(v) => form.setValue('gender', v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.gender && <p className="text-xs text-red-500">{form.formState.errors.gender.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Academic Level *</Label>
                  <Select value={form.watch('academic_level')} onValueChange={(v) => form.setValue('academic_level', v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sss1">SSS 1</SelectItem>
                      <SelectItem value="sss2">SSS 2</SelectItem>
                      <SelectItem value="sss3">SSS 3</SelectItem>
                      <SelectItem value="jamb_candidate">JAMB Candidate</SelectItem>
                      <SelectItem value="waec_candidate">WAEC Candidate</SelectItem>
                      <SelectItem value="neco_candidate">NECO Candidate</SelectItem>
                      <SelectItem value="undergraduate">Undergraduate</SelectItem>
                      <SelectItem value="graduate">Graduate</SelectItem>
                      <SelectItem value="working">Working Class</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.academic_level && <p className="text-xs text-red-500">{form.formState.errors.academic_level.message}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Learning Preference</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Mode *</Label>
                  <Select value={form.watch('mode_of_learning')} onValueChange={(v) => form.setValue('mode_of_learning', v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder="Online or Physical?" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="physical">Physical</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.mode_of_learning && <p className="text-xs text-red-500">{form.formState.errors.mode_of_learning.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Type *</Label>
                  <Select value={form.watch('tutorial_type')} onValueChange={(v) => form.setValue('tutorial_type', v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder="Group or Private?" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="group">Group Session</SelectItem>
                      <SelectItem value="private">Private Session</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.tutorial_type && <p className="text-xs text-red-500">{form.formState.errors.tutorial_type.message}</p>}
                </div>
              </div>

              {price > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-1">Your Fee</p>
                  <p className="text-3xl font-bold text-emerald-600">₦{price.toLocaleString()}</p>
                </div>
              )}
            </div>

            <Button onClick={goToPaymentStep} className="w-full bg-emerald-600 hover:bg-emerald-700 py-5" disabled={!price}>
              Continue to Payment <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* STEP 3: Payment & Submit */}
        {step === 3 && selectedTutorial && (
          <form onSubmit={form.handleSubmit(onSubmit, () => toast.error('Please check all fields'))} className="space-y-6">
            <button type="button" onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-emerald-600 hover:underline">
              <ArrowLeft className="w-4 h-4" /> Back to details
            </button>

            {/* Payment Summary */}
            <Card className="border-emerald-200">
              <CardContent className="p-5 space-y-3">
                <h3 className="font-semibold">Payment Summary</h3>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-gray-600">Tutorial:</span><span>{selectedTutorial.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Mode:</span><span className="capitalize">{modeOfLearning} {tutorialType}</span></div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-emerald-600">₦{price.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bank Details */}
            {paymentAccount && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-blue-800 mb-3">Transfer Payment To:</h3>
                  <div className="bg-white p-3 rounded-lg border border-blue-100 space-y-1 text-sm">
                    <p><span className="text-gray-500">Bank:</span> <span className="font-medium">{paymentAccount.bank_name}</span></p>
                    <p><span className="text-gray-500">Account:</span> <span className="font-bold font-mono text-lg">{paymentAccount.account_number}</span></p>
                    <p><span className="text-gray-500">Name:</span> <span className="font-medium">{paymentAccount.account_name}</span></p>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">Transfer exactly ₦{price.toLocaleString()} and upload proof below</p>
                </CardContent>
              </Card>
            )}

            {/* Payment Proof */}
            <div className="space-y-2">
              <Label>Upload Proof of Payment</Label>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && file.size <= 5 * 1024 * 1024) setPaymentProof(file);
                  else if (file) toast.error('File must be less than 5MB');
                }}
              />
              {paymentProof && <p className="text-xs text-emerald-600">✓ {paymentProof.name}</p>}
              {uploadingProof && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>

            {/* Optional: Guardian & Extras */}
            <details className="group">
              <summary className="cursor-pointer text-sm text-emerald-600 font-medium hover:underline">
                + Add guardian info / special requests (optional)
              </summary>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Guardian Name</Label>
                    <Input {...form.register('guardian_name')} placeholder="Parent/Guardian name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Guardian Phone</Label>
                    <Input {...form.register('guardian_phone')} placeholder="08101234567" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Email (optional)</Label>
                  <Input {...form.register('email')} type="email" placeholder="your@email.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>How did you hear about us?</Label>
                  <Select value={form.watch('referral_source')} onValueChange={(v) => form.setValue('referral_source', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="referral">Friend/Referral</SelectItem>
                      <SelectItem value="social_media">Social Media</SelectItem>
                      <SelectItem value="school">School</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Special Requests</Label>
                  <Textarea {...form.register('special_requests')} placeholder="Any specific needs..." rows={2} />
                </div>
              </div>
            </details>

            {/* Agreement */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="agreement"
                checked={form.watch('agreement')}
                onCheckedChange={(checked) => form.setValue('agreement', checked as boolean, { shouldValidate: true })}
              />
              <Label htmlFor="agreement" className="text-xs text-gray-600 leading-relaxed cursor-pointer">
                I confirm that the information provided is correct and understand my registration is confirmed only after payment verification.
              </Label>
            </div>
            {form.formState.errors.agreement && <p className="text-xs text-red-500">{form.formState.errors.agreement.message}</p>}

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 py-5 text-base" disabled={submitting}>
              {submitting ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</>) : (<><Upload className="w-5 h-5 mr-2" /> Submit Registration</>)}
            </Button>

            <p className="text-center text-xs text-gray-500">
              Questions? <a href="tel:08101466977" className="text-emerald-600">08101466977</a> | <a href="mailto:akboycreativehub@gmail.com" className="text-emerald-600">akboycreativehub@gmail.com</a>
            </p>
          </form>
        )}
      </div>
    </AkboyLayout>
  );
}

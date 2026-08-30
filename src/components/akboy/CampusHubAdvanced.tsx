import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  MessageCircle, GraduationCap, Calculator as CalcIcon, Sparkles, Mail, ArrowRight, CheckCircle2, Star,
} from "lucide-react";

const WHATSAPP = "2348101466977"; // AKBOY consultancy

/* -------------------- Floating WhatsApp -------------------- */
export const WhatsAppConsultButton = () => {
  const msg = encodeURIComponent("Hello AKBOY, I'd like to book a free admission consultation.");
  const href = `https://wa.me/${WHATSAPP}?text=${msg}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-akboy-paper/20 bg-akboy-forest py-3 pl-4 pr-5 text-akboy-paper shadow-lg transition-transform hover:scale-[1.03] hover:bg-akboy-moss"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="text-sm font-bold hidden sm:inline">Free Consult</span>
    </a>
  );
};

/* -------------------- Consultation Booking -------------------- */
const consultSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100),
  whatsapp: z.string().trim().min(7, "Enter a valid phone").max(20),
  email: z.string().trim().email("Valid email required").max(255),
  current_level: z.string().max(80).optional().or(z.literal("")),
  target_school: z.string().max(120).optional().or(z.literal("")),
  target_course: z.string().max(120).optional().or(z.literal("")),
  jamb_score: z.string().optional(),
  message: z.string().max(1000).optional().or(z.literal("")),
});

export const ConsultationBookingForm = ({ trigger }: { trigger?: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", whatsapp: "", email: "", current_level: "",
    target_school: "", target_course: "", jamb_score: "", message: "",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = consultSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Please check the form");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        whatsapp: form.whatsapp,
        current_level: form.current_level || null,
        target_school: form.target_school || null,
        target_course: form.target_course || null,
        jamb_score: form.jamb_score ? parseInt(form.jamb_score, 10) : null,
        message: form.message || null,
      };
      const { error } = await supabase.from("campus_hub_consultations" as any).insert(payload);
      if (error) throw error;
      toast.success("Booking received — we'll reach out on WhatsApp shortly.");
      setOpen(false);
      setForm({ name: "", whatsapp: "", email: "", current_level: "", target_school: "", target_course: "", jamb_score: "", message: "" });
    } catch (err: any) {
      toast.error(err.message || "Could not submit booking");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" className="bg-akboy-forest hover:bg-akboy-moss text-white font-bold">
            <GraduationCap className="w-4 h-4 mr-2" /> Book Free Consultation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Free Admission Consultation</DialogTitle>
          <p className="text-sm text-muted-foreground">Tell us about your goals — we'll guide you to the right school & course.</p>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3 mt-2">
          <Input placeholder="Full name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="WhatsApp *" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            <Input type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Current level (e.g. SS3)" value={form.current_level} onChange={(e) => setForm({ ...form, current_level: e.target.value })} />
            <Input placeholder="JAMB score (optional)" type="number" value={form.jamb_score} onChange={(e) => setForm({ ...form, jamb_score: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Target school" value={form.target_school} onChange={(e) => setForm({ ...form, target_school: e.target.value })} />
            <Input placeholder="Target course" value={form.target_course} onChange={(e) => setForm({ ...form, target_course: e.target.value })} />
          </div>
          <Textarea placeholder="Anything else we should know?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <Button type="submit" disabled={submitting} className="w-full bg-akboy-forest hover:bg-akboy-moss text-white font-bold">
            {submitting ? "Submitting…" : "Submit & Get Reply"}
          </Button>
          <a
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hi AKBOY, I'd like to book a consultation.")}`}
            target="_blank" rel="noopener noreferrer"
            className="block text-center text-sm font-semibold text-akboy-forest hover:underline"
          >
            Or chat with us directly on WhatsApp →
          </a>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* -------------------- Eligibility Checker -------------------- */
const SCHOOL_CUTOFFS: { name: string; cutoff: number }[] = [
  { name: "University of Lagos (UNILAG)", cutoff: 200 },
  { name: "University of Ibadan (UI)", cutoff: 200 },
  { name: "OAU", cutoff: 200 },
  { name: "Lagos State University (LASU)", cutoff: 180 },
  { name: "Uniosun", cutoff: 180 },
  { name: "Federal Universities (most)", cutoff: 180 },
  { name: "State Universities (most)", cutoff: 160 },
  { name: "Polytechnics & Colleges of Education", cutoff: 150 },
];

export const EligibilityChecker = () => {
  const [score, setScore] = useState("");
  const [oLevel, setOLevel] = useState("5");
  const num = parseInt(score, 10);
  const matches = useMemo(
    () => (Number.isFinite(num) && num > 0 ? SCHOOL_CUTOFFS.filter((s) => num >= s.cutoff) : []),
    [num]
  );
  const insufficientOLevel = parseInt(oLevel, 10) < 5;

  return (
    <Card className="rounded-xl border border-akboy-line bg-akboy-paper p-6 shadow-none md:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="grid h-12 w-12 place-items-center rounded-lg bg-akboy-forest text-akboy-paper">
          <CalcIcon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-akboy-forest font-bold">Free Tool</p>
          <h3 className="font-editorial text-xl font-semibold text-akboy-forest">Admission Eligibility Checker</h3>
        </div>
      </div>
      <p className="text-sm text-akboy-muted mb-4">Enter your JAMB score and O'Level credits to see which schools you may qualify for.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Input type="number" placeholder="JAMB score (e.g. 230)" value={score} onChange={(e) => setScore(e.target.value)} />
        <Select value={oLevel} onValueChange={setOLevel}>
          <SelectTrigger><SelectValue placeholder="O'Level credits" /></SelectTrigger>
          <SelectContent>
            {[3, 4, 5, 6, 7, 8, 9].map((n) => <SelectItem key={n} value={String(n)}>{n} credits (incl. Eng & Maths)</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {num > 0 && (
        <div className="mt-5">
          {insufficientOLevel ? (
            <p className="text-sm font-semibold text-akboy-forest bg-akboy-butter/30 border border-akboy-line rounded-none p-3">
              You'll typically need at least 5 O'Level credits (including English and Maths) for university admission.
            </p>
          ) : matches.length === 0 ? (
            <p className="text-sm font-semibold text-akboy-forest bg-akboy-bone border border-akboy-line rounded-none p-3">
              Your score is below most cut-off marks. Consider Polytechnics, IJMB, or a JAMB rewrite — we can guide you.
            </p>
          ) : (
            <>
              <p className="text-sm font-bold text-akboy-forest mb-2">You may qualify for {matches.length} of these tracks:</p>
              <ul className="space-y-1.5">
                {matches.map((s) => (
                  <li key={s.name} className="flex items-center gap-2 text-sm text-akboy-forest">
                    <CheckCircle2 className="w-4 h-4 text-akboy-forest flex-shrink-0" />
                    <span><strong>{s.name}</strong> <span className="text-xs text-akboy-muted">(cutoff ~{s.cutoff})</span></span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <ConsultationBookingForm
            trigger={
              <Button className="mt-4 bg-akboy-forest hover:bg-akboy-moss text-white font-semibold">
                Get personalized advice <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            }
          />
        </div>
      )}
      <p className="mt-4 text-[11px] text-akboy-muted">* Cut-offs are indicative — actual departmental cut-offs vary year to year.</p>
    </Card>
  );
};

/* -------------------- Newsletter Signup -------------------- */
const subSchema = z.object({
  email: z.string().trim().email("Valid email required").max(255),
  whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
});

export const NewsletterSignup = () => {
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = subSchema.safeParse({ email, whatsapp });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message); return; }
    setBusy(true);
    try {
      const { error } = await supabase.from("campus_hub_subscribers" as any).insert({
        email, whatsapp: whatsapp || null,
      });
      if (error) throw error;
      setDone(true);
      toast.success("You're in! Watch for updates.");
    } catch (err: any) {
      toast.error(err.message || "Could not subscribe");
    } finally { setBusy(false); }
  };

  return (
    <div id="newsletter" className="rounded-xl bg-akboy-forest p-8 text-akboy-paper md:p-10">
      <div className="flex items-center gap-3 mb-3">
        <Mail className="w-6 h-6" />
        <h3 className="font-editorial text-2xl md:text-3xl font-semibold">Get admission alerts first</h3>
      </div>
      <p className="text-white/80 text-sm mb-5">Drop your email and (optionally) WhatsApp — we'll send fresh scholarships, JAMB news and admission updates.</p>
      {done ? (
        <div className="flex items-center gap-2 bg-white/10 rounded-none p-4 text-white/80 font-semibold">
          <CheckCircle2 className="w-5 h-5" /> You're subscribed.
        </div>
      ) : (
        <form onSubmit={submit} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3">
          <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 border-0 bg-akboy-paper text-akboy-forest" />
          <Input type="tel" placeholder="WhatsApp (optional)" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="h-12 border-0 bg-akboy-paper text-akboy-forest" />
          <Button type="submit" disabled={busy} className="bg-akboy-butter hover:bg-akboy-butter/80 text-akboy-forest font-bold h-12 px-6">
            {busy ? "…" : "Subscribe"}
          </Button>
        </form>
      )}
    </div>
  );
};

/* -------------------- Personalized Recommendations -------------------- */
const PREF_KEY = "campus_hub_prefs_v1";
type Prefs = { school?: string; interest?: string };

export const PersonalizedRecommendations = ({
  posts,
  schools,
}: {
  posts: any[];
  schools: { school: string; count: number }[];
}) => {
  const [prefs, setPrefs] = useState<Prefs>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREF_KEY);
      if (raw) setPrefs(JSON.parse(raw));
    } catch {}
  }, []);
  const save = (p: Prefs) => {
    setPrefs(p);
    try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch {}
  };

  const interests = ["Admissions", "Scholarships", "Exams & JAMB", "Career & Internships", "Academic Calendar"];
  const recs = useMemo(() => {
    if (!prefs.school && !prefs.interest) return [];
    return posts
      .filter((p) =>
        (!prefs.school || p.school === prefs.school) &&
        (!prefs.interest || (p.category || "News & Updates") === prefs.interest)
      )
      .slice(0, 6);
  }, [posts, prefs]);

  return (
    <Card className="rounded-xl border border-akboy-line bg-akboy-paper p-6 shadow-none md:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="grid h-12 w-12 place-items-center rounded-lg bg-akboy-forest text-akboy-paper">
          <Star className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-akboy-forest font-bold">For You</p>
          <h3 className="font-editorial text-xl font-semibold text-akboy-forest">Personalized recommendations</h3>
        </div>
      </div>
      <p className="text-sm text-akboy-muted mb-4">Pick your school and main interest — we'll surface the most relevant posts.</p>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <Select value={prefs.school || "any"} onValueChange={(v) => save({ ...prefs, school: v === "any" ? undefined : v })}>
          <SelectTrigger><SelectValue placeholder="Your school" /></SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="any">Any school</SelectItem>
            {schools.map((s) => <SelectItem key={s.school} value={s.school}>{s.school}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={prefs.interest || "any"} onValueChange={(v) => save({ ...prefs, interest: v === "any" ? undefined : v })}>
          <SelectTrigger><SelectValue placeholder="Your interest" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any topic</SelectItem>
            {interests.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {recs.length === 0 ? (
        <p className="text-sm text-akboy-muted italic">Pick at least one preference above to see your feed.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {recs.map((p) => (
            <Link key={p.id} to={`/blog/${p.slug || p.id}`} className="group block rounded-none border border-akboy-line p-3 hover:border-akboy-forest hover:bg-akboy-bone transition">
              <p className="text-[10px] font-bold text-akboy-forest uppercase mb-1">{p.category || "News"}</p>
              <p className="text-sm font-semibold text-akboy-forest line-clamp-2 group-hover:text-akboy-forest">{p.title}</p>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
};

/* -------------------- Combined section -------------------- */
export const CampusHubAdvancedSection = ({
  posts, schools,
}: { posts: any[]; schools: { school: string; count: number }[] }) => {
  return (
    <section className="border-t border-akboy-line bg-akboy-mist px-5 py-16 sm:px-8 md:py-24">
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-10 max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-akboy-line bg-akboy-paper px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-akboy-forest">
            <Sparkles className="w-3.5 h-3.5" /> Smart Tools
          </div>
          <h2 className="font-editorial text-[clamp(2rem,4.5vw,3rem)] font-semibold leading-tight text-akboy-forest">Useful tools for your next move</h2>
          <p className="mt-2 text-akboy-muted">Check your options, personalize your reading and speak with an admission consultant.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <EligibilityChecker />
          <PersonalizedRecommendations posts={posts} schools={schools} />
        </div>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
          <Card className="rounded-xl border border-akboy-forest bg-akboy-forest p-6 text-akboy-paper shadow-none md:p-8">
            <div className="flex items-center gap-3 mb-3">
              <GraduationCap className="w-6 h-6 text-akboy-butter" />
              <h3 className="font-editorial text-2xl md:text-3xl font-semibold">Free Admission Consultation</h3>
            </div>
            <p className="text-white/80 text-sm md:text-base mb-5">
              Stuck on choosing a course, school or how to use your JAMB score? Talk to AKBOY's admission team — guidance tailored to you.
            </p>
            <div className="flex flex-wrap gap-3">
              <ConsultationBookingForm
                trigger={
                  <Button size="lg" className="bg-akboy-butter hover:bg-akboy-butter/80 text-akboy-forest font-bold">
                    Book Free Consultation
                  </Button>
                }
              />
              <a
                href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hi AKBOY, I need admission guidance.")}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border-2 border-white/30 bg-transparent px-6 py-2.5 text-sm font-bold text-white hover:bg-white/10"
              >
                <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
              </a>
            </div>
          </Card>

          <NewsletterSignup />
        </div>
      </div>
    </section>
  );
};

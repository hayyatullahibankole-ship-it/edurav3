import jambLogo from "@/assets/exam-jamb.png";
import waecLogo from "@/assets/exam-waec.png";
import necoLogo from "@/assets/exam-neco.png";
import postUtmeLogo from "@/assets/exam-post-utme.jpg";
import nabtebLogoAsset from "@/assets/exam-nabteb.png.asset.json";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Download,
  GraduationCap,
  LineChart,
  Plus,
  ShieldCheck,
  Sparkles,
  Ticket,
  Timer,
  WifiOff,
  BookOpen,
  Newspaper,
} from "lucide-react";
import { Link } from "react-router-dom";

import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useInstalledApp } from "@/hooks/useInstalledApp";
import { useIsMobile } from "@/hooks/use-mobile";

const Home = () => {
  const { user } = useAuth();
  const { isInstalledApp } = useInstalledApp();
  const isMobile = useIsMobile();
  const isMobileWeb = isMobile && !isInstalledApp;

  const primaryHref = isMobileWeb ? "/auth" : user ? "/dashboard" : "/auth";

  const pillars = [
    {
      no: "01",
      title: "CBT Excellence",
      body:
        "120,000+ past questions with full explanations. Works offline, replicates the real JAMB and WAEC exam environment, and breaks down every attempt so you know exactly what to fix.",
    },
    {
      no: "02",
      title: "Service Desk",
      body:
        "No more queuing at a cybercafé. Buy WAEC, NECO and NABTEB result checker PINs instantly, run Post-UTME and admission processing, and track every request from one dashboard.",
    },
    {
      no: "03",
      title: "Smart Wallet",
      body:
        "Get a dedicated Nigerian account number automatically. Fund by bank transfer and pay for PINs, forms and services in one tap — no card details, no failed checkouts.",
    },
  ];

  const services = [
    {
      icon: Ticket,
      title: "Result checker PINs",
      body: "WAEC, NECO and NABTEB PINs delivered to your screen seconds after payment.",
      tag: "Instant",
    },
    {
      icon: ClipboardCheck,
      title: "Admissions & Post-UTME",
      body: "We fill and submit your form. Pricing follows your institution's own fee.",
      tag: "Done for you",
    },
    {
      icon: CreditCard,
      title: "Edura Wallet",
      body: "A dedicated account number, funded from any bank, spendable anywhere on Edura.",
      tag: "Dedicated NUBAN",
    },
    {
      icon: GraduationCap,
      title: "JAMB services",
      body: "Profile codes, e-PINs and correction of data, handled by people who do it daily.",
      tag: "Verified",
    },
  ];

  const practiceFeatures = [
    { icon: Timer, title: "Real exam conditions", body: "180 questions in 120 minutes for JAMB, per-paper timing for WAEC." },
    { icon: LineChart, title: "Analytics that teach", body: "Weak topics, streaks and score trends after every single attempt." },
    { icon: WifiOff, title: "Works offline", body: "Download a paper, write it with no data, it syncs when you're back." },
    { icon: BookOpen, title: "Past questions 2015–2025", body: "Explanations, syllabus coverage, video lessons and a study planner." },
  ];

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* ============ HERO — Deep Ink command center ============ */}
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <div className="pointer-events-none absolute -top-40 right-0 h-[38rem] w-[38rem] rounded-full bg-primary/10 blur-[140px]" />

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-16 items-center">
            {/* Copy */}
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-ink-soft px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  The complete student ecosystem
                </span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight">
                Master your exams.
                <br />
                <span className="text-primary">Manage your future.</span>
              </h1>

              <p className="max-w-xl text-base md:text-lg leading-relaxed text-ink-foreground/70">
                Nigeria's most advanced platform for students. Take realistic CBT simulations for JAMB, WAEC, NECO and
                Post-UTME, then handle every result PIN, admission form and payment through a wallet with your own
                dedicated bank account.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to={primaryHref}>
                  <Button size="lg" className="h-12 px-8 text-base font-bold text-ink hover:bg-primary-hover">
                    Get started free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/demo-test">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-8 text-base font-bold border-white/15 bg-ink-soft text-ink-foreground hover:bg-ink-soft/70 hover:text-ink-foreground"
                  >
                    Try a free demo test
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="text-xs uppercase tracking-wide text-ink-foreground/50">Built for</span>
                {[jambLogo, waecLogo, necoLogo, postUtmeLogo, nabtebLogoAsset.url].map((src, i) => (
                  <span
                    key={src}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm"
                  >
                    <img
                      src={src}
                      alt={["JAMB", "WAEC", "NECO", "Post-UTME", "NABTEB"][i] + " logo"}
                      loading="lazy"
                      className="h-full w-full object-contain"
                    />
                  </span>
                ))}
              </div>



              <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-6 border-t border-white/10">
                {[
                  { v: "120,000+", l: "Practice questions" },
                  { v: "50,000+", l: "Students" },
                  { v: "Instant", l: "PIN delivery" },
                ].map((s, i) => (
                  <div key={s.l} className="flex items-center gap-6 sm:gap-8">
                    {i > 0 && <div className="hidden sm:block h-8 w-px bg-white/10" />}
                    <div>
                      <div className="font-display text-2xl font-bold">{s.v}</div>
                      <div className="text-xs text-ink-foreground/50">{s.l}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Product surfaces */}
            <div className="relative">
              <div className="pointer-events-none absolute -inset-16 rounded-full bg-primary/5 blur-[120px]" />

              <div className="relative grid grid-cols-12 gap-4 pb-8 lg:pb-0">
                {/* CBT engine */}
                <div className="col-span-12 sm:col-span-10 lg:col-span-9 rounded-2xl border border-white/10 bg-ink-soft shadow-2xl overflow-hidden lg:-rotate-2">
                  <div className="flex items-center justify-between border-b border-white/5 bg-ink px-4 py-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-foreground/40">
                      Edura CBT engine
                    </span>
                    <div className="flex gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-destructive/50" />
                      <span className="h-2 w-2 rounded-full bg-warning/50" />
                      <span className="h-2 w-2 rounded-full bg-primary/60" />
                    </div>
                  </div>

                  <div className="space-y-4 p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display text-sm font-bold text-primary">JAMB — Use of English</h4>
                      <span className="rounded border border-destructive/30 bg-destructive/15 px-2 py-1 text-[10px] font-semibold text-destructive tabular-nums">
                        01:42:05
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-sm font-medium">
                        Choose the option most nearly opposite in meaning to the underlined word.
                      </p>
                      <p className="text-xs italic text-ink-foreground/60">
                        The principal was <u>adamant</u> about the new school rules.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs">A. Flexible</div>
                      <div className="rounded-lg border border-primary bg-primary/10 p-3 text-xs font-medium">
                        B. Unyielding
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs">C. Indifferent</div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex gap-1.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-[10px] font-bold text-ink">1</span>
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-white/10 text-[10px]">2</span>
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-white/10 text-[10px]">3</span>
                      </div>
                      <span className="rounded bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide">
                        Next question
                      </span>
                    </div>
                  </div>
                </div>

                {/* Wallet & services */}
                <div className="col-span-12 sm:col-span-8 sm:col-start-5 lg:col-span-7 lg:col-start-6 lg:-mt-24 rounded-2xl border border-white/60 bg-card text-card-foreground shadow-2xl overflow-hidden lg:rotate-3">
                  <div className="space-y-4 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                          Available balance
                        </p>
                        <h3 className="font-display text-2xl font-bold tabular-nums">₦24,850.00</h3>
                      </div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <Plus className="h-4 w-4 text-primary-foreground" />
                      </span>
                    </div>

                    <div className="rounded-xl bg-surface p-3">
                      <p className="text-[9px] font-bold uppercase text-muted-foreground">Dedicated account</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="font-mono text-xs font-bold tracking-wider tabular-nums">8234991022</span>
                        <span className="rounded border border-border bg-card px-1.5 py-0.5 text-[9px]">Wema Bank</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Quick services</p>
                      <div className="grid grid-cols-2 gap-2">
                        {["WAEC PIN", "JAMB e-PIN"].map((s) => (
                          <div key={s} className="flex flex-col items-center gap-1 rounded-lg bg-surface p-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-card shadow-sm">
                              <Ticket className="h-3 w-3 text-primary" />
                            </span>
                            <span className="text-[9px] font-bold">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/15">
                          <Check className="h-3 w-3 text-primary" />
                        </span>
                        <div>
                          <p className="text-[10px] font-bold">WAEC checker PIN</p>
                          <p className="text-[9px] text-muted-foreground">Delivered • 2m ago</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-destructive tabular-nums">-₦3,500</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Three pillars */}
          <div className="mt-20 grid gap-10 border-t border-white/10 pt-12 md:grid-cols-3 md:gap-12">
            {pillars.map((p) => (
              <div key={p.no}>
                <h3 className="font-display text-xl md:text-2xl font-bold text-primary mb-3">
                  {p.no}. {p.title}
                </h3>
                <p className="text-sm leading-relaxed text-ink-foreground/60">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SERVICES ============ */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Student services</span>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-bold text-foreground">
              Errands that used to cost you a trip to town
            </h2>
            <p className="mt-3 text-muted-foreground">
              Pay with your card or wallet. Automated services deliver instantly; the rest are fulfilled and tracked by our team.
            </p>
          </div>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <s.icon className="h-5 w-5 text-primary" />
                  </span>
                  <Badge variant="secondary" className="rounded-full text-[10px] font-semibold uppercase tracking-wide">
                    {s.tag}
                  </Badge>
                </div>
                <h3 className="mt-5 font-display text-base font-bold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>

          <Link to="/services" className="mt-8 inline-block">
            <Button size="lg" variant="outline" className="border-2 font-semibold">
              Browse all services
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ============ PRACTICE ============ */}
      <section className="pb-16 md:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-surface p-8 md:p-12">
            <div className="grid lg:grid-cols-[1fr,1.1fr] gap-10 items-center">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">CBT practice</span>
                <h2 className="mt-4 font-display text-3xl md:text-4xl font-bold text-foreground">
                  Practice that behaves exactly like the real exam
                </h2>
                <p className="mt-3 text-muted-foreground">
                  The same layout, the same clock, the same pressure — so exam day feels like something you've already done.
                </p>
                <div className="mt-7 flex flex-col sm:flex-row gap-3">
                  <Link to="/demo-test">
                    <Button size="lg" className="w-full sm:w-auto font-semibold">
                      Try a free demo test
                    </Button>
                  </Link>
                  <Link to="/resources">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 font-semibold">
                      See resources
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {practiceFeatures.map((f) => (
                  <div key={f.title} className="rounded-2xl border border-border bg-card p-5">
                    <f.icon className="h-5 w-5 text-primary" />
                    <div className="mt-3 font-display text-sm font-bold text-foreground">{f.title}</div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SCHOOLS ============ */}
      <section className="pb-16 md:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-[1.2fr,1fr] gap-8 items-center rounded-3xl border border-border bg-card p-8 md:p-12">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <Building2 className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">For schools</span>
              </div>
              <h2 className="mt-4 font-display text-3xl md:text-4xl font-bold text-foreground">
                Run your school's CBT on Edura
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Create exams, upload your own question bank, assign students and get ranked performance reports per class.
                Mock exams are free — pay only when you're ready for full exams and reports.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Link to="/school-landing">
                  <Button size="lg" className="w-full sm:w-auto font-semibold">
                    Register your school
                  </Button>
                </Link>
                <Link to="/school-login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 font-semibold">
                    School login
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid gap-3">
              {[
                { icon: ShieldCheck, t: "Anti-cheat & proctoring", d: "Tab locking, shuffling and timed submission." },
                { icon: LineChart, t: "Ranked reports", d: "Class averages, per-subject breakdowns, printable sheets." },
                { icon: ClipboardCheck, t: "Bulk question upload", d: "CSV import for thousands of questions at once." },
              ].map((x) => (
                <div key={x.t} className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4">
                  <x.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <div className="font-display text-sm font-bold text-foreground">{x.t}</div>
                    <div className="text-sm text-muted-foreground">{x.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ EDURA CAMPUS ============ */}
      <section className="pb-16 md:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-surface p-8 md:p-12">
            <div className="grid lg:grid-cols-[1fr,1.1fr] gap-10 items-center">
              <div>
                <div className="flex items-center gap-2 text-primary">
                  <GraduationCap className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em]">Edura Campus</span>
                </div>
                <h2 className="mt-4 font-display text-3xl md:text-4xl font-bold text-foreground">
                  Already admitted? Your account grows with you
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Tap “I've been admitted” and Edura switches to Campus mode — course materials, past papers and CGPA
                  tracking for university, polytechnic and college students. Everything you built as a candidate carries over.
                </p>
                <div className="mt-7 flex flex-col sm:flex-row gap-3">
                  <Link to="/campus-landing">
                    <Button size="lg" className="w-full sm:w-auto font-semibold">
                      Explore Campus
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 font-semibold">
                      Start using Campus
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: BookOpen, t: "Course materials", d: "Lecture notes, handouts and past papers by department and level." },
                  { icon: ClipboardCheck, t: "Project support", d: "Topic ideas, structure guides and supervision-ready templates." },
                  { icon: LineChart, t: "CGPA tools", d: "Track results semester by semester and plan the grades you need." },
                  { icon: Sparkles, t: "Opportunities", d: "Scholarships, internships and campus openings as they drop." },
                ].map((x) => (
                  <div key={x.t} className="rounded-2xl border border-border bg-card p-5">
                    <x.icon className="h-5 w-5 text-primary" />
                    <div className="mt-3 font-display text-sm font-bold text-foreground">{x.t}</div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{x.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ THE APP ============ */}
      <section className="pb-16 md:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-3xl border border-border bg-ink p-8 md:p-12 text-ink-foreground">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-primary">
                <Download className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">Edura app</span>
              </div>
              <h2 className="mt-3 font-display text-2xl md:text-3xl font-bold">
                Practise offline, right from your phone
              </h2>
              <p className="mt-2 text-ink-foreground/60">
                Install Edura in one tap — full CBT engine, downloadable papers, streaks and your wallet, all working
                without data. No app store account needed.
              </p>
            </div>
            <Link to="/install-app" className="shrink-0">
              <Button size="lg" className="h-12 w-full md:w-auto px-8 text-base font-bold text-ink">
                Install the app
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>


      {/* ============ AKBOY CAMPUS HUB ============ */}
      <section className="pb-16 md:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-3xl border border-border bg-card p-8 md:p-10">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-primary">
                <Newspaper className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">Campus Hub</span>
              </div>
              <h2 className="mt-3 font-display text-2xl md:text-3xl font-bold text-foreground">
                News, scholarships and admission updates
              </h2>
              <p className="mt-2 text-muted-foreground">
                Daily education news, JAMB and WAEC notices, scholarship openings and study guides — all in the Akboy Campus Hub.
              </p>
            </div>
            <Link to="/campus-hub" className="shrink-0">
              <Button size="lg" className="h-12 w-full md:w-auto px-8 text-base font-semibold">
                Visit Akboy Campus Hub
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>


      {/* ============ FINAL CTA ============ */}
      <section className="bg-ink py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="mx-auto max-w-3xl font-display text-3xl md:text-5xl font-bold leading-tight text-ink-foreground">
            Everything a Nigerian student needs, in one place
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-foreground/60">
            Free to start. No card required to practise.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link to={primaryHref}>
              <Button size="lg" className="h-12 w-full sm:w-auto px-8 text-base font-bold text-ink">
                Get started free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/install-app">
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full sm:w-auto border-white/20 bg-transparent px-8 text-base font-bold text-ink-foreground hover:bg-ink-soft hover:text-ink-foreground"
              >
                <Download className="mr-2 h-5 w-5" />
                Get the app
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-foreground/50">
            {["Offline CBT", "Instant PINs", "Dedicated wallet account", "School exams"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;

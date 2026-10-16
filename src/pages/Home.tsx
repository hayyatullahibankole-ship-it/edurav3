import { useState } from "react";
import jambLogo from "@/assets/exam-jamb.png";
import waecLogo from "@/assets/exam-waec.png";
import necoLogo from "@/assets/exam-neco.png";
import postUtmeLogo from "@/assets/exam-post-utme.jpg";
import nabtebLogo from "@/assets/exam-nabteb.png";
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
import PlayStoreBanner from "@/components/PlayStoreBanner";
import { PLAY_STORE_URL } from "@/lib/playStore";
import { useAuth } from "@/hooks/useAuth";
import { useInstalledApp } from "@/hooks/useInstalledApp";
import { useIsMobile } from "@/hooks/use-mobile";

const isAndroid =
  typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

const Home = () => {
  const { user } = useAuth();
  const [sampleAnswer, setSampleAnswer] = useState<string | null>(null);
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
      <PlayStoreBanner />
      {/* Homepage hero: product-led, interactive and focused on learning progress. */}
      <section className="relative isolate overflow-hidden bg-ink text-ink-foreground">
        <div aria-hidden="true" className="pointer-events-none absolute right-[-8rem] top-[-8rem] h-[26rem] w-[26rem] rounded-full border border-primary/15 sm:right-[-4rem] sm:top-[-6rem] sm:h-[38rem] sm:w-[38rem]" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-[-10rem] left-[28%] h-[22rem] w-[22rem] rounded-full bg-primary/10 blur-3xl" />

        <div className="relative container mx-auto grid items-center gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:px-8 lg:pb-24 lg:pt-24">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              PRACTISE WITH PURPOSE
            </div>

            <h1 className="font-display text-[2.65rem] font-extrabold leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              Don't just practise.
              <span className="mt-2 block text-primary">Know what to fix next.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-ink-foreground/75 sm:text-lg sm:leading-8">
              Prepare for JAMB, WAEC, NECO and Post-UTME with CBT practice, explanations and tools that help you turn each attempt into your next step.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to={primaryHref} className="inline-flex">
                <Button size="lg" className="h-13 w-full rounded-xl px-7 text-base font-extrabold text-ink shadow-lg shadow-primary/10 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-primary-hover sm:w-auto">
                  Start learning free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/demo-test" className="inline-flex">
                <Button size="lg" variant="outline" className="h-13 w-full rounded-xl border-white/20 bg-white/5 px-7 text-base font-bold text-ink-foreground transition-colors hover:bg-white/10 hover:text-ink-foreground sm:w-auto">
                  Take a demo test
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 border-t border-white/10 pt-6 text-sm text-ink-foreground/70">
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Exam-focused practice</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Learn from mistakes</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Track your progress</span>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                {[jambLogo, waecLogo, necoLogo, postUtmeLogo].map((src, i) => (
                  <span key={src} className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-white p-1.5">
                    <img src={src} alt={["JAMB", "WAEC", "NECO", "Post-UTME"][i]} loading="lazy" className="h-full w-full object-contain" />
                  </span>
                ))}
              </div>
              <p className="text-xs leading-5 text-ink-foreground/55">One place for your exam preparation journey.</p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
            <div aria-hidden="true" className="absolute -inset-3 rotate-2 rounded-[2rem] bg-primary/15 sm:-inset-5" />
            <div className="relative overflow-hidden rounded-[1.6rem] border border-white/15 bg-background text-foreground shadow-2xl shadow-black/25 transition-transform duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">Try it now</p>
                  <h2 className="mt-1 font-display text-lg font-extrabold">One question. One useful lesson.</h2>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">Sample</span>
              </div>

              <div className="p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-muted-foreground">USE OF ENGLISH</span>
                  <span className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary">Vocabulary</span>
                </div>
                <p className="text-base font-semibold leading-7 sm:text-lg">
                  Choose the option <span className="underline decoration-primary decoration-2 underline-offset-4">opposite</span> in meaning to the word below.
                </p>
                <p className="mt-3 rounded-xl bg-muted/70 px-4 py-3 text-sm leading-6">
                  The principal remained <strong>adamant</strong> despite the students' complaints.
                </p>
                <div className="mt-4 space-y-2.5">
                  {[
                    { key: "A", label: "Flexible" },
                    { key: "B", label: "Unyielding" },
                    { key: "C", label: "Indifferent" },
                    { key: "D", label: "Decisive" },
                  ].map((option) => {
                    const isCorrect = option.key === "A";
                    const isSelected = sampleAnswer === option.key;
                    const revealed = sampleAnswer !== null;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSampleAnswer(option.key)}
                        className={cn(
                          "group flex min-h-12 w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                          isSelected && isCorrect && "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                          isSelected && !isCorrect && "border-destructive bg-destructive/5 text-destructive",
                          !isSelected && revealed && isCorrect && "border-emerald-500/60 bg-emerald-500/5",
                          !isSelected && !(revealed && isCorrect) && "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
                        )}
                      >
                        <span className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-extrabold transition-colors",
                          isSelected && isCorrect && "border-emerald-500 bg-emerald-500 text-white",
                          isSelected && !isCorrect && "border-destructive bg-destructive text-white",
                          !isSelected && revealed && isCorrect && "border-emerald-500 bg-emerald-500 text-white",
                          !isSelected && !(revealed && isCorrect) && "border-border bg-muted group-hover:border-primary/50"
                        )}>
                          {revealed && isCorrect ? <Check className="h-4 w-4" /> : option.key}
                        </span>
                        <span className="flex-1">{option.label}</span>
                        {isSelected && <span className="text-xs font-bold">{isCorrect ? "Correct" : "Your answer"}</span>}
                      </button>
                    );
                  })}
                </div>

                {sampleAnswer !== null && (
                  <div aria-live="polite" className={cn(
                    "mt-4 rounded-xl border p-4 text-sm leading-6 animate-fade-in",
                    sampleAnswer === "A" ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-muted/60"
                  )}>
                    <p className="font-extrabold">{sampleAnswer === "A" ? "Exactly right." : "Not quite — use this to learn."}</p>
                    <p className="mt-1 text-muted-foreground">
                      <strong>Adamant</strong> means refusing to change one's mind. <strong>Flexible</strong> means willing to change, so it is the opposite. “Unyielding” is a synonym, not an antonym.
                    </p>
                    <button type="button" onClick={() => setSampleAnswer(null)} className="mt-3 text-xs font-bold text-primary underline underline-offset-4">
                      Try another answer
                    </button>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> Explanation included</span>
                  <span>Interactive sample · not a live exam</span>
                </div>
              </div>
            </div>
            <div className="relative mt-4 flex items-center justify-between gap-3 px-1 text-xs text-ink-foreground/60">
              <span>Learn from the answer, not just the score.</span>
              <span className="hidden rounded-full border border-white/15 px-3 py-1.5 sm:inline-flex">Edura CBT</span>
            </div>
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
                Edura is now on Google Play. Install it in one tap — full CBT engine, downloadable
                papers, streaks and your wallet, all working offline on your phone.
              </p>
            </div>
            {isAndroid ? (
              <Button
                size="lg"
                className="h-12 w-full md:w-auto shrink-0 px-8 text-base font-bold text-ink"
                onClick={() => window.location.assign(PLAY_STORE_URL)}
              >
                Get it on Google Play
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <Link to="/install-app" className="shrink-0">
                <Button size="lg" className="h-12 w-full md:w-auto px-8 text-base font-bold text-ink">
                  Install the app
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
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

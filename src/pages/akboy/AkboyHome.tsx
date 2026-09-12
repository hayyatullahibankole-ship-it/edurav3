import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AkboyLayout } from "@/components/akboy/AkboyLayout";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Code,
  Palette,
  Users,
  ArrowRight,
  ArrowUpRight,
  GraduationCap,
  MonitorSmartphone,
  Newspaper,
  Library,
  ClipboardCheck,
  ShieldCheck,
  Calendar,
  MapPin,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDomainDetection } from "@/hooks/useDomainDetection";
import hero1 from "@/assets/akboy-hero-1.jpg";
import hero2 from "@/assets/akboy-hero-2.jpg";

export default function AkboyHome() {
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [settings, setSettings] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [featuredEvent, setFeaturedEvent] = useState<any | null>(null);
  const [ambassadors, setAmbassadors] = useState<any[]>([]);
  const [partnerSchools, setPartnerSchools] = useState<any[]>([]);
  const { isAkboy } = useDomainDetection();

  const basePath = isAkboy ? "" : "/akboy";

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [posts, evts, folio] = await Promise.all([
          supabase
            .from("blog_posts")
            .select("*")
            .eq("is_published", true)
            .order("created_at", { ascending: false })
            .limit(3),
          supabase
            .from("akboy_events")
            .select("*")
            .gte("event_date", new Date().toISOString())
            .order("event_date", { ascending: true })
            .limit(2),
          supabase
            .from("akboy_portfolio")
            .select("*")
            .eq("is_active", true)
            .order("display_order", { ascending: true })
            .limit(3),
        ]);
        setBlogPosts(posts.data || []);
        setEvents(evts.data || []);
        setPortfolio(folio.data || []);

        const [cfg, prods, ambs, schools] = await Promise.all([
          supabase.from("akboy_homepage_settings").select("*").limit(1).maybeSingle(),
          supabase
            .from("akboy_products")
            .select("id,name,slug,tagline,short_description,status,logo_url,cover_image_url,category")
            .eq("is_published", true)
            .order("display_order", { ascending: true }),
          supabase
            .from("akboy_ambassadors")
            .select("id,full_name,photo_url,school,role_title,cohort")
            .eq("is_published", true)
            .eq("is_active", true)
            .order("display_order", { ascending: true })
            .limit(4),
          supabase
            .from("akboy_partner_schools")
            .select("id,name,logo_url")
            .eq("is_published", true)
            .eq("is_active", true)
            .order("display_order", { ascending: true })
            .limit(12),
        ]);
        setSettings(cfg.data || null);
        setProducts(prods.data || []);
        setAmbassadors(ambs.data || []);
        setPartnerSchools(schools.data || []);

        if (cfg.data?.featured_event_id) {
          const { data: fe } = await supabase
            .from("akboy_events")
            .select("*")
            .eq("id", cfg.data.featured_event_id)
            .eq("is_published", true)
            .maybeSingle();
          setFeaturedEvent(fe || null);
        }
      } catch (error) {
        console.error("Error loading homepage data:", error);
      }
    };
    fetchAll();
  }, []);

  const capabilities = [
    {
      icon: GraduationCap,
      kicker: "Education",
      title: "Exam Prep Academy",
      description:
        "Structured tutorials, online classes and supervised mock exams for JAMB, WAEC, NECO and Post-UTME candidates.",
      href: `${basePath}/register`,
    },
    {
      icon: ClipboardCheck,
      kicker: "Education",
      title: "Admission Consultancy",
      description:
        "Institution selection, form filling, Post-UTME processing and step-by-step guidance until admission is secured.",
      href: `${basePath}/services`,
    },
    {
      icon: MonitorSmartphone,
      kicker: "Technology",
      title: "EdTech Platforms",
      description:
        "We build and operate CBT engines, school portals and learning platforms used by thousands of students.",
      href: `${basePath}/services`,
    },
    {
      icon: Palette,
      kicker: "Technology",
      title: "Design & Brand Systems",
      description:
        "Visual identity, campaign design and product interfaces for schools, organisations and growing businesses.",
      href: `${basePath}/services`,
    },
  ];

  const ecosystem = [
    {
      icon: Code,
      title: "CBT Practice Engine",
      description: "Realistic computer-based test practice with instant scoring and performance analytics.",
      action: { label: "See how it works", href: `${basePath}/services` },
    },

    {
      icon: Newspaper,
      title: "Campus Hub",
      description: "Verified admission lists, exam updates and student opportunities, published daily.",
      action: { label: "Open Campus Hub", href: `${basePath}/campus-hub` },
    },
    {
      icon: Library,
      title: "Ebook Library",
      description: "Access-controlled study material you can read securely from any device.",
      action: { label: "Browse library", href: `${basePath}/ebooks` },
    },
    {
      icon: Users,
      title: "Mock Exams",
      description: "Proctored mock sittings that mirror the real exam hall, with graded WAEC-style reports.",
      action: { label: "See mock exams", href: `${basePath}/mock` },
    },
  ];

  const process = [
    { step: "01", title: "Consult", body: "We assess the student, school or brand and define a measurable objective." },
    { step: "02", title: "Design", body: "A tailored academic plan or product/design scope with clear deliverables." },
    { step: "03", title: "Deliver", body: "Classes, applications or builds executed by our education and tech teams." },
    { step: "04", title: "Track", body: "Progress reviews, reports and support until the outcome is achieved." },
  ];

  return (
    <AkboyLayout>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-akboy-forest">
        <div className="absolute inset-0 opacity-[0.14]">
          <img src={hero1} alt="" aria-hidden className="h-full w-full object-cover" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="grid gap-14 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-akboy-butter/40 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-akboy-butter">
                <span className="h-1.5 w-1.5 rounded-full bg-akboy-butter" />
                EdTech · Education · Technology
              </div>

              <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Education solved with
                <span className="block text-akboy-butter">technology that works.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
                AKBOY Creative Hub is an education technology company. We prepare students for national exams,
                process admissions end to end, and build the digital platforms that schools and organisations
                run on.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-xl bg-akboy-butter px-7 text-sm font-semibold text-akboy-forest hover:bg-akboy-butter/90"
                >
                  <Link to={`${basePath}/services`}>
                    Explore our solutions
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-xl border-white/25 bg-transparent px-7 text-sm font-semibold text-white hover:bg-white/10 hover:text-white"
                >
                  <Link to={`${basePath}/contact`}>Talk to a consultant</Link>
                </Button>
              </div>

              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-8">
                {[
                  { v: "5,000+", l: "Students guided" },
                  { v: "200+", l: "Projects delivered" },
                  { v: "5 yrs", l: "In education & tech" },
                ].map((s) => (
                  <div key={s.l}>
                    <dt className="font-display text-2xl font-bold text-white sm:text-3xl">{s.v}</dt>
                    <dd className="mt-1 text-xs font-medium uppercase tracking-wide text-white/55">{s.l}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Two-pillar card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-6 sm:p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                  Two disciplines, one company
                </p>
                <div className="mt-5 space-y-4">
                  <div className="rounded-xl border border-white/10 bg-akboy-deep/60 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-akboy-butter">
                        <BookOpen className="h-4.5 w-4.5 text-akboy-forest" />
                      </div>
                      <h3 className="font-display text-base font-semibold text-white">Education</h3>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-white/65">
                      Tutorials, mock exams, admission processing and consultancy for students and schools.
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-akboy-deep/60 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
                        <Code className="h-4.5 w-4.5 text-akboy-forest" />
                      </div>
                      <h3 className="font-display text-base font-semibold text-white">Technology</h3>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-white/65">
                      Learning platforms, CBT engines, school portals, brand systems and product design.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-akboy-butter/25 bg-akboy-butter/10 p-4">
                    <ShieldCheck className="h-5 w-5 flex-shrink-0 text-akboy-butter" />
                    <p className="text-sm text-white/80">
                      Combined, they power the <span className="font-semibold text-white">Akboy</span> learning
                      ecosystem — from classrooms to digital products.
                    </p>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CAPABILITIES ================= */}
      <section className="bg-akboy-paper py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-akboy-moss">What we do</p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-akboy-forest md:text-4xl">
              Capabilities across the education value chain
            </h2>
            <p className="mt-4 text-base leading-relaxed text-akboy-muted">
              From the first tutorial to the admission letter — and the software that makes it scale.
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-akboy-line bg-akboy-line sm:grid-cols-2">
            {capabilities.map((c) => (
              <Link
                key={c.title}
                to={c.href}
                className="group flex flex-col bg-white p-7 transition-colors hover:bg-akboy-bone md:p-9"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-akboy-forest">
                    <c.icon className="h-5 w-5 text-akboy-butter" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-akboy-moss">
                    {c.kicker}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-xl font-semibold text-akboy-forest">{c.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-akboy-muted">{c.description}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-akboy-forest">
                  Learn more
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= ECOSYSTEM ================= */}
      <section className="bg-akboy-bone py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-akboy-moss">Our products</p>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-akboy-forest md:text-4xl">
                The AKBOY learning ecosystem
              </h2>
            </div>
            <Button
              asChild
              variant="outline"
              className="h-11 w-fit rounded-xl border-akboy-forest/25 bg-transparent px-6 text-sm font-semibold text-akboy-forest hover:bg-akboy-forest hover:text-white"
            >
              <Link to={`${basePath}/services`}>All services</Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ecosystem.map((p) => (
              <div
                key={p.title}
                className="flex flex-col rounded-2xl border border-akboy-line bg-white p-6 transition-shadow hover:shadow-[0_12px_32px_-18px_hsl(var(--akboy-forest)/0.35)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-akboy-bone">
                  <p.icon className="h-5 w-5 text-akboy-forest" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-akboy-forest">{p.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-akboy-muted">{p.description}</p>
                {"external" in p.action && (p.action as { external?: boolean }).external ? (
                  <a
                    href={p.action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-akboy-moss hover:text-akboy-forest"
                  >
                    {p.action.label}
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                ) : (
                  <Link
                    to={p.action.href}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-akboy-moss hover:text-akboy-forest"
                  >
                    {p.action.label}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ================= PRODUCTS ================= */}
      {settings?.show_products !== false && products.length > 0 && (
        <section className="bg-akboy-bone py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-akboy-moss">What we build</p>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-akboy-forest md:text-4xl">
                  Our products
                </h2>
              </div>
              <Link
                to={`${basePath}/products`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-akboy-forest hover:text-akboy-moss"
              >
                All products <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {products.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  to={`${basePath}/products/${p.slug}`}
                  className="group flex flex-col rounded-2xl border border-akboy-line bg-white p-7 transition-colors hover:border-akboy-forest"
                >
                  <div className="flex items-center gap-4">
                    {p.logo_url ? (
                      <img src={p.logo_url} alt={`${p.name} logo`} loading="lazy" className="h-12 w-12 rounded-xl object-contain" />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-akboy-forest font-display text-lg font-bold text-akboy-butter">
                        {p.name?.charAt(0)}
                      </span>
                    )}
                    <div>
                      <h3 className="font-display text-xl font-semibold text-akboy-forest">{p.name}</h3>
                      {p.category && <p className="text-xs uppercase tracking-[0.14em] text-akboy-moss">{p.category}</p>}
                    </div>
                  </div>
                  {(p.tagline || p.short_description) && (
                    <p className="mt-5 text-sm leading-relaxed text-akboy-muted">{p.tagline || p.short_description}</p>
                  )}
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-akboy-forest">
                    Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= FEATURED EVENT ================= */}
      {settings?.show_featured_event !== false && featuredEvent && (
        <section className="bg-akboy-forest py-20 md:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-akboy-butter">Featured programme</p>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
                {featuredEvent.title}
              </h2>
              {featuredEvent.theme && <p className="mt-3 text-base text-akboy-butter">{featuredEvent.theme}</p>}
              {featuredEvent.description && (
                <p className="mt-5 text-base leading-relaxed text-white/70">{featuredEvent.description}</p>
              )}
              <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/70">
                {featuredEvent.event_date && (
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-akboy-butter" />
                    {new Date(featuredEvent.event_date).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                )}
                {(featuredEvent.venue || featuredEvent.location) && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-akboy-butter" />
                    {featuredEvent.venue || featuredEvent.location}
                  </span>
                )}
              </div>
              <Button asChild size="lg" className="mt-8 h-12 rounded-xl bg-akboy-butter px-7 text-sm font-semibold text-akboy-forest hover:bg-akboy-butter/90">
                <Link to={`${basePath}/learn/events/${featuredEvent.slug || featuredEvent.id}`}>View programme</Link>
              </Button>
            </div>
            {featuredEvent.image_url && (
              <div className="overflow-hidden rounded-2xl">
                <img
                  src={featuredEvent.image_url}
                  alt={featuredEvent.title}
                  loading="lazy"
                  className="h-72 w-full object-cover md:h-96"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ================= COMMUNITY ================= */}
      {settings?.show_community !== false && ambassadors.length > 0 && (
        <section className="bg-white py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-akboy-moss">Community</p>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-akboy-forest md:text-4xl">
                  Students leading the work on their campuses
                </h2>
              </div>
              <Link
                to={`${basePath}/community`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-akboy-forest hover:text-akboy-moss"
              >
                Explore community <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {ambassadors.map((a) => (
                <div key={a.id} className="rounded-2xl border border-akboy-line bg-akboy-paper p-6 text-center">
                  {a.photo_url ? (
                    <img src={a.photo_url} alt={a.full_name} loading="lazy" className="mx-auto h-20 w-20 rounded-full object-cover" />
                  ) : (
                    <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-akboy-forest font-display text-xl font-bold text-akboy-butter">
                      {a.full_name?.charAt(0)}
                    </span>
                  )}
                  <h3 className="mt-4 font-display text-base font-semibold text-akboy-forest">{a.full_name}</h3>
                  {a.school && <p className="mt-1 text-xs text-akboy-muted">{a.school}</p>}
                  {a.role_title && <p className="text-xs text-akboy-moss">{a.role_title}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= PARTNER SCHOOLS ================= */}
      {settings?.show_partner_strip !== false && partnerSchools.length > 0 && (
        <section className="border-y border-akboy-line bg-akboy-paper py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-akboy-moss">
              Schools we work with
            </p>
            <div className="mt-8 grid grid-cols-3 gap-5 sm:grid-cols-4 lg:grid-cols-6">
              {partnerSchools.map((s) => (
                <div key={s.id} className="flex h-20 items-center justify-center rounded-2xl border border-akboy-line bg-white p-3">
                  {s.logo_url ? (
                    <img src={s.logo_url} alt={`${s.name} logo`} loading="lazy" className="max-h-10 max-w-full object-contain" />
                  ) : (
                    <span className="text-center text-xs font-semibold text-akboy-forest">{s.name}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link to={`${basePath}/community/partners`} className="text-sm font-semibold text-akboy-forest hover:text-akboy-moss">
                See all partner schools
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ================= VERIFIED IMPACT ================= */}
      {settings?.show_impact !== false && Array.isArray(settings?.impact_stats) && settings.impact_stats.length > 0 && (
        <section className="bg-akboy-bone py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-px overflow-hidden rounded-2xl border border-akboy-line bg-akboy-line sm:grid-cols-2 lg:grid-cols-4">
              {settings.impact_stats.map((stat: any, i: number) => (
                <div key={i} className="bg-white p-8 text-center">
                  <p className="font-display text-3xl font-bold text-akboy-forest">{stat.value}</p>
                  <p className="mt-2 text-sm text-akboy-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= APPROACH ================= */}
      <section className="bg-white py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-akboy-moss">How we work</p>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-akboy-forest md:text-4xl">
                A disciplined process behind every outcome
              </h2>
              <p className="mt-4 text-base leading-relaxed text-akboy-muted">
                Whether it is a student targeting medicine or a school digitising its exams, the same four steps
                keep the work accountable.
              </p>
              <div className="mt-8 overflow-hidden rounded-2xl border border-akboy-line">
                <img src={hero2} alt="AKBOY Creative Hub team at work" className="h-56 w-full object-cover" loading="lazy" />
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="divide-y divide-akboy-line border-y border-akboy-line">
                {process.map((p) => (
                  <div key={p.step} className="flex gap-6 py-7">
                    <span className="font-display text-sm font-bold text-akboy-moss">{p.step}</span>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-akboy-forest">{p.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-akboy-muted">{p.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= WORK + INSIGHTS ================= */}
      {(portfolio.length > 0 || blogPosts.length > 0 || events.length > 0) && (
        <section className="bg-akboy-paper py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
            {portfolio.length > 0 && (
              <div>
                <div className="flex items-end justify-between gap-6">
                  <h2 className="font-display text-2xl font-bold text-akboy-forest md:text-3xl">Selected work</h2>
                  <Link
                    to={`${basePath}/portfolio`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-akboy-moss hover:text-akboy-forest"
                  >
                    View portfolio <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {portfolio.map((item) => (
                    <Link
                      key={item.id}
                      to={`${basePath}/portfolio`}
                      className="group overflow-hidden rounded-2xl border border-akboy-line bg-white"
                    >
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          loading="lazy"
                          className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      )}
                      <div className="p-5">
                        <h3 className="font-display text-base font-semibold text-akboy-forest">{item.title}</h3>
                        {item.description && (
                          <p className="mt-2 line-clamp-2 text-sm text-akboy-muted">{item.description}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {events.length > 0 && (
              <div>
                <div className="flex items-end justify-between gap-6">
                  <h2 className="font-display text-2xl font-bold text-akboy-forest md:text-3xl">Upcoming events</h2>
                  <Link
                    to={`${basePath}/events`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-akboy-moss hover:text-akboy-forest"
                  >
                    All events <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  {events.map((ev) => (
                    <div key={ev.id} className="rounded-2xl border border-akboy-line bg-white p-6">
                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-akboy-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(ev.event_date).toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        {ev.location && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {ev.location}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-3 font-display text-lg font-semibold text-akboy-forest">{ev.title}</h3>
                      {ev.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-akboy-muted">{ev.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {blogPosts.length > 0 && (
              <div>
                <div className="flex items-end justify-between gap-6">
                  <h2 className="font-display text-2xl font-bold text-akboy-forest md:text-3xl">
                    Latest from Campus Hub
                  </h2>
                  <Link
                    to={`${basePath}/campus-hub`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-akboy-moss hover:text-akboy-forest"
                  >
                    Visit Campus Hub <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {blogPosts.map((post) => (
                    <Link
                      key={post.id}
                      to={`${basePath}/blog/${post.slug}`}
                      className="rounded-2xl border border-akboy-line bg-white p-6 transition-colors hover:border-akboy-forest/30"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-akboy-moss">
                        {post.category || "Update"}
                      </p>
                      <h3 className="mt-3 line-clamp-2 font-display text-base font-semibold text-akboy-forest">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="mt-2 line-clamp-3 text-sm text-akboy-muted">{post.excerpt}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ================= CTA ================= */}
      <section className="bg-akboy-forest py-20 md:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
            Let's build the next step of your education journey
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/70">
            Speak with our team about tutorials, admission processing, or a technology project for your school
            or organisation.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-xl bg-akboy-butter px-8 text-sm font-semibold text-akboy-forest hover:bg-akboy-butter/90"
            >
              <Link to={`${basePath}/contact`}>Book a consultation</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-xl border-white/25 bg-transparent px-8 text-sm font-semibold text-white hover:bg-white/10 hover:text-white"
            >
              <Link to={`${basePath}/register`}>Join the Exam Prep Academy</Link>
            </Button>
          </div>
        </div>
      </section>
    </AkboyLayout>
  );
}

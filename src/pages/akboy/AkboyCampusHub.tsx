import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AkboyLayout } from "@/components/akboy/AkboyLayout";
import { useDomainDetection } from "@/hooks/useDomainDetection";
import { useReveal } from "@/hooks/useReveal";
import { InstitutionLogo, useInstitutionOverrides } from "@/components/InstitutionLogo";
import { headlineText } from "@/lib/editorialText";
import { PostImage } from "@/components/akboy/PostImage";
import {
  Search, ArrowRight, ArrowUpRight, MessageCircle, ChevronLeft, ChevronRight, Newspaper,
  GraduationCap, BookOpen, Award, CalendarDays, Bell, TrendingUp, ShieldCheck,
} from "lucide-react";
import { CampusHubAdvancedSection, ConsultationBookingForm, WhatsAppConsultButton } from "@/components/akboy/CampusHubAdvanced";
import { BreakingTicker } from "@/components/akboy/campus-hub/BreakingTicker";
import { StoryCard, CategoryChip, MetaLine } from "@/components/akboy/campus-hub/StoryCard";
import { Thumb } from "@/components/akboy/campus-hub/Thumb";

import { StatsStrip } from "@/components/akboy/campus-hub/StatsStrip";
import { CampusPost, namedSchool, postPath, standfirst, timeAgo } from "@/components/akboy/campus-hub/shared";

const ITEMS_PER_PAGE = 9;
const WHATSAPP_NUMBER = "2348101466977";

const SectionRule = ({ label, note, action }: { label: string; note?: string; action?: React.ReactNode }) => (
  <div className="mb-7 flex flex-wrap items-end justify-between gap-3 border-b-2 border-akboy-forest pb-3">
    <div className="flex items-baseline gap-3">
      <h2 className="font-display text-2xl font-semibold leading-none text-akboy-forest md:text-[2rem]">{label}</h2>
      {note && <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-akboy-muted">{note}</span>}
    </div>
    {action}
  </div>
);

export default function AkboyCampusHub() {
  const { isCampusHub } = useDomainDetection();
  useInstitutionOverrides();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<CampusPost[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "All");
  const [selectedSchool, setSelectedSchool] = useState(searchParams.get("school") || "All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leadIndex, setLeadIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const leadReveal = useReveal<HTMLDivElement>();
  const consultReveal = useReveal<HTMLDivElement>(60);
  const feedReveal = useReveal<HTMLDivElement>();

  useEffect(() => { fetchPosts(); }, []);

  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "All");
    setSelectedSchool(searchParams.get("school") || "All");
    setSearchTerm(searchParams.get("q") || "");
    setCurrentPage(1);
  }, [searchParams]);

  const fetchPosts = async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, content, featured_image_url, category, tags, created_at, school, institution_type, year")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(500);
      if (fetchError) throw fetchError;
      setPosts((data as any) || []);
    } catch (err) {
      console.error("Error fetching campus posts:", err);
      setError("We couldn't load the stories. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "All") next.set(key, value); else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const filtered = useMemo(() => posts.filter((p) => {
    const text = `${p.title || ""} ${p.excerpt || ""} ${p.school || ""}`.toLowerCase();
    const matchSearch = !searchTerm || text.includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === "All" || (p.category || "News & Updates") === selectedCategory;
    const matchSchool = selectedSchool === "All" || (p.school || "Other") === selectedSchool;
    return matchSearch && matchCat && matchSchool;
  }), [posts, searchTerm, selectedCategory, selectedSchool]);

  const isFiltering = selectedCategory !== "All" || selectedSchool !== "All" || Boolean(searchTerm);

  const leadPool = useMemo(() => posts.slice(0, 5), [posts]);
  const lead = leadPool[leadIndex % Math.max(1, leadPool.length)];
  const secondary = useMemo(() => posts.filter(p => p.id !== lead?.id).slice(0, 4), [posts, lead]);

  useEffect(() => {
    if (leadPool.length < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setLeadIndex(i => (i + 1) % leadPool.length), 9000);
    return () => window.clearInterval(t);
  }, [leadPool.length]);

  const feedSource = useMemo(() => {
    if (isFiltering) return filtered;
    const skip = new Set<string>([lead?.id, ...secondary.map(b => b.id)].filter(Boolean) as string[]);
    return filtered.filter(p => !skip.has(p.id));
  }, [filtered, isFiltering, lead, secondary]);

  const totalPages = Math.ceil(feedSource.length / ITEMS_PER_PAGE);
  const paginatedFeed = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return feedSource.slice(start, start + ITEMS_PER_PAGE);
  }, [feedSource, currentPage]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach(p => {
      const c = p.category?.trim() || "News & Updates";
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [posts]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>(["All"]);
    posts.forEach(p => { if (p.category?.trim()) set.add(p.category.trim()); });
    if (selectedCategory !== "All") set.add(selectedCategory);
    return Array.from(set).sort((a, b) => {
      if (a === "All") return -1;
      if (b === "All") return 1;
      const diff = (categoryCounts[b] || 0) - (categoryCounts[a] || 0);
      return diff !== 0 ? diff : a.localeCompare(b);
    });
  }, [posts, selectedCategory, categoryCounts]);

  const schoolList = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach(p => { if (namedSchool(p.school)) counts[p.school as string] = (counts[p.school as string] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([school, count]) => ({ school, count }));
  }, [posts]);

  const featuredSchools = useMemo(() => schoolList.slice(0, 16), [schoolList]);
  const mostRead = useMemo(() => posts.slice(0, 5), [posts]);
  const tickerPosts = useMemo(() => posts.slice(0, 8), [posts]);

  const stats = useMemo(() => ([
    { value: posts.length ? `${posts.length}+` : "—", label: "Published updates" },
    { value: Object.keys(categoryCounts).length ? `${Object.keys(categoryCounts).length}` : "—", label: "Categories covered" },
    { value: schoolList.length ? `${schoolList.length}+` : "—", label: "Institutions tracked" },
    { value: "100%", label: "Free to read" },
  ]), [posts.length, categoryCounts, schoolList.length]);

  const selectCategory = (c: string) => { setSelectedCategory(c); updateParam("category", c); setCurrentPage(1); };
  const selectSchool = (s: string) => { setSelectedSchool(s); updateParam("school", s); setCurrentPage(1); };
  const clearAll = () => {
    setSelectedCategory("All"); setSelectedSchool("All"); setSearchTerm("");
    setSearchParams({}, { replace: true }); setCurrentPage(1);
  };

  const shareOnWhatsApp = (e: React.MouseEvent, post: CampusPost) => {
    e.preventDefault(); e.stopPropagation();
    const url = `${window.location.origin}${postPath(post)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(`${headlineText(post.title)}\n\nRead: ${url}\n\nvia Akboy Campus Hub`)}`, "_blank");
  };

  const goToFeed = () => document.getElementById("feed")?.scrollIntoView({ behavior: "smooth" });

  return (
    <AkboyLayout
      title={isCampusHub ? "Campus Hub — Admissions, Scholarships & Campus Journalism" : "Campus Hub — Nigerian Admissions, Scholarships & Education Stories"}
      description="An Akboy publication: admission lists, scholarships, JAMB and WAEC updates and academic calendars from Nigerian universities, polytechnics and colleges."
    >
      {/* Utility bar */}
      <div className="border-b border-akboy-line bg-white">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-2 px-5 py-2 text-[11px] text-akboy-muted sm:px-8">
          <span className="font-medium">
            {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-semibold text-akboy-forest">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-akboy-lime opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-akboy-forest" />
              </span>
              Updating live
            </span>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-akboy-forest hover:underline"
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp community
            </a>
          </div>
        </div>
      </div>

      {/* Breaking ticker */}
      {!loading && <BreakingTicker posts={tickerPosts} />}

      {/* Masthead + category nav */}
      <section className="border-b border-akboy-line bg-white">
        <div className="mx-auto max-w-[1320px] px-5 py-7 sm:px-8 md:py-9">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
            <div className="text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-akboy-moss">An Akboy publication</p>
              <h1 className="mt-2 font-display text-[clamp(2.4rem,6vw,4.2rem)] font-semibold leading-[0.95] tracking-tight text-akboy-forest">
                Campus Hub
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-akboy-muted">
                Credible admission lists, post-UTME notices, scholarships and exam updates from Nigerian universities,
                polytechnics and colleges — verified before we publish.
              </p>
            </div>

            <div>
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-akboy-muted" />
                <Input
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); updateParam("q", e.target.value); setCurrentPage(1); }}
                  placeholder="Search a school, scholarship or keyword"
                  className="h-14 rounded-xl border-akboy-line bg-akboy-mist pl-12 pr-4 text-sm text-akboy-forest shadow-none focus-visible:border-akboy-forest focus-visible:ring-akboy-forest/15"
                />
              </label>
              <p className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-akboy-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-akboy-moss" />
                {posts.length} verified updates and counting
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-akboy-line bg-akboy-mist">
          <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
            <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <nav className="flex min-w-max items-center gap-1">
                {categoryOptions.slice(0, 10).map((category) => {
                  const active = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => { selectCategory(category); if (category !== "All") goToFeed(); }}
                      className={`relative whitespace-nowrap px-4 py-3.5 text-[12px] font-bold uppercase tracking-[0.1em] transition-colors ${
                        active ? "text-akboy-forest" : "text-akboy-muted hover:text-akboy-forest"
                      }`}
                    >
                      {category === "All" ? "All stories" : category}
                      {category !== "All" && (
                        <span className="ml-1.5 text-[10px] font-semibold opacity-60">{categoryCounts[category] || 0}</span>
                      )}
                      {active && <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-akboy-forest" />}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </section>

      {/* Hero */}
      {loading ? (
        <section className="bg-white">
          <div className="mx-auto grid max-w-[1320px] gap-6 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
            <div className="aspect-[16/10] animate-pulse rounded-2xl bg-akboy-mist" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-akboy-mist" />)}
            </div>
          </div>
        </section>
      ) : lead ? (
        <section className="bg-white">
          <div ref={leadReveal.ref} className={`mx-auto max-w-[1320px] px-5 py-8 sm:px-8 md:py-12 ${leadReveal.cls}`}>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start">
              {/* Lead story */}
              <article className="group relative overflow-hidden rounded-2xl border border-akboy-line bg-akboy-forest">
                <Link to={postPath(lead)} className="block">
                  <div className="relative">
                    <PostImage
                      src={lead.featured_image_url}
                      alt={headlineText(lead.title)}
                      school={lead.school}
                      title={headlineText(lead.title)}
                      tags={lead.tags}
                      institution_type={lead.institution_type}
                      aspect="aspect-[16/10]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-akboy-forest/55" />
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                      <CategoryChip label={lead.category || "Top story"} tone="solid" />
                      <h2 className="mt-3 max-w-3xl font-display text-[clamp(1.6rem,3.4vw,2.9rem)] font-semibold leading-[1.06] text-white">
                        {headlineText(lead.title)}
                      </h2>
                      <p className="mt-3 hidden max-w-2xl text-sm leading-relaxed text-white/80 sm:block">
                        {standfirst(lead, 190)}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                        <MetaLine post={lead} invert />
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-akboy-lime">
                          Read story <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>

                {leadPool.length > 1 && (
                  <div className="flex items-center gap-2 bg-akboy-forest px-6 py-3">
                    <Button
                      type="button" variant="ghost" size="icon" aria-label="Previous featured story"
                      onClick={() => setLeadIndex((i) => (i - 1 + leadPool.length) % leadPool.length)}
                      className="h-8 w-8 rounded-full border border-white/20 text-akboy-paper hover:bg-white/10 hover:text-akboy-paper"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button" variant="ghost" size="icon" aria-label="Next featured story"
                      onClick={() => setLeadIndex((i) => (i + 1) % leadPool.length)}
                      className="h-8 w-8 rounded-full border border-white/20 text-akboy-paper hover:bg-white/10 hover:text-akboy-paper"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="ml-2 flex items-center gap-1.5">
                      {leadPool.map((p, i) => (
                        <button
                          key={p.id}
                          type="button"
                          aria-label={`Show featured story ${i + 1}`}
                          onClick={() => setLeadIndex(i)}
                          className={`h-1.5 rounded-full transition-all ${i === leadIndex % leadPool.length ? "w-6 bg-akboy-lime" : "w-1.5 bg-white/35"}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </article>

              {/* Secondary headlines */}
              <div className="flex flex-col rounded-2xl border border-akboy-line bg-white">
                <p className="border-b border-akboy-line px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-akboy-forest">
                  Also making news
                </p>
                <div className="divide-y divide-akboy-line">
                  {secondary.map((post) => (
                    <Link key={post.id} to={postPath(post)} className="group flex gap-4 p-4 transition-colors hover:bg-akboy-mist">
                      <div className="w-[86px] shrink-0">
                        <Thumb post={post} alt={headlineText(post.title)} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-akboy-moss">{post.category || "News"}</p>
                        <h3 className="mt-1 line-clamp-3 font-display text-[15px] font-semibold leading-snug text-akboy-forest transition-colors group-hover:text-akboy-moss">
                          {headlineText(post.title)}
                        </h3>
                        <p className="mt-1.5 text-[11px] text-akboy-muted">{timeAgo(post.created_at)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Credibility strip */}
      <StatsStrip stats={stats} />

      {/* Consultancy */}
      <section className="bg-white">
        <div ref={consultReveal.ref} className={`mx-auto max-w-[1320px] px-5 py-12 sm:px-8 md:py-16 ${consultReveal.cls}`}>
          <div className="overflow-hidden rounded-2xl bg-akboy-forest">
            <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
              <div>
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-akboy-lime text-akboy-forest">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <p className="mt-6 text-[11px] font-black uppercase tracking-[0.24em] text-akboy-lime">Educational consultancy</p>
                <h2 className="mt-3 max-w-xl font-display text-[clamp(1.7rem,3.2vw,2.6rem)] font-semibold leading-tight text-white">
                  Make your next admission move with confidence.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75">
                  Course selection, post-UTME, change of institution and admission processing — handled by people who
                  do this every single admission season.
                </p>
              </div>

              <div>
                <ul className="space-y-3 text-sm text-white/90">
                  <li className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3"><BookOpen className="h-4 w-4 shrink-0 text-akboy-lime" /> Course and institution guidance</li>
                  <li className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3"><Award className="h-4 w-4 shrink-0 text-akboy-lime" /> Scholarship and application support</li>
                  <li className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3"><CalendarDays className="h-4 w-4 shrink-0 text-akboy-lime" /> Deadline and exam planning</li>
                </ul>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <ConsultationBookingForm
                    trigger={
                      <Button className="h-12 w-full rounded-xl bg-akboy-lime font-bold text-akboy-forest hover:bg-white">
                        Book free consultation <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Button asChild variant="outline" className="h-12 w-full rounded-xl border-white/25 bg-transparent font-semibold text-white hover:bg-white/10 hover:text-white">
                    <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Institution directory */}
      {featuredSchools.length > 0 && (
        <section className="border-y border-akboy-line bg-akboy-mist">
          <div className="mx-auto max-w-[1320px] px-5 py-7 sm:px-8">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-akboy-forest">Follow your institution</p>
              {selectedSchool !== "All" && (
                <Button type="button" variant="link" onClick={() => selectSchool("All")} className="h-auto p-0 text-xs text-akboy-forest">Clear filter</Button>
              )}
            </div>
            <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max items-center gap-2.5 pb-1">
                {featuredSchools.map(({ school, count }) => (
                  <button
                    key={school}
                    type="button"
                    onClick={() => { selectSchool(school); goToFeed(); }}
                    className={`inline-flex h-12 items-center gap-2.5 rounded-full border px-3.5 transition-colors ${
                      selectedSchool === school
                        ? "border-akboy-forest bg-akboy-forest text-akboy-paper"
                        : "border-akboy-line bg-white text-akboy-forest hover:border-akboy-forest/40"
                    }`}
                  >
                    <InstitutionLogo school={school} size={26} rounded="rounded-full" className="shrink-0" />
                    <span className="max-w-[150px] truncate text-xs font-semibold">{school}</span>
                    <span className="text-[10px] opacity-70">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Feed + rail */}
      <section id="feed" className="scroll-mt-24 bg-white">
        <div className="mx-auto max-w-[1320px] px-5 py-12 sm:px-8 md:py-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div ref={feedReveal.ref} className={feedReveal.cls}>
              <SectionRule
                label={isFiltering ? "Search results" : "Latest updates"}
                note={`${feedSource.length} stor${feedSource.length === 1 ? "y" : "ies"} · page ${currentPage} of ${totalPages || 1}`}
              />

              <div className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_190px_190px]">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-akboy-muted" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => { setSearchTerm(event.target.value); updateParam("q", event.target.value); setCurrentPage(1); }}
                    placeholder="Search all stories"
                    className="h-11 rounded-xl border-akboy-line bg-akboy-mist pl-11 text-sm"
                  />
                </label>
                <Select value={selectedCategory} onValueChange={selectCategory}>
                  <SelectTrigger className="h-11 rounded-xl border-akboy-line bg-white text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>{categoryOptions.map((category) => <SelectItem key={category} value={category}>{category === "All" ? "All categories" : `${category} (${categoryCounts[category] || 0})`}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={selectedSchool} onValueChange={selectSchool}>
                  <SelectTrigger className="h-11 rounded-xl border-akboy-line bg-white text-xs"><SelectValue placeholder="Institution" /></SelectTrigger>
                  <SelectContent className="max-h-80">
                    <SelectItem value="All">All institutions</SelectItem>
                    {schoolList.map(({ school, count }) => <SelectItem key={school} value={school}>{school} ({count})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {isFiltering && (
                <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-akboy-muted">
                  <span>Showing filtered results.</span>
                  <Button type="button" variant="link" onClick={clearAll} className="h-auto p-0 font-bold text-akboy-forest">Clear all filters</Button>
                </div>
              )}

              {loading ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[4/3] animate-pulse rounded-2xl bg-akboy-mist" />)}
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-akboy-line bg-akboy-mist p-10 text-center">
                  <p className="font-display text-xl text-akboy-forest">{error}</p>
                  <Button onClick={fetchPosts} className="mt-5 bg-akboy-forest text-akboy-paper hover:bg-akboy-moss">Try again</Button>
                </div>
              ) : paginatedFeed.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-akboy-line bg-akboy-mist p-12 text-center">
                  <Newspaper className="mx-auto mb-4 h-9 w-9 text-akboy-muted" />
                  <p className="font-display text-2xl text-akboy-forest">Nothing matches that yet</p>
                  <p className="mt-2 text-sm text-akboy-muted">Try another keyword or clear the filters.</p>
                  <Button type="button" variant="link" onClick={clearAll} className="mt-3 text-akboy-forest">Clear filters</Button>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {paginatedFeed.map((post) => (
                    <StoryCard key={post.id} post={post} onShare={shareOnWhatsApp} />
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                  <Button type="button" variant="outline" onClick={() => { setCurrentPage(Math.max(1, currentPage - 1)); goToFeed(); }} disabled={currentPage === 1} className="rounded-xl border-akboy-line text-akboy-forest">Previous</Button>
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                    let pageNumber = index + 1;
                    if (totalPages > 5) {
                      if (currentPage > 3 && currentPage < totalPages - 2) pageNumber = currentPage - 2 + index;
                      else if (currentPage >= totalPages - 2) pageNumber = totalPages - 4 + index;
                    }
                    if (pageNumber < 1 || pageNumber > totalPages) return null;
                    return (
                      <Button key={pageNumber} type="button" variant={currentPage === pageNumber ? "default" : "outline"} onClick={() => { setCurrentPage(pageNumber); goToFeed(); }} className={currentPage === pageNumber ? "rounded-xl bg-akboy-forest text-akboy-paper hover:bg-akboy-moss" : "rounded-xl border-akboy-line text-akboy-forest"}>{pageNumber}</Button>
                    );
                  })}
                  <Button type="button" variant="outline" onClick={() => { setCurrentPage(Math.min(totalPages, currentPage + 1)); goToFeed(); }} disabled={currentPage === totalPages} className="rounded-xl border-akboy-line text-akboy-forest">Next</Button>
                </div>
              )}
            </div>

            {/* Sidebar rail */}
            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-akboy-line bg-white p-6">
                <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-akboy-forest">
                  <TrendingUp className="h-4 w-4" /> Most read
                </p>
                <ol className="mt-4 divide-y divide-akboy-line">
                  {mostRead.map((post, index) => (
                    <li key={post.id}>
                      <Link to={postPath(post)} className="group flex gap-4 py-3.5 first:pt-0 last:pb-0">
                        <span className="font-display text-2xl font-semibold leading-none text-akboy-line transition-colors group-hover:text-akboy-lime">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-akboy-forest transition-colors group-hover:text-akboy-moss">
                            {headlineText(post.title)}
                          </h4>
                          <p className="mt-1 text-[11px] text-akboy-muted">{timeAgo(post.created_at)}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>

              {featuredSchools.length > 0 && (
                <div className="rounded-2xl border border-akboy-line bg-akboy-mist p-6">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-akboy-forest">Trending institutions</p>
                  <div className="mt-4 space-y-1">
                    {featuredSchools.slice(0, 6).map(({ school, count }) => (
                      <button
                        key={school}
                        type="button"
                        onClick={() => { selectSchool(school); goToFeed(); }}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white"
                      >
                        <InstitutionLogo school={school} size={28} rounded="rounded-full" className="shrink-0" />
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-akboy-forest">{school}</span>
                        <span className="text-[10px] font-bold text-akboy-muted">{count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-akboy-forest p-6 text-white">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-akboy-lime text-akboy-forest">
                  <Bell className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold leading-tight">Never miss an admission deadline.</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">
                  Important dates and application guidance, sent straight from the Akboy desk.
                </p>
                <Button asChild className="mt-4 w-full rounded-xl bg-akboy-lime font-bold text-akboy-forest hover:bg-white">
                  <a href="#newsletter">Get free alerts</a>
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <CampusHubAdvancedSection posts={posts} schools={featuredSchools} />
      <WhatsAppConsultButton />
    </AkboyLayout>
  );
}

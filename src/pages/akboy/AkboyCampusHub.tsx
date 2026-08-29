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
import { PostImage } from "@/components/akboy/PostImage";
import {
  Search, ArrowRight, ArrowUpRight, MessageCircle, ChevronLeft, ChevronRight, Newspaper,
} from "lucide-react";
import { CampusHubAdvancedSection, WhatsAppConsultButton } from "@/components/akboy/CampusHubAdvanced";

interface CampusPost {
  id: string;
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  featured_image_url?: string;
  category?: string;
  tags?: unknown;
  created_at?: string;
  school?: string | null;
  institution_type?: string | null;
  year?: number | null;
}

const ITEMS_PER_PAGE = 10;

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" }) : "Recent";

const timeAgo = (d?: string) => {
  if (!d) return "";
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
};

const standfirst = (p: CampusPost, len = 170) => {
  const raw = (p.excerpt || p.content?.replace(/<[^>]*>/g, " ") || "").replace(/\s+/g, " ").trim();
  return raw.length > len ? `${raw.slice(0, len)}…` : raw;
};

const namedSchool = (s?: string | null) => (s && !["Other", "Other University"].includes(s) ? s : null);

/* ---------------- shared editorial bits ---------------- */

const Kicker = ({ post, invert = false }: { post: CampusPost; invert?: boolean }) => (
  <div
    className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.24em] ${
      invert ? "text-akboy-butter" : "text-akboy-muted"
    }`}
  >
    <span className={invert ? "text-akboy-butter" : "text-akboy-forest"}>{post.category || "News"}</span>
    {namedSchool(post.school) && (<><span aria-hidden className="opacity-50">/</span><span>{post.school}</span></>)}
    <span aria-hidden className="opacity-50">/</span>
    <span className="font-medium tracking-[0.12em]">{timeAgo(post.created_at)}</span>
  </div>
);

const SectionRule = ({ label, note }: { label: string; note?: string }) => (
  <div className="mb-8 flex items-end justify-between border-b border-akboy-forest/25 pb-3">
    <h2 className="font-editorial text-2xl leading-none text-akboy-forest md:text-[2rem]">{label}</h2>
    {note && <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-akboy-muted">{note}</span>}
  </div>
);

const Headline = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`font-editorial text-akboy-forest ${className}`}>
    <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
      {children}
    </span>
  </h3>
);

/* ---------------- page ---------------- */

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
  const featureReveal = useReveal<HTMLDivElement>(80);
  const feedReveal = useReveal<HTMLDivElement>();

  const postPath = (p: CampusPost) => `/blog/${p.slug || p.id}`;

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
  const briefs = useMemo(() => posts.filter(p => p.id !== lead?.id).slice(0, 4), [posts, lead]);
  const featureBlock = useMemo(() => {
    const skip = new Set<string>([lead?.id, ...briefs.map(b => b.id)].filter(Boolean) as string[]);
    return posts.filter(p => !skip.has(p.id)).slice(0, 3);
  }, [posts, lead, briefs]);

  useEffect(() => {
    if (leadPool.length < 2) return;
    const t = window.setInterval(() => setLeadIndex(i => (i + 1) % leadPool.length), 8000);
    return () => window.clearInterval(t);
  }, [leadPool.length]);

  const feedSource = useMemo(() => {
    if (isFiltering) return filtered;
    const skip = new Set<string>([lead?.id, ...briefs.map(b => b.id), ...featureBlock.map(f => f.id)].filter(Boolean) as string[]);
    return filtered.filter(p => !skip.has(p.id));
  }, [filtered, isFiltering, lead, briefs, featureBlock]);

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

  const featuredSchools = useMemo(() => schoolList.slice(0, 14), [schoolList]);
  const mostRead = useMemo(() => posts.slice(0, 5), [posts]);

  const selectCategory = (c: string) => { setSelectedCategory(c); updateParam("category", c); setCurrentPage(1); };
  const selectSchool = (s: string) => { setSelectedSchool(s); updateParam("school", s); setCurrentPage(1); };
  const clearAll = () => {
    setSelectedCategory("All"); setSelectedSchool("All"); setSearchTerm("");
    setSearchParams({}, { replace: true }); setCurrentPage(1);
  };

  const shareOnWhatsApp = (e: React.MouseEvent, post: CampusPost) => {
    e.preventDefault(); e.stopPropagation();
    const url = `${window.location.origin}${postPath(post)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(`${post.title}\n\nRead: ${url}\n\nvia Akboy Campus Hub`)}`, "_blank");
  };

  const goToFeed = () => document.getElementById("feed")?.scrollIntoView({ behavior: "smooth" });

  return (
    <AkboyLayout
      title={isCampusHub ? "Campus Hub — Admissions, Scholarships & Campus Journalism" : "Campus Hub — Nigerian Admissions, Scholarships & Education Stories"}
      description="An Akboy publication: admission lists, scholarships, JAMB and WAEC updates and academic calendars from Nigerian universities, polytechnics and colleges."
    >
      {/* ================= MASTHEAD ================= */}
      <section className="bg-akboy-paper">
        <div className="mx-auto max-w-[1240px] px-5 pt-10 sm:px-8 md:pt-16">
          <div className="flex items-center justify-between border-b border-akboy-forest/20 pb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-akboy-muted">
            <span>An Akboy publication</span>
            <span className="hidden sm:inline">
              {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
            <span>Lagos · Nigeria</span>
          </div>

          <div className="py-8 text-center md:py-12">
            <h1 className="font-editorial text-[clamp(3rem,11vw,7rem)] font-semibold leading-[0.88] tracking-[-0.02em] text-akboy-forest">
              Campus&nbsp;Hub
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-akboy-muted md:text-base">
              Admission lists, scholarships, JAMB &amp; WAEC updates and academic calendars —
              reported and published for Nigerian students, daily.
            </p>

            <div className="mx-auto mt-7 max-w-lg">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-akboy-muted" />
                <Input
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); updateParam("q", e.target.value); setCurrentPage(1); }}
                  placeholder="Search a school, scholarship or keyword"
                  className="h-12 rounded-none border-0 border-b border-akboy-forest/30 bg-transparent px-11 text-center text-sm focus-visible:border-akboy-forest focus-visible:ring-0"
                />
              </label>
              {searchTerm && (
                <button onClick={goToFeed} className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-akboy-forest hover:underline">
                  {filtered.length} result{filtered.length === 1 ? "" : "s"} — read them →
                </button>
              )}
            </div>
          </div>

          {/* category rail */}
          <div className="-mx-5 overflow-x-auto border-y border-akboy-forest/20 px-5 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max items-center justify-start gap-7 py-3.5 sm:justify-center">
              {categoryOptions.slice(0, 9).map((c) => {
                const active = selectedCategory === c;
                return (
                  <button
                    key={c}
                    onClick={() => { selectCategory(c); if (c !== "All") goToFeed(); }}
                    className={`relative whitespace-nowrap pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors ${
                      active ? "text-akboy-forest" : "text-akboy-muted hover:text-akboy-forest"
                    }`}
                  >
                    {c === "All" ? "All stories" : c}
                    {active && <span className="absolute inset-x-0 -bottom-0.5 h-[3px] bg-akboy-butter" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ================= LEAD + BRIEFS ================= */}
      {!loading && lead && (
        <section className="bg-akboy-paper">
          <div ref={leadReveal.ref} className={`mx-auto max-w-[1240px] px-5 py-12 sm:px-8 md:py-16 ${leadReveal.cls}`}>
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
              {/* lead */}
              <article className="relative">
                <Link to={postPath(lead)} className="group block">
                  <PostImage
                    src={lead.featured_image_url}
                    alt={lead.title}
                    school={lead.school}
                    title={lead.title}
                    tags={lead.tags}
                    institution_type={lead.institution_type}
                    aspect="aspect-[16/10]"
                  />
                  <div className="relative z-10 -mt-10 ml-0 max-w-2xl bg-akboy-paper p-6 md:-mt-16 md:ml-10 md:p-9">
                    <Kicker post={lead} />
                    <Headline className="mt-3 text-[clamp(1.75rem,4.4vw,3.4rem)] font-semibold leading-[1.03] tracking-[-0.015em]">
                      {lead.title}
                    </Headline>
                    <p className="mt-4 max-w-xl text-[15px] leading-[1.75] text-akboy-muted">{standfirst(lead, 230)}</p>
                    <span className="mt-5 inline-flex items-center gap-2 border-b-2 border-akboy-butter pb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-akboy-forest">
                      Read the story <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>

                {leadPool.length > 1 && (
                  <div className="mt-2 flex items-center gap-2 md:ml-10">
                    <button
                      aria-label="Previous lead story"
                      onClick={() => setLeadIndex(i => (i - 1 + leadPool.length) % leadPool.length)}
                      className="grid h-9 w-9 place-items-center border border-akboy-forest/25 text-akboy-forest transition-colors hover:bg-akboy-forest hover:text-white"
                    ><ChevronLeft className="h-4 w-4" /></button>
                    <button
                      aria-label="Next lead story"
                      onClick={() => setLeadIndex(i => (i + 1) % leadPool.length)}
                      className="grid h-9 w-9 place-items-center border border-akboy-forest/25 text-akboy-forest transition-colors hover:bg-akboy-forest hover:text-white"
                    ><ChevronRight className="h-4 w-4" /></button>
                    <span className="ml-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-akboy-muted">
                      {String(leadIndex + 1).padStart(2, "0")} / {String(leadPool.length).padStart(2, "0")}
                    </span>
                  </div>
                )}
              </article>

              {/* briefs */}
              <aside className="lg:border-l lg:border-akboy-forest/20 lg:pl-10">
                <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.3em] text-akboy-muted">The briefs</p>
                <ol className="divide-y divide-akboy-line">
                  {briefs.map((post, i) => (
                    <li key={post.id}>
                      <Link to={postPath(post)} className="group flex gap-4 py-5 first:pt-0">
                        <span className="font-editorial text-2xl leading-none text-akboy-butter">{String(i + 1).padStart(2, "0")}</span>
                        <div className="min-w-0">
                          <Kicker post={post} />
                          <Headline className="mt-1.5 text-lg font-medium leading-snug">{post.title}</Headline>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ol>
              </aside>
            </div>
          </div>
        </section>
      )}

      {/* ================= FEATURE TRIO ================= */}
      {!loading && featureBlock.length > 0 && (
        <section className="border-t border-akboy-line bg-akboy-bone">
          <div ref={featureReveal.ref} className={`mx-auto max-w-[1240px] px-5 py-14 sm:px-8 md:py-20 ${featureReveal.cls}`}>
            <SectionRule label="In focus" note="Selected reading" />
            <div className="grid gap-10 md:grid-cols-3">
              {featureBlock.map((post, i) => (
                <Link key={post.id} to={postPath(post)} className={`group block ${i === 0 ? "md:col-span-1" : ""}`}>
                  <PostImage
                    src={post.featured_image_url}
                    alt={post.title}
                    school={post.school}
                    title={post.title}
                    tags={post.tags}
                    institution_type={post.institution_type}
                    aspect="aspect-[4/5]"
                    tone={i === 1 ? "butter" : "forest"}
                  />
                  <div className="pt-5">
                    <Kicker post={post} />
                    <Headline className="mt-2 text-[1.4rem] font-medium leading-[1.15]">{post.title}</Headline>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-akboy-muted">{standfirst(post, 150)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= INSTITUTIONS STRIP ================= */}
      {featuredSchools.length > 0 && (
        <section className="border-y border-akboy-line bg-akboy-paper">
          <div className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-akboy-muted">Browse by institution</p>
              {selectedSchool !== "All" && (
                <button onClick={() => selectSchool("All")} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-akboy-forest hover:underline">
                  Clear
                </button>
              )}
            </div>
            <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max items-center gap-3 pb-1">
                {featuredSchools.map(({ school, count }) => {
                  const active = selectedSchool === school;
                  return (
                    <button
                      key={school}
                      onClick={() => { selectSchool(school); goToFeed(); }}
                      className={`group flex items-center gap-3 border px-3.5 py-2.5 transition-colors ${
                        active ? "border-akboy-forest bg-akboy-forest text-white" : "border-akboy-line bg-white text-akboy-forest hover:border-akboy-forest"
                      }`}
                    >
                      <InstitutionLogo school={school} size={28} rounded="rounded-none" className="shrink-0" />
                      <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.12em]">{school}</span>
                      <span className={`text-[10px] ${active ? "text-white/70" : "text-akboy-muted"}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ================= FEED + RAIL ================= */}
      <section id="feed" className="scroll-mt-24 bg-akboy-paper">
        <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 md:py-20">
          <SectionRule
            label={isFiltering ? "Results" : "Latest"}
            note={`${feedSource.length} stor${feedSource.length === 1 ? "y" : "ies"} · page ${currentPage} of ${totalPages || 1}`}
          />

          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              {searchTerm && <span className="border border-akboy-line bg-white px-3 py-1.5 uppercase tracking-[0.14em] text-akboy-forest">“{searchTerm}”</span>}
              {selectedCategory !== "All" && <span className="border border-akboy-line bg-white px-3 py-1.5 uppercase tracking-[0.14em] text-akboy-forest">{selectedCategory}</span>}
              {selectedSchool !== "All" && <span className="border border-akboy-line bg-white px-3 py-1.5 uppercase tracking-[0.14em] text-akboy-forest">{selectedSchool}</span>}
              {isFiltering && (
                <button onClick={clearAll} className="font-semibold uppercase tracking-[0.16em] text-akboy-forest underline underline-offset-4">Clear all</button>
              )}
            </div>

            <div className="flex w-full gap-2 sm:w-auto">
              <Select value={selectedCategory} onValueChange={selectCategory}>
                <SelectTrigger className="h-11 w-full rounded-none border-akboy-line bg-white text-xs uppercase tracking-[0.12em] sm:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(c => (
                    <SelectItem key={c} value={c}>{c === "All" ? "All categories" : `${c} (${categoryCounts[c] || 0})`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSchool} onValueChange={selectSchool}>
                <SelectTrigger className="h-11 w-full rounded-none border-akboy-line bg-white text-xs uppercase tracking-[0.12em] sm:w-48">
                  <SelectValue placeholder="Institution" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  <SelectItem value="All">All institutions</SelectItem>
                  {schoolList.map(({ school, count }) => (
                    <SelectItem key={school} value={school}>{school} ({count})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_300px]">
            {/* feed */}
            <div ref={feedReveal.ref} className={feedReveal.cls}>
              {loading ? (
                <div className="space-y-8">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-5">
                      <div className="h-24 w-20 animate-pulse bg-akboy-bone sm:h-32 sm:w-28" />
                      <div className="flex-1 space-y-3 py-1">
                        <div className="h-3 w-28 animate-pulse bg-akboy-bone" />
                        <div className="h-5 w-full animate-pulse bg-akboy-bone" />
                        <div className="h-4 w-4/5 animate-pulse bg-akboy-bone" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="border border-akboy-line bg-white p-10 text-center">
                  <p className="font-editorial text-xl text-akboy-forest">{error}</p>
                  <Button onClick={fetchPosts} className="mt-5 rounded-none bg-akboy-forest px-6 uppercase tracking-[0.16em] hover:bg-akboy-moss">Try again</Button>
                </div>
              ) : paginatedFeed.length === 0 ? (
                <div className="border border-dashed border-akboy-line bg-white p-14 text-center">
                  <Newspaper className="mx-auto mb-4 h-9 w-9 text-akboy-muted" />
                  <p className="font-editorial text-2xl text-akboy-forest">Nothing matches that yet</p>
                  <p className="mt-2 text-sm text-akboy-muted">Try another keyword, or clear the filters to see everything.</p>
                  <button onClick={clearAll} className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-akboy-forest underline underline-offset-4">Clear filters</button>
                </div>
              ) : (
                <div className="divide-y divide-akboy-line border-t border-akboy-line">
                  {paginatedFeed.map((post) => (
                    <article key={post.id}>
                      <Link to={postPath(post)} className="group flex gap-5 py-7">
                        <PostImage
                          src={post.featured_image_url}
                          alt={post.title}
                          school={post.school}
                          title={post.title}
                          tags={post.tags}
                          institution_type={post.institution_type}
                          aspect="aspect-[4/5]"
                          className="w-[88px] shrink-0 sm:w-[132px]"
                        />
                        <div className="min-w-0 flex-1">
                          <Kicker post={post} />
                          <Headline className="mt-2 text-lg font-medium leading-snug sm:text-[1.375rem]">{post.title}</Headline>
                          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-akboy-muted sm:line-clamp-3">{standfirst(post)}</p>
                          <div className="mt-3 flex items-center gap-5">
                            <button
                              onClick={(e) => shareOnWhatsApp(e, post)}
                              className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-akboy-forest hover:underline"
                            >
                              <MessageCircle className="h-3.5 w-3.5" /> Share
                            </button>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-akboy-muted transition-colors group-hover:text-akboy-forest">
                              Read <ArrowUpRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => { setCurrentPage(Math.max(1, currentPage - 1)); goToFeed(); }}
                    disabled={currentPage === 1}
                    className="border border-akboy-line bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-akboy-forest disabled:opacity-40"
                  >Previous</button>
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                    let pageNum = idx + 1;
                    if (totalPages > 5) {
                      if (currentPage > 3 && currentPage < totalPages - 2) pageNum = currentPage - 2 + idx;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + idx;
                    }
                    if (pageNum < 1 || pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => { setCurrentPage(pageNum); goToFeed(); }}
                        className={`min-w-[40px] border px-3 py-2 text-[11px] font-semibold transition-colors ${
                          currentPage === pageNum
                            ? "border-akboy-forest bg-akboy-forest text-white"
                            : "border-akboy-line bg-white text-akboy-forest hover:bg-akboy-bone"
                        }`}
                      >{pageNum}</button>
                    );
                  })}
                  <button
                    onClick={() => { setCurrentPage(Math.min(totalPages, currentPage + 1)); goToFeed(); }}
                    disabled={currentPage === totalPages}
                    className="border border-akboy-line bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-akboy-forest disabled:opacity-40"
                  >Next</button>
                </div>
              )}
            </div>

            {/* rail */}
            <aside className="space-y-10 lg:border-l lg:border-akboy-line lg:pl-8">
              <div>
                <p className="mb-5 border-b border-akboy-forest/25 pb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-akboy-muted">Most read</p>
                <ol className="space-y-5">
                  {mostRead.map((post, idx) => (
                    <li key={post.id}>
                      <Link to={postPath(post)} className="group flex gap-3">
                        <span className="font-editorial text-xl leading-none text-akboy-butter">{String(idx + 1).padStart(2, "0")}</span>
                        <div className="min-w-0">
                          <Headline className="line-clamp-2 text-sm font-medium leading-snug">{post.title}</Headline>
                          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-akboy-muted">{timeAgo(post.created_at)}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-akboy-forest p-7 text-white">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-akboy-butter">Need guidance?</p>
                <h3 className="mt-3 font-editorial text-2xl leading-tight">Talk to an Akboy admission consultant</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/75">
                  Course choice, change of institution, post-UTME and admission processing — handled by people who do it daily.
                </p>
                <a
                  href="https://wa.me/2347050757085"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 bg-akboy-butter px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-akboy-forest transition-colors hover:bg-white"
                >
                  <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ================= TOOLS ================= */}
      <CampusHubAdvancedSection posts={posts} schools={featuredSchools} />

      <WhatsAppConsultButton />
    </AkboyLayout>
  );
}

import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AkboyLayout } from "@/components/akboy/AkboyLayout";
import { useDomainDetection } from "@/hooks/useDomainDetection";
import { InstitutionLogo, useInstitutionOverrides } from "@/components/InstitutionLogo";
import {
  Search, ArrowRight, ArrowUpRight, TrendingUp, MessageCircle,
  ChevronLeft, ChevronRight, Newspaper,
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

const ITEMS_PER_PAGE = 12;

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" }) : "Recent";

const timeAgo = (d?: string) => {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
};

const plain = (p: CampusPost, len = 160) =>
  (p.excerpt || p.content?.replace(/<[^>]*>/g, "") || "").trim().slice(0, len);

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
      setError("Failed to load posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "All") next.set(key, value); else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const text = `${p.title || ""} ${p.excerpt || ""} ${p.school || ""}`.toLowerCase();
      const matchSearch = !searchTerm || text.includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === "All" || (p.category || "News & Updates") === selectedCategory;
      const matchSchool = selectedSchool === "All" || (p.school || "Other") === selectedSchool;
      return matchSearch && matchCat && matchSchool;
    });
  }, [posts, searchTerm, selectedCategory, selectedSchool]);

  const isFiltering = selectedCategory !== "All" || selectedSchool !== "All" || Boolean(searchTerm);

  const leadPool = useMemo(() => (isFiltering ? filtered : posts).slice(0, 5), [filtered, posts, isFiltering]);
  const lead = leadPool[leadIndex % Math.max(1, leadPool.length)];
  const secondary = useMemo(
    () => (isFiltering ? filtered : posts).filter(p => p.id !== lead?.id).slice(0, 3),
    [filtered, posts, isFiltering, lead]
  );

  useEffect(() => { setLeadIndex(0); }, [isFiltering, selectedCategory, selectedSchool, searchTerm]);

  useEffect(() => {
    if (leadPool.length < 2) return;
    const t = setInterval(() => setLeadIndex(i => (i + 1) % leadPool.length), 7000);
    return () => clearInterval(t);
  }, [leadPool.length]);

  const feedSource = useMemo(() => {
    const skip = new Set<string>([lead?.id, ...secondary.map(s => s.id)].filter(Boolean) as string[]);
    return isFiltering ? filtered : filtered.filter(p => !skip.has(p.id));
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
    posts.forEach(p => { if (p.school) counts[p.school] = (counts[p.school] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([school, count]) => ({ school, count }));
  }, [posts]);

  const featuredSchools = useMemo(
    () => schoolList.filter(s => !["Other", "Other University"].includes(s.school)).slice(0, 12),
    [schoolList]
  );

  const trending = useMemo(() => posts.slice(0, 6), [posts]);

  const selectCategory = (c: string) => {
    setSelectedCategory(c);
    updateParam("category", c);
    setCurrentPage(1);
  };

  const clearAll = () => {
    setSelectedCategory("All"); setSelectedSchool("All"); setSearchTerm("");
    setSearchParams({}, { replace: true });
    setCurrentPage(1);
  };

  const shareOnWhatsApp = (e: React.MouseEvent, post: CampusPost) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}${postPath(post)}`;
    const text = `${post.title}\n\nRead more: ${url}\n\nvia Akboy Campus Hub`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const goToFeed = () => document.getElementById("feed")?.scrollIntoView({ behavior: "smooth" });

  const Kicker = ({ post }: { post: CampusPost }) => (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.18em] text-akboy-muted">
      <span className="font-semibold text-akboy-forest">{post.category || "News"}</span>
      {post.school && !["Other", "Other University"].includes(post.school) && (
        <>
          <span aria-hidden>·</span>
          <span>{post.school}</span>
        </>
      )}
      <span aria-hidden>·</span>
      <span>{timeAgo(post.created_at)}</span>
    </div>
  );

  return (
    <AkboyLayout
      title={isCampusHub ? "Campus Hub — Admissions, Scholarships & Campus News" : "Campus Hub — Nigerian Admissions, Scholarships & Education News"}
      description="Latest admission updates, scholarships, JAMB/WAEC news and academic calendars from Nigerian universities, polytechnics and colleges. All in one hub."
    >
      {/* ============ MASTHEAD ============ */}
      <section className="border-b border-akboy-line bg-akboy-paper">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 md:py-14">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-akboy-muted">
                {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
              <h1 className="font-display text-4xl leading-[1.05] text-akboy-forest md:text-6xl">
                Campus Hub
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-akboy-muted">
                Admission lists, scholarships, JAMB and WAEC updates, and academic calendars from Nigerian
                universities, polytechnics and colleges — verified and published daily.
              </p>
            </div>

            <div className="w-full md:max-w-sm">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-akboy-muted" />
                <Input
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); updateParam("q", e.target.value); setCurrentPage(1); }}
                  placeholder="Search a school, course or keyword"
                  className="h-12 rounded-none border-akboy-forest/30 bg-white pl-11 text-sm focus-visible:ring-akboy-forest"
                />
              </label>
              {searchTerm && (
                <button onClick={goToFeed} className="mt-2 text-xs font-semibold text-akboy-forest hover:underline">
                  {filtered.length} result{filtered.length === 1 ? "" : "s"} — jump to the feed →
                </button>
              )}
            </div>
          </div>

          {/* Category rail */}
          <div className="-mx-4 mt-8 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="flex min-w-max items-center gap-2 pb-1">
              {categoryOptions.slice(0, 10).map((c) => {
                const active = selectedCategory === c;
                return (
                  <button
                    key={c}
                    onClick={() => { selectCategory(c); if (c !== "All") goToFeed(); }}
                    className={`whitespace-nowrap border px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                      active
                        ? "border-akboy-forest bg-akboy-butter text-akboy-forest"
                        : "border-akboy-line bg-white text-akboy-muted hover:border-akboy-forest hover:text-akboy-forest"
                    }`}
                  >
                    {c === "All" ? "All stories" : c}
                    {c !== "All" && <span className="ml-2 text-akboy-muted/70">{categoryCounts[c] || 0}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ============ LEAD STORY ============ */}
      {!loading && lead && (
        <section className="border-b border-akboy-line bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 md:py-14">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
              {/* Lead */}
              <article>
                <div className="mb-5 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-akboy-muted">Lead story</p>
                  {leadPool.length > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        aria-label="Previous story"
                        onClick={() => setLeadIndex(i => (i - 1 + leadPool.length) % leadPool.length)}
                        className="grid h-8 w-8 place-items-center border border-akboy-line text-akboy-forest hover:bg-akboy-bone"
                      ><ChevronLeft className="h-4 w-4" /></button>
                      <button
                        aria-label="Next story"
                        onClick={() => setLeadIndex(i => (i + 1) % leadPool.length)}
                        className="grid h-8 w-8 place-items-center border border-akboy-line text-akboy-forest hover:bg-akboy-bone"
                      ><ChevronRight className="h-4 w-4" /></button>
                    </div>
                  )}
                </div>

                <Link to={postPath(lead)} className="group block">
                  <div className="flex items-start gap-4">
                    <InstitutionLogo
                      school={lead.school}
                      title={lead.title}
                      tags={lead.tags}
                      institution_type={lead.institution_type}
                      size={64}
                      rounded="rounded-none"
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <Kicker post={lead} />
                      <h2 className="mt-2 font-display text-2xl leading-tight text-akboy-forest transition-colors group-hover:text-akboy-moss md:text-4xl">
                        {lead.title}
                      </h2>
                    </div>
                  </div>

                  {lead.featured_image_url && (
                    <div className="mt-6 aspect-[16/9] w-full overflow-hidden border border-akboy-line bg-akboy-bone">
                      <img
                        src={lead.featured_image_url}
                        alt={lead.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                  )}

                  <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-akboy-muted">
                    {plain(lead, 240)}…
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 border-b-2 border-akboy-butter pb-0.5 text-sm font-semibold text-akboy-forest">
                    Read the full story <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </article>

              {/* Secondary column */}
              <div className="lg:border-l lg:border-akboy-line lg:pl-10">
                <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-akboy-muted">Also this week</p>
                <div className="divide-y divide-akboy-line">
                  {secondary.map((post) => (
                    <Link key={post.id} to={postPath(post)} className="group flex gap-4 py-5 first:pt-0">
                      <InstitutionLogo
                        school={post.school}
                        title={post.title}
                        tags={post.tags}
                        institution_type={post.institution_type}
                        size={48}
                        rounded="rounded-none"
                        className="shrink-0"
                      />
                      <div className="min-w-0">
                        <Kicker post={post} />
                        <h3 className="mt-1.5 font-display text-lg leading-snug text-akboy-forest transition-colors group-hover:text-akboy-moss">
                          {post.title}
                        </h3>
                      </div>
                    </Link>
                  ))}
                  {secondary.length === 0 && (
                    <p className="py-5 text-sm text-akboy-muted">More stories coming shortly.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============ FEED + RAIL ============ */}
      <section id="feed" className="scroll-mt-24 bg-akboy-bone">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 md:py-16">
          <div className="mb-6 flex flex-col gap-4 border-b border-akboy-line pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-akboy-muted">The feed</p>
              <h2 className="mt-2 font-display text-2xl text-akboy-forest md:text-3xl">Latest campus updates</h2>
              <p className="mt-1 text-sm text-akboy-muted">
                {feedSource.length} update{feedSource.length === 1 ? "" : "s"} · page {currentPage} of {totalPages || 1}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
              <Select value={selectedCategory} onValueChange={selectCategory}>
                <SelectTrigger className="h-11 w-full rounded-none border-akboy-line bg-white sm:w-52">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(c => (
                    <SelectItem key={c} value={c}>
                      {c === "All" ? "All categories" : `${c} (${categoryCounts[c] || 0})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedSchool}
                onValueChange={(v) => { setSelectedSchool(v); updateParam("school", v); setCurrentPage(1); }}
              >
                <SelectTrigger className="h-11 w-full rounded-none border-akboy-line bg-white sm:w-52">
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

          {isFiltering && (
            <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
              {searchTerm && <span className="border border-akboy-line bg-white px-3 py-1.5 text-akboy-forest">“{searchTerm}”</span>}
              {selectedCategory !== "All" && <span className="border border-akboy-line bg-white px-3 py-1.5 text-akboy-forest">{selectedCategory}</span>}
              {selectedSchool !== "All" && <span className="border border-akboy-line bg-white px-3 py-1.5 text-akboy-forest">{selectedSchool}</span>}
              <button onClick={clearAll} className="font-semibold text-akboy-forest underline underline-offset-4">Clear filters</button>
            </div>
          )}

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* Feed */}
            <div>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse bg-white" />
                  ))}
                </div>
              ) : error ? (
                <Card className="rounded-none border border-akboy-line bg-white p-8 text-center">
                  <p className="font-medium text-akboy-forest">{error}</p>
                  <Button onClick={fetchPosts} className="mt-4 rounded-none bg-akboy-forest hover:bg-akboy-moss">Retry</Button>
                </Card>
              ) : paginatedFeed.length === 0 ? (
                <Card className="rounded-none border border-dashed border-akboy-line bg-white p-12 text-center">
                  <Newspaper className="mx-auto mb-3 h-10 w-10 text-akboy-muted" />
                  <p className="font-display text-lg text-akboy-forest">No matching updates</p>
                  <p className="mt-1 text-sm text-akboy-muted">Try a different search term or clear the filters.</p>
                </Card>
              ) : (
                <div className="divide-y divide-akboy-line border-y border-akboy-line bg-white">
                  {paginatedFeed.map((post) => (
                    <Link key={post.id} to={postPath(post)} className="group flex gap-4 p-4 transition-colors hover:bg-akboy-bone sm:p-5">
                      <InstitutionLogo
                        school={post.school}
                        title={post.title}
                        tags={post.tags}
                        institution_type={post.institution_type}
                        size={56}
                        rounded="rounded-none"
                        className="shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <Kicker post={post} />
                        <h3 className="mt-1.5 font-display text-base leading-snug text-akboy-forest transition-colors group-hover:text-akboy-moss sm:text-lg">
                          {post.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm text-akboy-muted">{plain(post, 150)}</p>
                        <div className="mt-3 flex items-center gap-4">
                          <button
                            onClick={(e) => shareOnWhatsApp(e, post)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-akboy-forest hover:underline"
                          >
                            <MessageCircle className="h-3.5 w-3.5" /> Share
                          </button>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-akboy-muted group-hover:text-akboy-forest">
                            Read <ArrowUpRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => { setCurrentPage(Math.max(1, currentPage - 1)); goToFeed(); }}
                    disabled={currentPage === 1}
                    className="border border-akboy-line bg-white px-4 py-2 text-sm font-semibold text-akboy-forest disabled:opacity-40"
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
                        className={`min-w-[40px] border px-3 py-2 text-sm font-semibold transition-colors ${
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
                    className="border border-akboy-line bg-white px-4 py-2 text-sm font-semibold text-akboy-forest disabled:opacity-40"
                  >Next</button>
                </div>
              )}
            </div>

            {/* Rail */}
            <aside className="space-y-8">
              <div className="border border-akboy-line bg-white p-6">
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-akboy-forest" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-akboy-muted">Trending now</p>
                </div>
                <ol className="space-y-4">
                  {trending.map((post, idx) => (
                    <li key={post.id}>
                      <Link to={postPath(post)} className="group flex gap-3">
                        <span className="font-display text-lg leading-none text-akboy-butter">{String(idx + 1).padStart(2, "0")}</span>
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-medium text-akboy-forest group-hover:text-akboy-moss">{post.title}</p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-akboy-muted">{timeAgo(post.created_at)}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>

              {featuredSchools.length > 0 && (
                <div className="border border-akboy-line bg-white p-6">
                  <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-akboy-muted">Browse by institution</p>
                  <div className="space-y-1">
                    {featuredSchools.map(({ school, count }) => (
                      <button
                        key={school}
                        onClick={() => { setSelectedSchool(school); updateParam("school", school); setCurrentPage(1); goToFeed(); }}
                        className="flex w-full items-center gap-3 border-b border-akboy-line/60 py-2 text-left last:border-0 hover:text-akboy-moss"
                      >
                        <InstitutionLogo school={school} size={28} rounded="rounded-none" className="shrink-0" />
                        <span className="flex-1 truncate text-sm font-medium text-akboy-forest">{school}</span>
                        <span className="text-xs text-akboy-muted">{count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="border border-akboy-line bg-akboy-forest p-6 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-akboy-butter">Need guidance?</p>
                <h3 className="mt-2 font-display text-xl leading-snug">Talk to an Akboy admission consultant</h3>
                <p className="mt-2 text-sm text-white/75">
                  Course choice, JAMB change of institution, post-UTME and admission processing — we handle it.
                </p>
                <a
                  href="https://wa.me/2347050757085"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 bg-akboy-butter px-4 py-2.5 text-sm font-semibold text-akboy-forest hover:bg-akboy-butter/85"
                >
                  <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ============ TOOLS, BOOKING & NEWSLETTER ============ */}
      <CampusHubAdvancedSection posts={posts} schools={featuredSchools} />

      <WhatsAppConsultButton />
    </AkboyLayout>
  );
}

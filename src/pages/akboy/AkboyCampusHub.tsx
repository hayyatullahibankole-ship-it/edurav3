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
import { headlineText, bodyText } from "@/lib/editorialText";
import { PostImage } from "@/components/akboy/PostImage";
import {
  Search, ArrowRight, ArrowUpRight, MessageCircle, ChevronLeft, ChevronRight, Newspaper,
  GraduationCap, BookOpen, Award, CalendarDays,
} from "lucide-react";
import { CampusHubAdvancedSection, ConsultationBookingForm, WhatsAppConsultButton } from "@/components/akboy/CampusHubAdvanced";

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
  const raw = bodyText(p.excerpt || p.content || "");
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
    <span className="box-decoration-clone border-b border-transparent transition-colors duration-300 group-hover:border-akboy-butter">
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
  useEffect(() => {
    if (leadPool.length < 2) return;
    const t = window.setInterval(() => setLeadIndex(i => (i + 1) % leadPool.length), 8000);
    return () => window.clearInterval(t);
  }, [leadPool.length]);

  const feedSource = useMemo(() => {
    if (isFiltering) return filtered;
    const skip = new Set<string>([lead?.id, ...briefs.slice(0, 3).map(b => b.id)].filter(Boolean) as string[]);
    return filtered.filter(p => !skip.has(p.id));
  }, [filtered, isFiltering, lead, briefs]);

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
    window.open(`https://wa.me/?text=${encodeURIComponent(`${headlineText(post.title)}\n\nRead: ${url}\n\nvia Akboy Campus Hub`)}`, "_blank");
  };

  const goToFeed = () => document.getElementById("feed")?.scrollIntoView({ behavior: "smooth" });

  return (
    <AkboyLayout
      title={isCampusHub ? "Campus Hub — Admissions, Scholarships & Campus Journalism" : "Campus Hub — Nigerian Admissions, Scholarships & Education Stories"}
      description="An Akboy publication: admission lists, scholarships, JAMB and WAEC updates and academic calendars from Nigerian universities, polytechnics and colleges."
    >
      <section className="border-b border-akboy-line bg-akboy-paper">
        <div className="mx-auto max-w-[1240px] px-5 py-9 sm:px-8 md:py-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-end">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-akboy-lime" />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-akboy-moss">An Akboy publication</p>
              </div>
              <h1 className="max-w-3xl font-editorial text-[clamp(2.7rem,7vw,5.2rem)] font-semibold leading-[0.96] text-akboy-forest">
                Campus Hub
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-akboy-muted md:text-lg">
                The useful side of campus life — credible admission news, scholarships, exam updates and expert guidance for Nigerian students.
              </p>
            </div>

            <div>
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-akboy-muted" />
                <Input
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); updateParam("q", e.target.value); setCurrentPage(1); }}
                  placeholder="Search a school, scholarship or keyword"
                  className="h-14 rounded-lg border-akboy-line bg-akboy-mist pl-12 pr-4 text-sm text-akboy-forest shadow-none focus-visible:border-akboy-forest focus-visible:ring-akboy-forest/15"
                />
              </label>
              <div className="mt-3 flex items-center justify-between text-xs text-akboy-muted">
                <span>{posts.length} verified updates</span>
                <span>{new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</span>
              </div>
            </div>
          </div>

          <div className="-mx-5 mt-8 overflow-x-auto px-5 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max items-center gap-2">
              {categoryOptions.slice(0, 9).map((category) => (
                <Button
                  key={category}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { selectCategory(category); if (category !== "All") goToFeed(); }}
                  className={`rounded-full border px-4 text-xs font-semibold ${
                    selectedCategory === category
                      ? "border-akboy-forest bg-akboy-forest text-akboy-paper hover:bg-akboy-moss hover:text-akboy-paper"
                      : "border-akboy-line bg-akboy-paper text-akboy-forest hover:bg-akboy-mist"
                  }`}
                >
                  {category === "All" ? "All stories" : category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {!loading && lead && (
        <section className="bg-akboy-paper">
          <div ref={leadReveal.ref} className={`mx-auto max-w-[1240px] px-5 py-10 sm:px-8 md:py-14 ${leadReveal.cls}`}>
            <div className="grid gap-6 lg:grid-cols-12">
              <article className="overflow-hidden rounded-2xl border border-akboy-line bg-akboy-mist lg:col-span-8">
                <Link to={postPath(lead)} className="group block">
                  <PostImage
                    src={lead.featured_image_url}
                    alt={headlineText(lead.title)}
                    school={lead.school}
                    title={headlineText(lead.title)}
                    tags={lead.tags}
                    institution_type={lead.institution_type}
                    aspect="aspect-[16/9]"
                  />
                  <div className="p-6 sm:p-8">
                    <Kicker post={lead} />
                    <Headline className="mt-3 text-[clamp(1.8rem,4vw,3.25rem)] font-semibold leading-[1.05]">
                      {headlineText(lead.title)}
                    </Headline>
                    <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-akboy-muted">{standfirst(lead, 220)}</p>
                    <span className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-akboy-forest">
                      Read full story <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
                {leadPool.length > 1 && (
                  <div className="flex items-center gap-2 border-t border-akboy-line px-6 py-4 sm:px-8">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Previous featured story"
                      onClick={() => setLeadIndex((index) => (index - 1 + leadPool.length) % leadPool.length)}
                      className="h-9 w-9 rounded-full border-akboy-line bg-akboy-paper text-akboy-forest hover:bg-akboy-forest hover:text-akboy-paper"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Next featured story"
                      onClick={() => setLeadIndex((index) => (index + 1) % leadPool.length)}
                      className="h-9 w-9 rounded-full border-akboy-line bg-akboy-paper text-akboy-forest hover:bg-akboy-forest hover:text-akboy-paper"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="ml-2 text-xs font-semibold text-akboy-muted">
                      {leadIndex + 1} of {leadPool.length}
                    </span>
                  </div>
                )}
              </article>

              <aside className="flex flex-col justify-between rounded-2xl bg-akboy-forest p-7 text-akboy-paper sm:p-9 lg:col-span-4">
                <div>
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-akboy-lime text-akboy-forest">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.2em] text-akboy-lime">Educational consultancy</p>
                  <h2 className="mt-3 font-editorial text-3xl font-semibold leading-tight">Make your next admission move with confidence.</h2>
                  <p className="mt-4 text-sm leading-relaxed text-akboy-paper/75">
                    Get practical help with course selection, post-UTME, institution changes and admission processing.
                  </p>
                  <ul className="mt-7 space-y-3 border-y border-akboy-paper/15 py-5 text-sm">
                    <li className="flex items-center gap-3"><BookOpen className="h-4 w-4 text-akboy-lime" /> Course and institution guidance</li>
                    <li className="flex items-center gap-3"><Award className="h-4 w-4 text-akboy-lime" /> Scholarship and application support</li>
                    <li className="flex items-center gap-3"><CalendarDays className="h-4 w-4 text-akboy-lime" /> Deadline and exam planning</li>
                  </ul>
                </div>
                <div className="mt-8 space-y-3">
                  <ConsultationBookingForm
                    trigger={
                      <Button className="h-12 w-full rounded-lg bg-akboy-lime font-bold text-akboy-forest hover:bg-akboy-paper">
                        Book free consultation <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Button asChild variant="outline" className="h-12 w-full rounded-lg border-akboy-paper/25 bg-transparent text-akboy-paper hover:bg-akboy-paper/10 hover:text-akboy-paper">
                    <a href="https://wa.me/2348101466977" target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
                    </a>
                  </Button>
                </div>
              </aside>
            </div>
          </div>
        </section>
      )}

      {!loading && briefs.length > 0 && (
        <section className="bg-akboy-paper pb-14 md:pb-20">
          <div ref={featureReveal.ref} className={`mx-auto max-w-[1240px] px-5 sm:px-8 ${featureReveal.cls}`}>
            <SectionRule label="Worth your attention" note="Fresh updates" />
            <div className="grid gap-5 md:grid-cols-3">
              {briefs.slice(0, 3).map((post, index) => (
                <Link key={post.id} to={postPath(post)} className="group overflow-hidden rounded-xl border border-akboy-line bg-akboy-paper transition-transform duration-300 hover:-translate-y-1">
                  <PostImage
                    src={post.featured_image_url}
                    alt={headlineText(post.title)}
                    school={post.school}
                    title={headlineText(post.title)}
                    tags={post.tags}
                    institution_type={post.institution_type}
                    aspect="aspect-[16/10]"
                    tone={index === 1 ? "butter" : "forest"}
                  />
                  <div className="p-5">
                    <Kicker post={post} />
                    <Headline className="mt-2 text-xl font-semibold leading-snug">{headlineText(post.title)}</Headline>
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-akboy-muted">{standfirst(post, 130)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {featuredSchools.length > 0 && (
        <section className="border-y border-akboy-line bg-akboy-mist">
          <div className="mx-auto max-w-[1240px] px-5 py-7 sm:px-8">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-akboy-forest">Follow your institution</p>
              {selectedSchool !== "All" && (
                <Button type="button" variant="link" onClick={() => selectSchool("All")} className="h-auto p-0 text-xs text-akboy-forest">Clear filter</Button>
              )}
            </div>
            <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max items-center gap-3 pb-1">
                {featuredSchools.map(({ school, count }) => (
                  <Button
                    key={school}
                    type="button"
                    variant="outline"
                    onClick={() => { selectSchool(school); goToFeed(); }}
                    className={`h-12 rounded-lg px-3 ${selectedSchool === school ? "border-akboy-forest bg-akboy-forest text-akboy-paper hover:bg-akboy-moss hover:text-akboy-paper" : "border-akboy-line bg-akboy-paper text-akboy-forest hover:bg-akboy-paper"}`}
                  >
                    <InstitutionLogo school={school} size={28} rounded="rounded-md" className="shrink-0" />
                    <span className="max-w-[150px] truncate text-xs font-semibold">{school}</span>
                    <span className="text-[10px] opacity-70">{count}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section id="feed" className="scroll-mt-24 bg-akboy-paper">
        <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 md:py-20">
          <SectionRule
            label={isFiltering ? "Search results" : "Latest stories"}
            note={`${feedSource.length} stor${feedSource.length === 1 ? "y" : "ies"} · page ${currentPage} of ${totalPages || 1}`}
          />

          <div className="mb-8 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-akboy-muted" />
              <Input
                value={searchTerm}
                onChange={(event) => { setSearchTerm(event.target.value); updateParam("q", event.target.value); setCurrentPage(1); }}
                placeholder="Search all stories"
                className="h-11 rounded-lg border-akboy-line bg-akboy-mist pl-11 text-sm"
              />
            </label>
            <Select value={selectedCategory} onValueChange={selectCategory}>
              <SelectTrigger className="h-11 rounded-lg border-akboy-line bg-akboy-paper text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>{categoryOptions.map((category) => <SelectItem key={category} value={category}>{category === "All" ? "All categories" : `${category} (${categoryCounts[category] || 0})`}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedSchool} onValueChange={selectSchool}>
              <SelectTrigger className="h-11 rounded-lg border-akboy-line bg-akboy-paper text-xs"><SelectValue placeholder="Institution" /></SelectTrigger>
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

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div ref={feedReveal.ref} className={feedReveal.cls}>
              {loading ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[4/3] animate-pulse rounded-xl bg-akboy-mist" />)}
                </div>
              ) : error ? (
                <div className="rounded-xl border border-akboy-line bg-akboy-mist p-10 text-center">
                  <p className="font-editorial text-xl text-akboy-forest">{error}</p>
                  <Button onClick={fetchPosts} className="mt-5 bg-akboy-forest text-akboy-paper hover:bg-akboy-moss">Try again</Button>
                </div>
              ) : paginatedFeed.length === 0 ? (
                <div className="rounded-xl border border-dashed border-akboy-line bg-akboy-mist p-12 text-center">
                  <Newspaper className="mx-auto mb-4 h-9 w-9 text-akboy-muted" />
                  <p className="font-editorial text-2xl text-akboy-forest">Nothing matches that yet</p>
                  <p className="mt-2 text-sm text-akboy-muted">Try another keyword or clear the filters.</p>
                  <Button type="button" variant="link" onClick={clearAll} className="mt-3 text-akboy-forest">Clear filters</Button>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {paginatedFeed.map((post) => (
                    <article key={post.id} className="group overflow-hidden rounded-xl border border-akboy-line bg-akboy-paper">
                      <Link to={postPath(post)} className="block">
                        <PostImage
                          src={post.featured_image_url}
                          alt={headlineText(post.title)}
                          school={post.school}
                          title={headlineText(post.title)}
                          tags={post.tags}
                          institution_type={post.institution_type}
                          aspect="aspect-[16/10]"
                        />
                        <div className="p-5">
                          <Kicker post={post} />
                          <Headline className="mt-2 text-xl font-semibold leading-snug">{headlineText(post.title)}</Headline>
                          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-akboy-muted">{standfirst(post)}</p>
                        </div>
                      </Link>
                      <div className="flex items-center justify-between border-t border-akboy-line px-5 py-3">
                        <Button type="button" variant="ghost" size="sm" onClick={(event) => shareOnWhatsApp(event, post)} className="h-8 px-0 text-xs text-akboy-forest hover:bg-transparent hover:text-akboy-moss">
                          <MessageCircle className="h-4 w-4" /> Share
                        </Button>
                        <Link to={postPath(post)} className="inline-flex items-center gap-1 text-xs font-bold text-akboy-forest">Read <ArrowUpRight className="h-4 w-4" /></Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                  <Button type="button" variant="outline" onClick={() => { setCurrentPage(Math.max(1, currentPage - 1)); goToFeed(); }} disabled={currentPage === 1} className="border-akboy-line text-akboy-forest">Previous</Button>
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                    let pageNumber = index + 1;
                    if (totalPages > 5) {
                      if (currentPage > 3 && currentPage < totalPages - 2) pageNumber = currentPage - 2 + index;
                      else if (currentPage >= totalPages - 2) pageNumber = totalPages - 4 + index;
                    }
                    if (pageNumber < 1 || pageNumber > totalPages) return null;
                    return (
                      <Button key={pageNumber} type="button" variant={currentPage === pageNumber ? "default" : "outline"} onClick={() => { setCurrentPage(pageNumber); goToFeed(); }} className={currentPage === pageNumber ? "bg-akboy-forest text-akboy-paper hover:bg-akboy-moss" : "border-akboy-line text-akboy-forest"}>{pageNumber}</Button>
                    );
                  })}
                  <Button type="button" variant="outline" onClick={() => { setCurrentPage(Math.min(totalPages, currentPage + 1)); goToFeed(); }} disabled={currentPage === totalPages} className="border-akboy-line text-akboy-forest">Next</Button>
                </div>
              )}
            </div>

            <aside className="space-y-6">
              <div className="rounded-xl bg-akboy-mist p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-akboy-forest">Most read</p>
                <ol className="mt-5 divide-y divide-akboy-line">
                  {mostRead.map((post, index) => (
                    <li key={post.id}>
                      <Link to={postPath(post)} className="group flex gap-4 py-4 first:pt-0 last:pb-0">
                        <span className="font-editorial text-2xl font-semibold text-akboy-moss">{String(index + 1).padStart(2, "0")}</span>
                        <div className="min-w-0">
                          <Headline className="line-clamp-2 text-sm font-semibold leading-snug">{headlineText(post.title)}</Headline>
                          <p className="mt-1 text-xs text-akboy-muted">{timeAgo(post.created_at)}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-xl border border-akboy-line bg-akboy-paper p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-akboy-moss">Stay ready</p>
                <h3 className="mt-3 font-editorial text-2xl font-semibold leading-tight text-akboy-forest">Never miss an admission deadline.</h3>
                <p className="mt-3 text-sm leading-relaxed text-akboy-muted">Get important dates and application guidance directly from the Akboy team.</p>
                <Button asChild className="mt-5 w-full bg-akboy-forest text-akboy-paper hover:bg-akboy-moss">
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

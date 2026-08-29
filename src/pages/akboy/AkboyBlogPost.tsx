import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { AkboyLayout } from "@/components/akboy/AkboyLayout";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft, Tag, Share2, Copy, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InstitutionLogo, useInstitutionOverrides } from "@/components/InstitutionLogo";
import { resolveInstitutionLogo } from "@/lib/institutionLogos";

// Function to format plain text content into proper HTML
const formatBlogContent = (content: string): string => {
  // If content already has HTML tags, return as is
  if (content.includes('<p>') || content.includes('<h1>') || content.includes('<h2>')) {
    return content;
  }
  
  // Split by double line breaks to create paragraphs
  const paragraphs = content.split(/\n\n+/);
  
  return paragraphs
    .map(para => {
      // Skip empty paragraphs
      if (!para.trim()) return '';
      
      // Check if it looks like a heading (short line, possibly with # or all caps)
      if (para.length < 60 && (para.startsWith('#') || para === para.toUpperCase())) {
        const cleanPara = para.replace(/^#+\s*/, '');
        return `<h2>${cleanPara}</h2>`;
      }
      
      // Wrap in paragraph tags
      return `<p>${para.replace(/\n/g, '<br>')}</p>`;
    })
    .filter(p => p)
    .join('');
};

// Social share utilities
const getShareUrl = (platform: string, url: string, title: string, description: string, imageUrl?: string, edgeFunctionUrl?: string) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const encodedText = encodeURIComponent(`${title}\n\n${description}\n\n`);
  
  // For WhatsApp, use the edge function URL for proper OG preview with image
  const shareLink = edgeFunctionUrl || url;
  const encodedShareLink = encodeURIComponent(shareLink);
  const whatsappText = encodeURIComponent(`${title}\n\n${description}\n\n${shareLink}`);

  switch (platform) {
    case 'whatsapp':
      // Use intent:// for Android to trigger app chooser when multiple WhatsApp apps exist
      return `https://wa.me/?text=${whatsappText}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedShareLink}&quote=${encodedTitle}`;
    case 'twitter':
      return `https://twitter.com/intent/tweet?url=${encodedShareLink}&text=${encodedTitle}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedShareLink}`;
    case 'telegram':
      return `https://t.me/share/url?url=${encodedShareLink}&text=${encodedText}`;
    default:
      return '';
  }
};

// Safe tag parsing helper
const parseTags = (tags: any): string[] => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter(t => typeof t === 'string');
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed.filter(t => typeof t === 'string') : [];
    } catch {
      return [];
    }
  }
  return [];
};

export default function AkboyBlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  useInstitutionOverrides();

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      setError(null);
      // First try to fetch by slug
      let query = supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true);

      // Check if slug looks like a UUID (has dashes in UUID format)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug || "");
      
      if (isUUID) {
        query = query.eq("id", slug);
      } else {
        query = query.eq("slug", slug);
      }

      const { data, error: fetchError } = await query.maybeSingle();

      if (fetchError) throw fetchError;
      setPost(data);
      if (data) fetchRelated(data);
    } catch (err) {
      console.error("Error fetching blog post:", err);
      setError("Failed to load blog post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRelated = async (current: any) => {
    try {
      let q = supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, featured_image_url, category, tags, created_at, school, institution_type")
        .eq("is_published", true)
        .neq("id", current.id)
        .order("created_at", { ascending: false })
        .limit(3);
      if (current.category) q = q.eq("category", current.category);
      const { data } = await q;
      if (data && data.length) { setRelated(data); return; }
      const { data: fallback } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, featured_image_url, category, tags, created_at, school, institution_type")
        .eq("is_published", true)
        .neq("id", current.id)
        .order("created_at", { ascending: false })
        .limit(3);
      setRelated(fallback || []);
    } catch (err) {
      console.error("Error fetching related posts:", err);
    }
  };


  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied!",
      description: "Blog post link copied to clipboard",
    });
  };

  const handleShare = (platform: string) => {
    if (!post) return;
    
    const url = window.location.href;
    const title = post.title;
    const description = post.excerpt || post.content?.substring(0, 160).replace(/<[^>]*>/g, '') || '';
    const imageUrl = post.featured_image_url || '';
    
    // Build edge function URL for proper OG preview with blog featured image
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zqapbmllkywsuywpfava.supabase.co';
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/blog-share?slug=${encodeURIComponent(slug || '')}&target=${encodeURIComponent(url)}&image=${encodeURIComponent(imageUrl)}`;
    
    const shareUrl = getShareUrl(platform, url, title, description, imageUrl, edgeFunctionUrl);
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <AkboyLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full"></div>
        </div>
      </AkboyLayout>
    );
  }

  if (!post) {
    return (
      <AkboyLayout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">Post Not Found</h1>
            <p className="text-gray-600">This blog post doesn't exist or has been removed.</p>
            <Link to="/blog">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>
      </AkboyLayout>
    );
  }

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const ogImage = post.featured_image_url
    || resolveInstitutionLogo({ school: post.school, title: post.title, tags: post.tags, institution_type: post.institution_type }, 512).src
    || '';
  const ogDescription = post.excerpt || post.content?.substring(0, 160).replace(/<[^>]*>/g, '') || 'Read this article on AKBOY Blog';
  const postTags = parseTags(post.tags);

  return (
    <AkboyLayout>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{post.title} | AKBOY Blog</title>
        <meta name="title" content={post.title} />
        <meta name="description" content={ogDescription} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="AKBOY Creative Hub" />
        {post.author && <meta property="article:author" content={post.author} />}
        {post.published_at && <meta property="article:published_time" content={post.published_at} />}
        {post.category && <meta property="article:section" content={post.category} />}
        {postTags.map((tag: string) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={currentUrl} />
        <meta property="twitter:title" content={post.title} />
        <meta property="twitter:description" content={ogDescription} />
        <meta property="twitter:image" content={ogImage} />
      </Helmet>

      {/* Editorial header */}
      <header className="border-b border-akboy-line bg-akboy-paper">
        <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-akboy-forest hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Campus Hub
          </Link>

          <div className="flex items-start gap-4">
            <InstitutionLogo
              school={post.school}
              title={post.title}
              tags={post.tags}
              institution_type={post.institution_type}
              size={64}
              rounded="rounded-none"
              className="shrink-0"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.18em] text-akboy-muted">
                {post.category && <span className="font-semibold text-akboy-forest">{post.category}</span>}
                {post.school && <><span aria-hidden>·</span><span>{post.school}</span></>}
              </div>
              <h1 className="mt-2 font-display text-3xl leading-tight text-akboy-forest md:text-5xl">
                {post.title}
              </h1>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-akboy-muted">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date(post.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            {post.read_time && (
              <span className="flex items-center gap-2"><Clock className="h-4 w-4" />{post.read_time} min read</span>
            )}
            {post.author && <span>By {post.author}</span>}
          </div>

          {post.featured_image_url && (
            <div className="mt-8 aspect-[16/9] w-full overflow-hidden border border-akboy-line bg-akboy-bone">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="h-full w-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          )}
        </div>
      </header>


      {/* Content Section */}
      <article className="bg-akboy-paper px-5 py-14 sm:px-8 md:py-20">
        <div className="mx-auto max-w-[68ch]">
          {postTags.length > 0 && (
            <div className="mb-9 flex flex-wrap gap-2">
              {postTags.map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 border border-akboy-line bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-akboy-forest"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div
            className="akboy-article blog-post-content"
            dangerouslySetInnerHTML={{ __html: formatBlogContent(post.content) }}
          />

          {/* Share */}
          <div className="mt-16 border-t border-akboy-forest/25 pt-8">
            <h3 className="font-editorial text-xl text-akboy-forest">Share this story</h3>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { key: "whatsapp", label: "WhatsApp" },
                { key: "facebook", label: "Facebook" },
                { key: "twitter", label: "X" },
                { key: "linkedin", label: "LinkedIn" },
                { key: "telegram", label: "Telegram" },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => handleShare(s.key)}
                  className="border border-akboy-line bg-white px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-akboy-forest transition-colors hover:border-akboy-forest hover:bg-akboy-bone"
                >
                  {s.label}
                </button>
              ))}
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 border border-akboy-forest bg-akboy-forest px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-akboy-moss"
              >
                <Copy className="h-3.5 w-3.5" /> Copy link
              </button>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mx-auto mt-20 max-w-[1240px]">
            <div className="mb-8 flex items-end justify-between border-b border-akboy-forest/25 pb-3">
              <h3 className="font-editorial text-2xl text-akboy-forest md:text-[2rem]">Keep reading</h3>
              <Link to="/" className="text-[10px] font-semibold uppercase tracking-[0.24em] text-akboy-forest hover:underline">
                All stories
              </Link>
            </div>
            <div className="grid gap-10 md:grid-cols-3">
              {related.map((r) => (
                <Link key={r.id} to={`/blog/${r.slug || r.id}`} className="group block">
                  <PostImage
                    src={r.featured_image_url}
                    alt={r.title}
                    school={r.school}
                    title={r.title}
                    tags={r.tags}
                    institution_type={r.institution_type}
                    aspect="aspect-[4/5]"
                  />
                  <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-akboy-muted">
                    {r.category || "News"}
                  </p>
                  <h4 className="mt-2 font-editorial text-xl leading-snug text-akboy-forest transition-colors group-hover:text-akboy-moss">
                    {r.title}
                  </h4>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

    </AkboyLayout>
  );
}

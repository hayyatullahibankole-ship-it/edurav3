import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AkboyLayout } from "@/components/akboy/AkboyLayout";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  GraduationCap,
  Users,
  Briefcase,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDomainDetection } from "@/hooks/useDomainDetection";
import { productStatusLabel } from "./AkboyProducts";

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  tagline: string | null;
  short_description: string | null;
  full_description: string | null;
  status: string;
  problem: string | null;
  solution: string | null;
  audience: string | null;
  how_it_works: any;
  faqs: any;
  video_url: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  cta_text: string | null;
  cta_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_image_url: string | null;
}

interface Feature {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
}

interface Media {
  id: string;
  url: string;
  caption: string | null;
  media_type: string;
}

const asList = (value: any): { title?: string; description?: string; question?: string; answer?: string }[] =>
  Array.isArray(value) ? value : [];

export default function AkboyProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAkboy } = useDomainDetection();
  const basePath = isAkboy ? "" : "/akboy";

  const [product, setProduct] = useState<Product | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("akboy_products")
        .select("*")
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();

      if (cancelled) return;
      const prod = (data as Product) || null;
      setProduct(prod);

      if (prod) {
        const [f, m, posts] = await Promise.all([
          supabase
            .from("akboy_product_features")
            .select("id,title,description,icon")
            .eq("product_id", prod.id)
            .order("display_order", { ascending: true }),
          supabase
            .from("akboy_product_media")
            .select("id,url,caption,media_type")
            .eq("product_id", prod.id)
            .order("display_order", { ascending: true }),
          supabase
            .from("blog_posts")
            .select("id,title,slug,excerpt,category")
            .eq("is_published", true)
            .ilike("title", `%${prod.name}%`)
            .limit(3),
        ]);
        if (cancelled) return;
        setFeatures((f.data as Feature[]) || []);
        setMedia((m.data as Media[]) || []);
        setRelated(posts.data || []);
      }
      setLoading(false);
    };
    if (slug) load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <AkboyLayout title="Product" path={`/products/${slug}`}>
        <div className="mx-auto max-w-7xl px-4 py-32 text-center text-akboy-muted">Loading product…</div>
      </AkboyLayout>
    );
  }

  if (!product) {
    return (
      <AkboyLayout title="Product not found" path={`/products/${slug}`}>
        <div className="mx-auto max-w-xl px-4 py-32 text-center">
          <h1 className="font-display text-2xl font-bold text-akboy-forest">This product is not available</h1>
          <p className="mt-3 text-sm text-akboy-muted">It may have been unpublished or the link is incorrect.</p>
          <Button asChild className="mt-6 bg-akboy-forest text-white hover:bg-akboy-moss">
            <Link to={`${basePath}/products`}>Back to products</Link>
          </Button>
        </div>
      </AkboyLayout>
    );
  }

  const steps = asList(product.how_it_works);
  const faqs = asList(product.faqs);

  return (
    <AkboyLayout
      title={product.seo_title || product.name}
      description={product.seo_description || product.short_description || undefined}
      path={`/products/${product.slug}`}
    >
      {/* HERO */}
      <section className="bg-akboy-forest">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <Link
            to={`${basePath}/products`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-akboy-butter"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All products
          </Link>

          <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-4">
                {product.logo_url && (
                  <img
                    src={product.logo_url}
                    alt={`${product.name} logo`}
                    className="h-12 w-12 rounded-xl bg-white object-contain p-1.5"
                  />
                )}
                <span className="rounded-full border border-akboy-butter/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-akboy-butter">
                  {productStatusLabel(product.status)}
                </span>
              </div>

              <h1 className="mt-6 font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl">
                {product.name}
              </h1>
              {product.tagline && <p className="mt-4 text-lg text-akboy-butter">{product.tagline}</p>}
              {product.short_description && (
                <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75">{product.short_description}</p>
              )}

              {product.cta_url && (
                <Button
                  asChild
                  size="lg"
                  className="mt-9 h-12 rounded-xl bg-akboy-butter px-7 text-sm font-semibold text-akboy-forest hover:bg-akboy-butter/90"
                >
                  <a
                    href={product.cta_url}
                    target={product.cta_url.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                  >
                    {product.cta_text || "Learn more"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>

            {product.cover_image_url && (
              <div className="lg:col-span-5">
                <img
                  src={product.cover_image_url}
                  alt={`${product.name} interface`}
                  loading="lazy"
                  className="w-full rounded-2xl border border-white/10 object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PROBLEM / SOLUTION / AUDIENCE */}
      {(product.problem || product.solution || product.audience) && (
        <section className="bg-akboy-paper py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-px overflow-hidden rounded-2xl border border-akboy-line bg-akboy-line md:grid-cols-3">
              {[
                { label: "The Problem", body: product.problem },
                { label: "The Solution", body: product.solution },
                { label: "Who It Is For", body: product.audience },
              ]
                .filter((b) => b.body)
                .map((b) => (
                  <div key={b.label} className="bg-white p-7 md:p-9">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-akboy-moss">{b.label}</p>
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-akboy-muted">{b.body}</p>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* SCHOOL OS STAKEHOLDERS */}
      {product.slug === "school-os" && (
        <section className="bg-white py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-bold tracking-tight text-akboy-forest md:text-4xl">
              A Connected Digital Environment for Schools
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-akboy-muted">
              School OS connects school management, staff, parents and students in one digital environment.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Building2,
                  title: "School Management",
                  body: "A centralized view of school operations and relevant information.",
                },
                {
                  icon: Briefcase,
                  title: "Staff",
                  body: "The tools and information staff need to carry out their responsibilities.",
                },
                {
                  icon: Users,
                  title: "Parents",
                  body: "A dedicated view of their child's school and academic progress.",
                },
                {
                  icon: GraduationCap,
                  title: "Students",
                  body: "Access to the information and school activities relevant to them.",
                },
              ].map((s) => (
                <div key={s.title} className="rounded-2xl border border-akboy-line bg-akboy-paper p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-akboy-forest">
                    <s.icon className="h-5 w-5 text-akboy-butter" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold text-akboy-forest">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-akboy-muted">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FULL DESCRIPTION */}
      {product.full_description && (
        <section className="bg-akboy-bone py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <p className="whitespace-pre-line text-base leading-relaxed text-akboy-muted">
              {product.full_description}
            </p>
          </div>
        </section>
      )}

      {/* FEATURES */}
      {features.length > 0 && (
        <section className="bg-white py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-bold tracking-tight text-akboy-forest md:text-4xl">Features</h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.id} className="rounded-2xl border border-akboy-line bg-akboy-paper p-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-akboy-forest">
                    <Check className="h-4 w-4 text-akboy-butter" />
                  </span>
                  <h3 className="mt-5 font-display text-base font-semibold text-akboy-forest">{f.title}</h3>
                  {f.description && <p className="mt-2 text-sm leading-relaxed text-akboy-muted">{f.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      {steps.length > 0 && (
        <section className="bg-akboy-paper py-20 md:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-bold tracking-tight text-akboy-forest md:text-4xl">
              How It Works
            </h2>
            <div className="mt-8 divide-y divide-akboy-line border-y border-akboy-line">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-6 py-7">
                  <span className="font-display text-sm font-bold text-akboy-moss">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-akboy-forest">{s.title}</h3>
                    {s.description && (
                      <p className="mt-2 text-sm leading-relaxed text-akboy-muted">{s.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SCREENSHOTS */}
      {media.length > 0 && (
        <section className="bg-white py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-bold tracking-tight text-akboy-forest md:text-4xl">
              Screenshots
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {media.map((m) => (
                <figure key={m.id} className="overflow-hidden rounded-2xl border border-akboy-line bg-akboy-paper">
                  <img
                    src={m.url}
                    alt={m.caption || `${product.name} screenshot`}
                    loading="lazy"
                    className="h-56 w-full object-cover"
                  />
                  {m.caption && (
                    <figcaption className="px-4 py-3 text-xs text-akboy-muted">{m.caption}</figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* VIDEO */}
      {product.video_url && (
        <section className="bg-akboy-bone py-20 md:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="aspect-video overflow-hidden rounded-2xl border border-akboy-line bg-black">
              <iframe
                src={product.video_url}
                title={`${product.name} demo video`}
                className="h-full w-full"
                loading="lazy"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="bg-white py-20 md:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-bold tracking-tight text-akboy-forest md:text-4xl">
              Frequently asked
            </h2>
            <div className="mt-8 divide-y divide-akboy-line border-y border-akboy-line">
              {faqs.map((f, i) => (
                <div key={i} className="py-6">
                  <h3 className="font-display text-base font-semibold text-akboy-forest">{f.question || f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-akboy-muted">{f.answer || f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RELATED CAMPUS HUB */}
      {related.length > 0 && (
        <section className="bg-akboy-paper py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold text-akboy-forest md:text-3xl">Related from Campus Hub</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((post) => (
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
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-akboy-forest py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
            Interested in {product.name}?
          </h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {product.cta_url && (
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-akboy-butter px-7 text-sm font-semibold text-akboy-forest hover:bg-akboy-butter/90"
              >
                <a
                  href={product.cta_url}
                  target={product.cta_url.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                >
                  {product.cta_text || "Visit product"}
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-xl border-white/25 bg-transparent px-7 text-sm font-semibold text-white hover:bg-white/10 hover:text-white"
            >
              <Link to={`${basePath}/contact`}>Talk to our team</Link>
            </Button>
          </div>
        </div>
      </section>
    </AkboyLayout>
  );
}

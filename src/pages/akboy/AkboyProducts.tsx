import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AkboyLayout } from "@/components/akboy/AkboyLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowUpRight, Building2, GraduationCap, Users, Briefcase, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDomainDetection } from "@/hooks/useDomainDetection";

export interface AkboyProductRow {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  tagline: string | null;
  short_description: string | null;
  status: string;
  logo_url: string | null;
  cover_image_url: string | null;
  cta_text: string | null;
  is_featured: boolean;
}

export const productStatusLabel = (status: string) => {
  switch (status) {
    case "live":
      return "Live";
    case "coming_soon":
      return "Coming Soon";
    case "in_development":
    default:
      return "In Development";
  }
};

export default function AkboyProducts() {
  const { isAkboy } = useDomainDetection();
  const basePath = isAkboy ? "" : "/akboy";
  const [products, setProducts] = useState<AkboyProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("akboy_products")
        .select("id,name,slug,category,tagline,short_description,status,logo_url,cover_image_url,cta_text,is_featured")
        .eq("is_published", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });
      setProducts((data as AkboyProductRow[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <AkboyLayout
      title="Products"
      description="AKBOY builds education technology products — from student assessment with Edura to connected school operations with School OS."
      path="/products"
    >
      {/* HERO */}
      <section className="bg-akboy-forest">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-akboy-butter">Our products</p>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl">
            Education Technology Built to Solve Real Problems
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
            We build digital products designed to address real challenges across the education ecosystem.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-9 h-12 rounded-xl bg-akboy-butter px-7 text-sm font-semibold text-akboy-forest hover:bg-akboy-butter/90"
          >
            <a href="#product-list">
              Explore Our Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      {/* PRODUCT LIST */}
      <section id="product-list" className="bg-akboy-paper py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <p className="text-center text-akboy-muted">Loading products…</p>
          ) : products.length === 0 ? (
            <div className="mx-auto max-w-xl rounded-2xl border border-akboy-line bg-white p-10 text-center">
              <h2 className="font-display text-xl font-semibold text-akboy-forest">Products coming shortly</h2>
              <p className="mt-3 text-sm text-akboy-muted">
                Our product pages are being prepared. In the meantime, talk to us about what you need.
              </p>
              <Button asChild className="mt-6 bg-akboy-forest text-white hover:bg-akboy-moss">
                <Link to={`${basePath}/contact`}>Talk to us</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {products.map((p) => (
                <article
                  key={p.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-akboy-line bg-white"
                >
                  {p.cover_image_url && (
                    <img
                      src={p.cover_image_url}
                      alt={`${p.name} product preview`}
                      loading="lazy"
                      className="h-48 w-full object-cover sm:h-56"
                    />
                  )}
                  <div className="flex flex-1 flex-col p-7 md:p-8">
                    <div className="flex items-center gap-3">
                      {p.logo_url ? (
                        <img
                          src={p.logo_url}
                          alt={`${p.name} logo`}
                          loading="lazy"
                          className="h-10 w-10 rounded-lg object-contain"
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-akboy-forest">
                          <Briefcase className="h-5 w-5 text-akboy-butter" />
                        </span>
                      )}
                      <span className="rounded-full border border-akboy-line px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-akboy-moss">
                        {productStatusLabel(p.status)}
                      </span>
                    </div>

                    <h2 className="mt-6 font-display text-2xl font-bold text-akboy-forest">{p.name}</h2>
                    {p.tagline && <p className="mt-2 text-sm font-semibold text-akboy-moss">{p.tagline}</p>}
                    {p.short_description && (
                      <p className="mt-4 flex-1 text-sm leading-relaxed text-akboy-muted">{p.short_description}</p>
                    )}

                    {p.slug === "school-os" && (
                      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {[
                          { icon: Building2, label: "Management" },
                          { icon: Briefcase, label: "Staff" },
                          { icon: Users, label: "Parents" },
                          { icon: GraduationCap, label: "Students" },
                        ].map((s) => (
                          <div
                            key={s.label}
                            className="rounded-xl border border-akboy-line bg-akboy-bone px-3 py-3 text-center"
                          >
                            <s.icon className="mx-auto h-4 w-4 text-akboy-forest" />
                            <span className="mt-2 block text-[11px] font-semibold text-akboy-forest">{s.label}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <Link
                      to={`${basePath}/products/${p.slug}`}
                      className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-akboy-forest hover:text-akboy-moss"
                    >
                      {p.cta_text || `Explore ${p.name}`}
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* WHAT WE'RE BUILDING NEXT */}
      <section className="bg-white py-20 md:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-akboy-bone">
            <Lightbulb className="h-5 w-5 text-akboy-forest" />
          </span>
          <h2 className="mt-6 font-display text-3xl font-bold tracking-tight text-akboy-forest">
            What We're Building Next
          </h2>
          <p className="mt-4 text-base leading-relaxed text-akboy-muted">
            We continuously research challenges in education and develop technology around the problems that matter
            most.
          </p>
          <Button asChild className="mt-8 h-11 rounded-xl bg-akboy-forest px-6 text-white hover:bg-akboy-moss">
            <Link to={`${basePath}/contact`}>Tell us what you need</Link>
          </Button>
        </div>
      </section>
    </AkboyLayout>
  );
}

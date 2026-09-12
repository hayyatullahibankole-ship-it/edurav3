import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AkboyLayout } from "@/components/akboy/AkboyLayout";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDomainDetection } from "@/hooks/useDomainDetection";

interface PartnerSchool {
  id: string;
  name: string;
  logo_url: string | null;
  location: string | null;
  website_url: string | null;
  partnership_type: string;
  description: string | null;
}

export const PARTNERSHIP_TYPES: { key: string; label: string; blurb: string }[] = [
  { key: "technology", label: "Technology Partners", blurb: "Schools using AKBOY technology." },
  { key: "programme", label: "Programme Partners", blurb: "Schools participating in specific programmes." },
  {
    key: "strategic",
    label: "Strategic / Institutional Partners",
    blurb: "Other formal collaborations with AKBOY.",
  },
];

export default function AkboyPartners() {
  const { isAkboy } = useDomainDetection();
  const basePath = isAkboy ? "" : "/akboy";
  const [schools, setSchools] = useState<PartnerSchool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("akboy_partner_schools")
        .select("id,name,logo_url,location,website_url,partnership_type,description")
        .eq("is_published", true)
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });
      setSchools((data as PartnerSchool[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <AkboyLayout
      title="Partner Schools"
      description="Schools collaborating with AKBOY through technology, educational programmes and student development initiatives."
      path="/community/partners"
    >
      <section className="bg-akboy-forest">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-24 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-akboy-butter">Community</p>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl">
            Schools We Work With
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/75">
            We collaborate with schools through technology, educational programmes and student development
            initiatives.
          </p>
        </div>
      </section>

      <section className="bg-akboy-paper py-16 md:py-20">
        <div className="mx-auto max-w-7xl space-y-14 px-4 sm:px-6 lg:px-8">
          {loading && <p className="text-sm text-akboy-muted">Loading partner schools…</p>}

          {!loading && schools.length === 0 && (
            <div className="mx-auto max-w-xl rounded-2xl border border-akboy-line bg-white p-10 text-center">
              <p className="text-sm text-akboy-muted">
                Our partner schools will be listed here as each collaboration is confirmed.
              </p>
              <Button asChild className="mt-6 bg-akboy-forest text-white hover:bg-akboy-moss">
                <Link to={`${basePath}/contact`}>Become a partner</Link>
              </Button>
            </div>
          )}

          {!loading &&
            PARTNERSHIP_TYPES.map((cat) => {
              const list = schools.filter((s) => s.partnership_type === cat.key);
              if (list.length === 0) return null;
              return (
                <div key={cat.key}>
                  <h2 className="font-display text-2xl font-bold text-akboy-forest md:text-3xl">{cat.label}</h2>
                  <p className="mt-2 text-sm text-akboy-muted">{cat.blurb}</p>
                  <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((s) => (
                      <article key={s.id} className="rounded-2xl border border-akboy-line bg-white p-6">
                        <div className="flex h-16 items-center">
                          {s.logo_url ? (
                            <img
                              src={s.logo_url}
                              alt={`${s.name} logo`}
                              loading="lazy"
                              className="max-h-14 max-w-[160px] object-contain"
                            />
                          ) : (
                            <span className="font-display text-lg font-semibold text-akboy-forest">{s.name}</span>
                          )}
                        </div>
                        <h3 className="mt-4 font-display text-lg font-semibold text-akboy-forest">{s.name}</h3>
                        {s.location && (
                          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-akboy-muted">
                            <MapPin className="h-3.5 w-3.5" /> {s.location}
                          </p>
                        )}
                        {s.description && (
                          <p className="mt-3 text-sm leading-relaxed text-akboy-muted">{s.description}</p>
                        )}
                        {s.website_url && (
                          <a
                            href={s.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-akboy-moss hover:text-akboy-forest"
                          >
                            Visit website <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      <section className="bg-akboy-forest py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
            Partner with AKBOY
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/70">
            Bring AKBOY technology, programmes and student development initiatives to your school.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 h-12 rounded-xl bg-akboy-butter px-7 text-sm font-semibold text-akboy-forest hover:bg-akboy-butter/90"
          >
            <Link to={`${basePath}/contact`}>Become a Partner</Link>
          </Button>
        </div>
      </section>
    </AkboyLayout>
  );
}

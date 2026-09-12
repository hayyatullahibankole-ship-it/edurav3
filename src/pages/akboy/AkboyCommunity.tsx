import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AkboyLayout } from "@/components/akboy/AkboyLayout";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Calendar, HeartHandshake, School, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDomainDetection } from "@/hooks/useDomainDetection";
import { format } from "date-fns";

export default function AkboyCommunity() {
  const { isAkboy } = useDomainDetection();
  const basePath = isAkboy ? "" : "/akboy";

  const [ambassadors, setAmbassadors] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [initiatives, setInitiatives] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [amb, sch, evs] = await Promise.all([
        supabase
          .from("akboy_ambassadors")
          .select("id,full_name,photo_url,school,role_title,cohort")
          .eq("is_published", true)
          .eq("is_active", true)
          .order("display_order", { ascending: true })
          .limit(4),
        supabase
          .from("akboy_partner_schools")
          .select("id,name,logo_url,partnership_type,location")
          .eq("is_published", true)
          .eq("is_active", true)
          .order("display_order", { ascending: true })
          .limit(6),
        supabase
          .from("akboy_events")
          .select("id,title,slug,description,event_date,image_url,status,location")
          .eq("is_published", true)
          .order("event_date", { ascending: false })
          .limit(3),
      ]);
      setAmbassadors(amb.data || []);
      setSchools(sch.data || []);
      setInitiatives(evs.data || []);
    };
    load();
  }, []);

  return (
    <AkboyLayout
      title="Community"
      description="A growing network of students, schools and young people connected through education, opportunity and technology."
      path="/community"
    >
      <section className="bg-akboy-forest">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-akboy-butter">Community</p>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl">
            The AKBOY Community
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
            A growing network of students, schools and young people connected through education, opportunity and
            technology.
          </p>
        </div>
      </section>

      <section className="bg-akboy-paper py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              {
                icon: Users,
                title: "Student Ambassadors",
                body: "Students and young leaders representing AKBOY within their schools and communities.",
                cta: "Meet Our Ambassadors",
                href: `${basePath}/community/ambassadors`,
              },
              {
                icon: School,
                title: "Partner Schools",
                body: "Schools collaborating with AKBOY through technology, programmes and educational initiatives.",
                cta: "View Partner Schools",
                href: `${basePath}/community/partners`,
              },
              {
                icon: HeartHandshake,
                title: "Community Initiatives",
                body: "Programmes and outreach activities we run with students and schools across the country.",
                cta: "Explore Our Initiatives",
                href: `${basePath}/events`,
              },
            ].map((c) => (
              <Link
                key={c.title}
                to={c.href}
                className="group flex flex-col rounded-2xl border border-akboy-line bg-white p-7 transition-colors hover:border-akboy-forest/30 md:p-8"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-akboy-forest">
                  <c.icon className="h-5 w-5 text-akboy-butter" />
                </span>
                <h2 className="mt-6 font-display text-xl font-semibold text-akboy-forest">{c.title}</h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-akboy-muted">{c.body}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-akboy-forest">
                  {c.cta}
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {ambassadors.length > 0 && (
        <section className="bg-white py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-6">
              <h2 className="font-display text-2xl font-bold text-akboy-forest md:text-3xl">Our ambassadors</h2>
              <Link
                to={`${basePath}/community/ambassadors`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-akboy-moss hover:text-akboy-forest"
              >
                See all <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {ambassadors.map((a) => (
                <div key={a.id} className="rounded-2xl border border-akboy-line bg-akboy-paper p-5 text-center">
                  {a.photo_url ? (
                    <img
                      src={a.photo_url}
                      alt={a.full_name}
                      loading="lazy"
                      className="mx-auto h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-akboy-forest font-display text-xl font-bold text-akboy-butter">
                      {a.full_name?.charAt(0)}
                    </span>
                  )}
                  <h3 className="mt-4 font-display text-base font-semibold text-akboy-forest">{a.full_name}</h3>
                  <p className="mt-1 text-xs text-akboy-muted">{a.role_title}</p>
                  {a.school && <p className="text-xs text-akboy-muted">{a.school}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {schools.length > 0 && (
        <section className="bg-akboy-bone py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-6">
              <h2 className="font-display text-2xl font-bold text-akboy-forest md:text-3xl">Schools we work with</h2>
              <Link
                to={`${basePath}/community/partners`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-akboy-moss hover:text-akboy-forest"
              >
                View partners <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {schools.map((s) => (
                <div
                  key={s.id}
                  className="flex h-24 items-center justify-center rounded-2xl border border-akboy-line bg-white p-4"
                >
                  {s.logo_url ? (
                    <img
                      src={s.logo_url}
                      alt={`${s.name} logo`}
                      loading="lazy"
                      className="max-h-12 max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-center text-xs font-semibold text-akboy-forest">{s.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {initiatives.length > 0 && (
        <section className="bg-white py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold text-akboy-forest md:text-3xl">Community initiatives</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {initiatives.map((e) => (
                <Link
                  key={e.id}
                  to={`${basePath}/learn/events/${e.slug || e.id}`}
                  className="overflow-hidden rounded-2xl border border-akboy-line bg-akboy-paper transition-colors hover:border-akboy-forest/30"
                >
                  {e.image_url && (
                    <img src={e.image_url} alt={e.title} loading="lazy" className="h-40 w-full object-cover" />
                  )}
                  <div className="p-5">
                    <p className="inline-flex items-center gap-1.5 text-xs text-akboy-muted">
                      <Calendar className="h-3.5 w-3.5" />
                      {e.event_date ? format(new Date(e.event_date), "d MMM yyyy") : "Date to be announced"}
                    </p>
                    <h3 className="mt-2 font-display text-base font-semibold text-akboy-forest">{e.title}</h3>
                    {e.description && <p className="mt-2 line-clamp-2 text-sm text-akboy-muted">{e.description}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-akboy-forest py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
            Want your school or students involved?
          </h2>
          <Button
            asChild
            size="lg"
            className="mt-8 h-12 rounded-xl bg-akboy-butter px-7 text-sm font-semibold text-akboy-forest hover:bg-akboy-butter/90"
          >
            <Link to={`${basePath}/contact`}>Get in touch</Link>
          </Button>
        </div>
      </section>
    </AkboyLayout>
  );
}

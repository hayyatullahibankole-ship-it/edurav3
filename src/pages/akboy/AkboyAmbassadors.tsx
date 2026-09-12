import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AkboyLayout } from "@/components/akboy/AkboyLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useDomainDetection } from "@/hooks/useDomainDetection";

interface Ambassador {
  id: string;
  full_name: string;
  photo_url: string | null;
  school: string | null;
  role_title: string | null;
  cohort: string | null;
  bio: string | null;
  social_links: any;
}

export default function AkboyAmbassadors() {
  const { isAkboy } = useDomainDetection();
  const basePath = isAkboy ? "" : "/akboy";
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("akboy_ambassadors")
        .select("id,full_name,photo_url,school,role_title,cohort,bio,social_links")
        .eq("is_published", true)
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("full_name", { ascending: true });
      setAmbassadors((data as Ambassador[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <AkboyLayout
      title="Student Ambassadors"
      description="Meet the AKBOY Student Ambassadors — students and young leaders promoting academic excellence, career awareness and digital opportunities."
      path="/community/ambassadors"
    >
      <section className="bg-akboy-forest">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-24 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-akboy-butter">Community</p>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl">
            Meet the AKBOY Student Ambassadors
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/75">
            Students and young leaders helping promote academic excellence, career awareness and digital
            opportunities.
          </p>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-akboy-forest md:text-3xl">
            About the Ambassador Programme
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {[
              {
                t: "Purpose",
                b: "The programme connects AKBOY directly with students, so academic resources, exam preparation and digital opportunities reach the people who need them.",
              },
              {
                t: "Who ambassadors are",
                b: "Secondary school and tertiary students who are active in their school community and committed to helping their peers learn and grow.",
              },
              {
                t: "What they represent",
                b: "Academic excellence, career clarity and responsible use of technology within their schools and communities.",
              },
              {
                t: "Responsibilities",
                b: "Sharing verified academic information, supporting AKBOY programmes and events, and giving feedback on what students actually need.",
              },
              {
                t: "Participation",
                b: "Ambassadors take part for a defined cohort period and are expected to stay active, respectful and accurate in how they represent AKBOY.",
              },
              {
                t: "Cohorts",
                b: "Ambassadors are grouped by cohort year, so each intake is recognised for the period it serves.",
              },
            ].map((i) => (
              <div key={i.t} className="rounded-2xl border border-akboy-line bg-akboy-paper p-6">
                <h3 className="font-display text-base font-semibold text-akboy-forest">{i.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-akboy-muted">{i.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-akboy-paper py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-akboy-forest md:text-3xl">Our ambassadors</h2>

          {loading ? (
            <p className="mt-8 text-sm text-akboy-muted">Loading ambassadors…</p>
          ) : ambassadors.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-akboy-line bg-white p-10 text-center">
              <p className="text-sm text-akboy-muted">
                Our ambassadors will be announced here shortly. Interested in representing AKBOY in your school?
              </p>
              <Button asChild className="mt-6 bg-akboy-forest text-white hover:bg-akboy-moss">
                <Link to={`${basePath}/contact`}>Apply to join</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {ambassadors.map((a) => (
                <article key={a.id} className="rounded-2xl border border-akboy-line bg-white p-6 text-center">
                  {a.photo_url ? (
                    <img
                      src={a.photo_url}
                      alt={`${a.full_name}, ${a.role_title || "Student Ambassador"}`}
                      loading="lazy"
                      className="mx-auto h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-akboy-forest font-display text-2xl font-bold text-akboy-butter">
                      {a.full_name.charAt(0)}
                    </span>
                  )}
                  <h3 className="mt-5 font-display text-lg font-semibold text-akboy-forest">{a.full_name}</h3>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-akboy-moss">
                    {a.role_title || "Student Ambassador"}
                  </p>
                  {a.school && <p className="mt-2 text-sm text-akboy-muted">{a.school}</p>}
                  {a.cohort && <p className="text-sm text-akboy-muted">{a.cohort}</p>}
                  {a.bio && <p className="mt-3 text-sm leading-relaxed text-akboy-muted">{a.bio}</p>}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </AkboyLayout>
  );
}

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AkboyLayout } from "@/components/akboy/AkboyLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, MapPin, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDomainDetection } from "@/hooks/useDomainDetection";
import { format } from "date-fns";
import { EventRegistrationDialog } from "@/components/akboy/EventRegistrationDialog";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  upcoming: "Upcoming",
  ongoing: "Happening now",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function AkboyEventDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAkboy } = useDomainDetection();
  const basePath = isAkboy ? "" : "/akboy";

  const [event, setEvent] = useState<any | null>(null);
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [ambassadors, setAmbassadors] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registerOpen, setRegisterOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug || "");
      const query = supabase.from("akboy_events").select("*").eq("is_published", true);
      const { data } = isUuid
        ? await query.eq("id", slug!).maybeSingle()
        : await query.eq("slug", slug!).maybeSingle();

      if (cancelled) return;
      setEvent(data || null);

      if (data) {
        const [sp, sc, am, md] = await Promise.all([
          supabase
            .from("akboy_event_speakers")
            .select("*")
            .eq("event_id", data.id)
            .order("display_order", { ascending: true }),
          supabase
            .from("akboy_event_schools")
            .select("id, school:akboy_partner_schools(id,name,logo_url,location)")
            .eq("event_id", data.id),
          supabase
            .from("akboy_event_ambassadors")
            .select("id, ambassador:akboy_ambassadors(id,full_name,photo_url,school,role_title,cohort)")
            .eq("event_id", data.id),
          supabase
            .from("akboy_event_media")
            .select("*")
            .eq("event_id", data.id)
            .order("display_order", { ascending: true }),
        ]);
        if (cancelled) return;
        setSpeakers(sp.data || []);
        setSchools((sc.data || []).map((r: any) => r.school).filter(Boolean));
        setAmbassadors((am.data || []).map((r: any) => r.ambassador).filter(Boolean));
        setGallery(md.data || []);
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
      <AkboyLayout title="Event" path={`/learn/events/${slug}`}>
        <div className="mx-auto max-w-7xl px-4 py-32 text-center text-akboy-muted">Loading event…</div>
      </AkboyLayout>
    );
  }

  if (!event) {
    return (
      <AkboyLayout title="Event not found" path={`/learn/events/${slug}`}>
        <div className="mx-auto max-w-xl px-4 py-32 text-center">
          <h1 className="font-display text-2xl font-bold text-akboy-forest">This event is not available</h1>
          <Button asChild className="mt-6 bg-akboy-forest text-white hover:bg-akboy-moss">
            <Link to={`${basePath}/events`}>See all events</Link>
          </Button>
        </div>
      </AkboyLayout>
    );
  }

  const highlights: any[] = Array.isArray(event.highlights) ? event.highlights : [];
  const schedule: any[] = Array.isArray(event.schedule) ? event.schedule : [];
  const isCompleted = event.status === "completed";
  const seatsLeft =
    event.max_participants && event.max_participants > 0
      ? Math.max(0, event.max_participants - (event.current_participants || 0))
      : null;

  return (
    <AkboyLayout title={event.title} description={event.description || undefined} path={`/learn/events/${event.slug || event.id}`}>
      {/* HERO */}
      <section className="relative bg-akboy-forest">
        {event.image_url && (
          <img src={event.image_url} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-20" />
        )}
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <Link
            to={`${basePath}/events`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-akboy-butter"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All events
          </Link>

          <span className="mt-8 inline-block rounded-full border border-akboy-butter/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-akboy-butter">
            {STATUS_LABEL[event.status] || "Event"}
          </span>

          <h1 className="mt-5 max-w-4xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl">
            {event.title}
          </h1>
          {event.theme && <p className="mt-4 max-w-3xl text-lg text-akboy-butter">{event.theme}</p>}

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/80">
            {event.event_date && (
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 text-akboy-butter" />
                {format(new Date(event.event_date), "EEEE, d MMMM yyyy")}
              </span>
            )}
            {(event.start_time || event.end_time) && (
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-akboy-butter" />
                {[event.start_time, event.end_time].filter(Boolean).join(" – ")}
              </span>
            )}
            {(event.venue || event.location) && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-akboy-butter" />
                {[event.venue, event.location].filter(Boolean).join(", ")}
              </span>
            )}
            {typeof event.attendance_count === "number" && isCompleted && (
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4 text-akboy-butter" />
                {event.attendance_count.toLocaleString()} attended
              </span>
            )}
          </div>

          {!isCompleted && event.status !== "cancelled" && (
            <Button
              size="lg"
              onClick={() => setRegisterOpen(true)}
              disabled={seatsLeft === 0}
              className="mt-9 h-12 rounded-xl bg-akboy-butter px-7 text-sm font-semibold text-akboy-forest hover:bg-akboy-butter/90"
            >
              {seatsLeft === 0 ? "Fully booked" : "Register for this programme"}
            </Button>
          )}
        </div>
      </section>

      {/* ABOUT */}
      <section className="bg-akboy-paper py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-akboy-line bg-akboy-line md:grid-cols-3">
            {[
              { label: "About the Programme", body: event.description },
              { label: "Why We Are Doing This", body: event.why_we_do_this },
              { label: "Who It Is For", body: event.who_its_for },
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

      {/* HIGHLIGHTS */}
      {highlights.length > 0 && (
        <section className="bg-white py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold text-akboy-forest md:text-3xl">Programme highlights</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {highlights.map((h: any, i: number) => (
                <div key={i} className="rounded-2xl border border-akboy-line bg-akboy-paper p-6">
                  <h3 className="font-display text-base font-semibold text-akboy-forest">{h.title || h}</h3>
                  {h.description && <p className="mt-2 text-sm leading-relaxed text-akboy-muted">{h.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SPEAKERS */}
      {speakers.length > 0 && (
        <section className="bg-akboy-bone py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold text-akboy-forest md:text-3xl">Speakers</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {speakers.map((s) => (
                <article key={s.id} className="rounded-2xl border border-akboy-line bg-white p-6 text-center">
                  {s.photo_url ? (
                    <img
                      src={s.photo_url}
                      alt={`${s.full_name}, ${s.position_title || "speaker"}`}
                      loading="lazy"
                      className="mx-auto h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-akboy-forest font-display text-2xl font-bold text-akboy-butter">
                      {s.full_name?.charAt(0)}
                    </span>
                  )}
                  <h3 className="mt-5 font-display text-base font-semibold text-akboy-forest">{s.full_name}</h3>
                  {s.position_title && <p className="mt-1 text-xs text-akboy-muted">{s.position_title}</p>}
                  {s.organization && <p className="text-xs text-akboy-moss">{s.organization}</p>}
                  {s.bio && <p className="mt-3 text-sm leading-relaxed text-akboy-muted">{s.bio}</p>}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PARTICIPATING SCHOOLS */}
      {schools.length > 0 && (
        <section className="bg-white py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold text-akboy-forest md:text-3xl">Participating schools</h2>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {schools.map((s) => (
                <div
                  key={s.id}
                  className="flex h-24 items-center justify-center rounded-2xl border border-akboy-line bg-akboy-paper p-4"
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

      {/* AMBASSADORS */}
      {ambassadors.length > 0 && (
        <section className="bg-akboy-paper py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold text-akboy-forest md:text-3xl">Student ambassadors</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {ambassadors.map((a) => (
                <div key={a.id} className="rounded-2xl border border-akboy-line bg-white p-5 text-center">
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
                  {a.school && <p className="mt-1 text-xs text-akboy-muted">{a.school}</p>}
                  {a.cohort && <p className="text-xs text-akboy-moss">{a.cohort}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SCHEDULE */}
      {schedule.length > 0 && (
        <section className="bg-white py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold text-akboy-forest md:text-3xl">Schedule</h2>
            <div className="mt-8 divide-y divide-akboy-line border-y border-akboy-line">
              {schedule.map((s: any, i: number) => (
                <div key={i} className="flex gap-6 py-5">
                  <span className="w-24 flex-shrink-0 text-sm font-semibold text-akboy-moss">{s.time || ""}</span>
                  <div>
                    <h3 className="font-display text-base font-semibold text-akboy-forest">{s.title || s}</h3>
                    {s.description && <p className="mt-1 text-sm text-akboy-muted">{s.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GALLERY + OUTCOMES (after the event) */}
      {(gallery.length > 0 || event.outcomes) && (
        <section className="bg-akboy-bone py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold text-akboy-forest md:text-3xl">
              {isCompleted ? "Event highlights" : "Gallery"}
            </h2>
            {event.outcomes && (
              <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-akboy-muted">
                {event.outcomes}
              </p>
            )}
            {gallery.length > 0 && (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {gallery.map((m) => (
                  <figure key={m.id} className="overflow-hidden rounded-2xl border border-akboy-line bg-white">
                    {m.media_type === "video" ? (
                      <video src={m.url} controls className="h-56 w-full object-cover" />
                    ) : (
                      <img
                        src={m.url}
                        alt={m.caption || `${event.title} photo`}
                        loading="lazy"
                        className="h-56 w-full object-cover"
                      />
                    )}
                    {m.caption && <figcaption className="px-4 py-3 text-xs text-akboy-muted">{m.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* REGISTRATION CTA */}
      {!isCompleted && event.status !== "cancelled" && (
        <section className="bg-akboy-forest py-20 md:py-24">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">Registration</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-white/70">
              Secure your place. Registration is confirmed by email once your details are received.
            </p>
            <Button
              size="lg"
              onClick={() => setRegisterOpen(true)}
              disabled={seatsLeft === 0}
              className="mt-8 h-12 rounded-xl bg-akboy-butter px-7 text-sm font-semibold text-akboy-forest hover:bg-akboy-butter/90"
            >
              {seatsLeft === 0 ? "Fully booked" : "Register now"}
            </Button>
          </div>
        </section>
      )}

      <EventRegistrationDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        event={{
          id: event.id,
          title: event.title,
          date: event.event_date ? format(new Date(event.event_date), "d MMMM yyyy") : undefined,
          location: event.venue || event.location || undefined,
          form_fields: event.form_fields,
          seatsLeft,
        }}
      />
    </AkboyLayout>
  );
}

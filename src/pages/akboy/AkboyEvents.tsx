import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AkboyLayout } from "@/components/akboy/AkboyLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock, ArrowRight } from "lucide-react";
import { useDomainDetection } from "@/hooks/useDomainDetection";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import eventsHero from "@/assets/akboy-events-hero.jpg";

export default function AkboyEvents() {
  const { isAkboy } = useDomainDetection();
  const basePath = isAkboy ? "" : "/akboy";

  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registerEvent, setRegisterEvent] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("akboy_events")
        .select("*")
        .eq("is_active", true)
        .order("event_date", { ascending: true });

      const mapped = (data || []).map((e: any, i: number) => {
        const start = e.event_date ? new Date(e.event_date) : null;
        const end = e.end_date ? new Date(e.end_date) : null;
        const days = start && end ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000)) : null;
        return {
          id: e.id,
          title: e.title,
          type: e.event_type || "Event",
          description: e.description || "",
          date: start ? format(start, "MMMM d, yyyy") : "Date to be announced",
          duration: days ? `${days} day${days > 1 ? "s" : ""}` : "See details",
          location: e.location || "To be announced",
          participants: e.max_participants ? `${e.max_participants} seats` : "Open",
          price: e.price > 0 ? `₦${Number(e.price).toLocaleString()}` : "Free",
          registration_url: e.registration_url,
          form_fields: e.form_fields,
          seatsLeft:
            e.max_participants && e.max_participants > 0
              ? Math.max(0, e.max_participants - (e.current_participants || 0))
              : null,
          image_url: e.image_url,
          featured: i === 0,
        };
      });
      setUpcomingEvents(mapped);
      setLoading(false);
    };
    load();
  }, []);


  return (
    <AkboyLayout>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={eventsHero} alt="Events" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-emerald-900/95"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="max-w-3xl text-white space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-semibold">
              <Calendar className="w-4 h-4" />
              Upcoming Events
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
              Workshops &
              <span className="block bg-emerald-200">
                Training Programs
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-emerald-50 leading-relaxed">
              Enhance your skills and connect with creative professionals
            </p>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Upcoming Events
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join our professional training programs and workshops
            </p>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground">Loading events...</p>
          ) : upcomingEvents.length === 0 ? (
            <Card className="p-12 text-center border-2 border-emerald-100 bg-white max-w-xl mx-auto">
              <Calendar className="w-10 h-10 mx-auto text-emerald-600 mb-3" />
              <h3 className="text-xl font-bold mb-2">No events scheduled right now</h3>
              <p className="text-muted-foreground mb-6">New workshops and programs are announced here regularly.</p>
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <Link to={`${basePath}/contact`}>Get notified</Link>
              </Button>
            </Card>
          ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {upcomingEvents.map((event, index) => (
              <Card
                key={event.id}
                className={`group overflow-hidden hover:shadow-2xl transition-all duration-500 border-2 ${
                  event.featured ? 'border-yellow-400 ring-4 ring-yellow-100' : 'hover:border-emerald-300'
                } bg-white`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {event.featured && (
                  <div className="bg-emerald-700 px-6 py-3 text-center">
                    <span className="text-white font-bold text-sm">NEXT UP</span>
                  </div>
                )}

                {event.image_url && (
                  <img src={event.image_url} alt={event.title} className="w-full h-48 object-cover" loading="lazy" />
                )}

                <div className="p-8">
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 mb-4 font-semibold">
                    {event.type}
                  </Badge>

                  <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-emerald-600 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {event.description}
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-medium">{event.date}</span>
                    </div>

                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Clock className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-medium">{event.duration}</span>
                    </div>

                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-medium">{event.location}</span>
                    </div>

                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Users className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-medium">{event.participants}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t-2 border-emerald-100">
                    <div className="text-3xl font-extrabold text-emerald-600">
                      {event.price}
                    </div>
                    {event.registration_url ? (
                      <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <a href={event.registration_url} target="_blank" rel="noopener noreferrer">
                          Register <ArrowRight className="ml-2 w-4 h-4" />
                        </a>
                      </Button>
                    ) : (
                      <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Link to={`${basePath}/contact`}>
                          Register <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          )}

        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Why Join Our Programs?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: "🎓", title: "Expert Instructors", desc: "Learn from industry professionals" },
              { icon: "💼", title: "Practical Projects", desc: "Build real-world portfolio pieces" },
              { icon: "📜", title: "Certificates", desc: "Industry-recognized credentials" },
              { icon: "🤝", title: "Networking", desc: "Connect with peers and mentors" }
            ].map((benefit, i) => (
              <Card key={i} className="p-8 text-center hover:shadow-xl transition-all border-2 hover:border-emerald-200">
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-emerald-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
        }}></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Want to Host an Event With Us?
          </h2>
          <p className="text-xl text-emerald-50 mb-10 leading-relaxed">
            We're open to partnerships and collaboration opportunities
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white text-emerald-900 hover:bg-emerald-50 text-lg px-10 py-6 h-auto font-bold shadow-2xl hover:scale-105 transition-all rounded-2xl"
          >
            <Link to={`${basePath}/contact`}>Partner With Us</Link>
          </Button>
        </div>
      </section>
    </AkboyLayout>
  );
}

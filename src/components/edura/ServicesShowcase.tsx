import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  Building2,
  FileCheck,
  GraduationCap,
  Layers,
} from "lucide-react";
import ProviderLogo from "@/components/edura/ProviderLogo";

type CatalogRow = {
  id: string;
  name: string;
  provider: string;
  price: number;
  turnaround: string | null;
  slug: string;
};

const PROVIDER_META: Record<string, { label: string; icon: typeof GraduationCap }> = {
  jamb: { label: "JAMB", icon: GraduationCap },
  waec: { label: "WAEC", icon: FileCheck },
  neco: { label: "NECO", icon: FileCheck },
  nabteb: { label: "NABTEB", icon: FileCheck },
  admission: { label: "Admissions", icon: Building2 },
};

const naira = (value: number) =>
  `₦${Number(value || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

export const ServicesShowcase = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<CatalogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("service_catalog")
        .select("id, name, provider, price, turnaround, slug")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(60);
      if (!active) return;
      setServices((data as CatalogRow[]) || []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const providers = Array.from(new Set(services.map((s) => s.provider)));
  const featured = services.slice(0, 4);

  return (
    <Card className="border">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border bg-muted p-2">
              <Layers className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Educational Services</h3>
                <Badge variant="secondary" className="text-[10px]">
                  Core
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                e-PINs, exam registrations, result checking & admission support
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => navigate("/services")}
          >
            Open
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Services will appear here once they are published.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {providers.slice(0, 8).map((provider) => {
                const meta = PROVIDER_META[provider] ?? {
                  label: provider.toUpperCase(),
                  icon: Layers,
                };
                const Icon = meta.icon;
                const count = services.filter((s) => s.provider === provider).length;
                return (
                  <button
                    key={provider}
                    onClick={() => navigate(`/services?provider=${provider}`)}
                    className="flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-colors hover:border-primary/60"
                  >
                    {provider === "admission" ? (
                      <Icon className="h-8 w-8 rounded-md border bg-muted p-1.5 text-foreground" />
                    ) : (
                      <ProviderLogo provider={provider} className="h-8 w-8" />
                    )}
                    <span className="text-xs font-semibold leading-tight">{meta.label}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {count} service{count === 1 ? "" : "s"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="divide-y rounded-lg border">
              {featured.map((service) => (
                <button
                  key={service.id}
                  onClick={() => navigate(`/services?service=${service.slug}`)}
                  className="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{service.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(PROVIDER_META[service.provider]?.label ?? service.provider.toUpperCase())}
                      {service.turnaround ? ` · ${service.turnaround}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">{naira(service.price)}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ServicesShowcase;

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  resolveInstitutionLogo,
  setInstitutionOverrides,
  type InstitutionEntry,
  type LogoSubject,
} from "@/lib/institutionLogos";

let overridesLoaded = false;
let overridesPromise: Promise<void> | null = null;

/** Loads the admin-managed institution logo overrides once per session. */
export function useInstitutionOverrides() {
  const [ready, setReady] = useState(overridesLoaded);

  useEffect(() => {
    if (overridesLoaded) return;
    if (!overridesPromise) {
      overridesPromise = (async () => {
        const { data, error } = await supabase
          .from("institution_logos")
          .select("name, short_name, aliases, domain, logo_url, institution_type")
          .eq("is_active", true);
        if (!error && data) {
          const entries: InstitutionEntry[] = data.map((row: any) => ({
            name: row.name,
            short: row.short_name || row.name,
            aliases: Array.isArray(row.aliases) ? row.aliases : [],
            domain: row.domain || undefined,
            logoUrl: row.logo_url || undefined,
            type: (row.institution_type as InstitutionEntry["type"]) || "other",
          }));
          setInstitutionOverrides(entries);
        }
        overridesLoaded = true;
      })();
    }
    overridesPromise.then(() => setReady(true));
  }, []);

  return ready;
}

interface Props extends LogoSubject {
  size?: number;
  className?: string;
  rounded?: string;
}

/**
 * Renders the institution's logo for a post. Never falls back to the Edura logo —
 * unknown institutions get a forest-green monogram tile.
 */
export function InstitutionLogo({ size = 56, className = "", rounded = "rounded-xl", ...subject }: Props) {
  const resolved = resolveInstitutionLogo(subject, Math.max(64, size * 2));
  const [failed, setFailed] = useState(false);

  const showImage = resolved.src && !failed;

  return (
    <div
      className={`flex items-center justify-center overflow-hidden border border-akboy-line bg-white ${rounded} ${className}`}
      style={{ width: size, height: size }}
      title={resolved.label}
    >
      {showImage ? (
        <img
          src={resolved.src as string}
          alt={`${resolved.label} logo`}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain p-1.5"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-akboy-forest text-white">
          <span
            className="font-semibold tracking-tight"
            style={{ fontSize: Math.max(10, Math.round(size / (resolved.short.length > 3 ? 4.6 : 3.2))) }}
          >
            {resolved.short}
          </span>
        </div>
      )}
    </div>
  );
}

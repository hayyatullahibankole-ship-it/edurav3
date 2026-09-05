/**
 * Institution logo resolution for Campus Hub posts.
 *
 * Resolution order:
 *   1. Admin-uploaded logo (institution_logos table)
 *   2. Built-in registry (official domain -> logo image service)
 *   3. Institution detected from the post title / tags
 *   4. Institution-type badge (University / Polytechnic / College / Exam body)
 *   5. Forest-green monogram tile built from the initials
 */

export type InstitutionType =
  | "university"
  | "polytechnic"
  | "college"
  | "exam-body"
  | "agency"
  | "other";

export interface InstitutionEntry {
  name: string;
  short: string;
  domain?: string;
  logoUrl?: string;
  aliases: string[];
  type: InstitutionType;
}

const E = (
  short: string,
  name: string,
  domain: string | undefined,
  type: InstitutionType,
  aliases: string[] = []
): InstitutionEntry => ({ short, name, domain, type, aliases });

/** Built-in registry of Nigerian institutions and education bodies. */
export const INSTITUTION_REGISTRY: InstitutionEntry[] = [
  // Exam bodies & agencies
  E("JAMB", "Joint Admissions and Matriculation Board", "jamb.gov.ng", "exam-body", ["utme", "jamb board", "joint admissions"]),
  E("WAEC", "West African Examinations Council", "waecnigeria.org", "exam-body", ["wassce", "west african examinations"]),
  E("NECO", "National Examinations Council", "neco.gov.ng", "exam-body", ["national examinations council"]),
  E("NABTEB", "National Business and Technical Examinations Board", "nabteb.gov.ng", "exam-body", []),
  E("NUC", "National Universities Commission", "nuc.edu.ng", "agency", ["universities commission"]),
  E("NBTE", "National Board for Technical Education", "nbte.gov.ng", "agency", []),
  E("NCCE", "National Commission for Colleges of Education", "ncceonline.edu.ng", "agency", []),
  E("TETFUND", "Tertiary Education Trust Fund", "tetfund.gov.ng", "agency", ["tetfund"]),
  E("NYSC", "National Youth Service Corps", "nysc.gov.ng", "agency", []),
  E("JUPEB", "Joint Universities Preliminary Examinations Board", "jupeb.edu.ng", "exam-body", []),
  E("IJMB", "Interim Joint Matriculation Board", "ijmb.edu.ng", "exam-body", []),

  // Federal universities
  E("UNILAG", "University of Lagos", "unilag.edu.ng", "university", ["university of lagos"]),
  E("UI", "University of Ibadan", "ui.edu.ng", "university", ["university of ibadan"]),
  E("OAU", "Obafemi Awolowo University", "oauife.edu.ng", "university", ["obafemi awolowo"]),
  E("UNN", "University of Nigeria, Nsukka", "unn.edu.ng", "university", ["university of nigeria", "nsukka"]),
  E("ABU", "Ahmadu Bello University", "abu.edu.ng", "university", ["ahmadu bello"]),
  E("UNIBEN", "University of Benin", "uniben.edu", "university", ["university of benin"]),
  E("UNIPORT", "University of Port Harcourt", "uniport.edu.ng", "university", ["port harcourt"]),
  E("UNILORIN", "University of Ilorin", "unilorin.edu.ng", "university", ["university of ilorin"]),
  E("UNIZIK", "Nnamdi Azikiwe University", "unizik.edu.ng", "university", ["nnamdi azikiwe"]),
  E("UNICAL", "University of Calabar", "unical.edu.ng", "university", ["university of calabar"]),
  E("UNIJOS", "University of Jos", "unijos.edu.ng", "university", ["university of jos"]),
  E("UNIMAID", "University of Maiduguri", "unimaid.edu.ng", "university", ["maiduguri"]),
  E("BUK", "Bayero University Kano", "buk.edu.ng", "university", ["bayero university"]),
  E("UNIUYO", "University of Uyo", "uniuyo.edu.ng", "university", ["university of uyo"]),
  E("UNIABUJA", "University of Abuja", "uniabuja.edu.ng", "university", ["university of abuja"]),
  E("FUTA", "Federal University of Technology, Akure", "futa.edu.ng", "university", ["futa akure"]),
  E("FUTMINNA", "Federal University of Technology, Minna", "futminna.edu.ng", "university", ["futminna", "minna"]),
  E("FUTO", "Federal University of Technology, Owerri", "futo.edu.ng", "university", ["futo owerri"]),
  E("FUOYE", "Federal University Oye-Ekiti", "fuoye.edu.ng", "university", ["oye ekiti"]),
  E("FULAFIA", "Federal University Lafia", "fulafia.edu.ng", "university", ["lafia"]),
  E("FUDMA", "Federal University Dutsin-Ma", "fudutsinma.edu.ng", "university", ["dutsin-ma"]),
  E("FUOTUOKE", "Federal University Otuoke", "fuotuoke.edu.ng", "university", ["otuoke"]),
  E("FUWUKARI", "Federal University Wukari", "fuwukari.edu.ng", "university", ["wukari"]),
  E("FUHSI", "Federal University of Health Sciences, Ila-Orangun", "fuhsi.edu.ng", "university", ["health sciences ila"]),
  E("MOUAU", "Michael Okpara University of Agriculture", "mouau.edu.ng", "university", ["michael okpara"]),
  E("FUNAAB", "Federal University of Agriculture, Abeokuta", "funaab.edu.ng", "university", ["abeokuta agriculture"]),
  E("NDU", "Niger Delta University", "ndu.edu.ng", "university", ["niger delta university"]),
  E("NOUN", "National Open University of Nigeria", "nou.edu.ng", "university", ["open university"]),

  // State universities
  E("LASU", "Lagos State University", "lasu.edu.ng", "university", ["lagos state university"]),
  E("UNIOSUN", "Osun State University", "uniosun.edu.ng", "university", ["osun state university"]),
  E("EKSU", "Ekiti State University", "eksu.edu.ng", "university", ["ekiti state university"]),
  E("EBSU", "Ebonyi State University", "ebsu.edu.ng", "university", ["ebonyi state university"]),
  E("IMSU", "Imo State University", "imsu.edu.ng", "university", ["imo state university"]),
  E("ABSU", "Abia State University", "abiastateuniversity.edu.ng", "university", ["abia state university"]),
  E("DELSU", "Delta State University", "delsu.edu.ng", "university", ["delta state university"]),
  E("AAUA", "Adekunle Ajasin University", "aaua.edu.ng", "university", ["adekunle ajasin"]),
  E("TASUED", "Tai Solarin University of Education", "tasued.edu.ng", "university", ["tai solarin"]),
  E("OOU", "Olabisi Onabanjo University", "oouagoiwoye.edu.ng", "university", ["olabisi onabanjo"]),
  E("KWASU", "Kwara State University", "kwasu.edu.ng", "university", ["kwara state university"]),
  E("YSU", "Yobe State University", "ysu.edu.ng", "university", ["yobe state university"]),
  E("KASU", "Kaduna State University", "kasu.edu.ng", "university", ["kaduna state university"]),
  E("BSU", "Benue State University", "bsum.edu.ng", "university", ["benue state university"]),
  E("RSU", "Rivers State University", "ust.edu.ng", "university", ["rivers state university"]),
  E("LAUTECH", "Ladoke Akintola University of Technology", "lautech.edu.ng", "university", ["ladoke akintola"]),
  E("AAU", "Ambrose Alli University", "aauekpoma.edu.ng", "university", ["ambrose alli", "ekpoma"]),
  E("GOUNI", "Godfrey Okoye University", "gouni.edu.ng", "university", ["godfrey okoye"]),
  E("SUMAS", "Sule Lamido University", "slu.edu.ng", "university", ["sule lamido"]),

  // Private universities
  E("COVENANT", "Covenant University", "covenantuniversity.edu.ng", "university", ["covenant university"]),
  E("BABCOCK", "Babcock University", "babcock.edu.ng", "university", ["babcock"]),
  E("RUN", "Redeemer's University", "run.edu.ng", "university", ["redeemer's university", "redeemers university"]),
  E("ACU", "Ajayi Crowther University", "acu.edu.ng", "university", ["ajayi crowther"]),
  E("ELIZADE", "Elizade University", "elizadeuniversity.edu.ng", "university", ["elizade"]),
  E("CRESCENT", "Crescent University", "crescentuniversity.edu.ng", "university", ["crescent university"]),
  E("LANDMARK", "Landmark University", "lmu.edu.ng", "university", ["landmark university"]),
  E("BOWEN", "Bowen University", "bowen.edu.ng", "university", ["bowen university"]),
  E("AFE", "Afe Babalola University", "abuad.edu.ng", "university", ["afe babalola", "abuad"]),
  E("PAU", "Pan-Atlantic University", "pau.edu.ng", "university", ["pan atlantic"]),

  // Polytechnics
  E("YABATECH", "Yaba College of Technology", "yabatech.edu.ng", "polytechnic", ["yaba college"]),
  E("LASPOTECH", "Lagos State Polytechnic", "mylaspotech.edu.ng", "polytechnic", ["lagos state polytechnic"]),
  E("IBADAN POLY", "The Polytechnic, Ibadan", "polyibadan.edu.ng", "polytechnic", ["polytechnic ibadan", "poly ibadan"]),
  E("KADPOLY", "Kaduna Polytechnic", "kadunapolytechnic.edu.ng", "polytechnic", ["kaduna polytechnic"]),
  E("FEDPOLYADO", "Federal Polytechnic Ado-Ekiti", "fedpolyado.edu.ng", "polytechnic", ["ado ekiti polytechnic"]),
  E("FEDPOLYNEK", "Federal Polytechnic Nekede", "fpno.edu.ng", "polytechnic", ["nekede"]),
  E("KOGI POLY", "Kogi State Polytechnic", "kogistatepolytechnic.edu.ng", "polytechnic", ["kogi polytechnic"]),
  E("AUCHIPOLY", "Auchi Polytechnic", "auchipoly.edu.ng", "polytechnic", ["auchi"]),
  E("MOSHOOD", "Moshood Abiola Polytechnic", "mapoly.edu.ng", "polytechnic", ["mapoly", "moshood abiola"]),

  // Colleges
  E("FCE", "Federal College of Education", undefined, "college", ["federal college of education"]),
  E("KIRU", "Federal College of Education, Kiru", undefined, "college", ["kiru"]),
];

/** Generic buckets used by the blog editor when no specific school is set. */
const GENERIC_BUCKETS: Record<string, InstitutionType> = {
  university: "university",
  "other university": "university",
  polytechnic: "polytechnic",
  "college of education": "college",
  "college of health": "college",
  "college of nursing": "college",
  college: "college",
  other: "other",
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

export interface ResolvedLogo {
  /** Image URL, or null when only a monogram should be rendered. */
  src: string | null;
  label: string;
  short: string;
  type: InstitutionType;
  /** True when we matched a real institution (not a generic bucket). */
  matched: boolean;
}

const LOGO_DEV_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY as string | undefined;

/** Build a logo image URL from an official domain. */
export function logoUrlForDomain(domain: string, size = 128): string {
  if (LOGO_DEV_KEY) {
    return `https://img.logo.dev/${domain}?token=${LOGO_DEV_KEY}&size=${size}&format=png`;
  }
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

/** Overrides loaded from the institution_logos table (set once at app level). */
let overrides: InstitutionEntry[] = [];

export function setInstitutionOverrides(entries: InstitutionEntry[]) {
  overrides = entries;
}

export function getInstitutionOverrides() {
  return overrides;
}

function matchEntry(haystack: string, list: InstitutionEntry[]): InstitutionEntry | null {
  const text = ` ${norm(haystack)} `;
  let best: InstitutionEntry | null = null;
  let bestLen = 0;
  for (const entry of list) {
    const candidates = [entry.short, entry.name, ...entry.aliases].filter(Boolean);
    for (const raw of candidates) {
      const c = norm(String(raw));
      if (!c || c.length < 2) continue;
      if (text.includes(` ${c} `) && c.length > bestLen) {
        best = entry;
        bestLen = c.length;
      }
    }
  }
  return best;
}

export interface LogoSubject {
  school?: string | null;
  institution_type?: string | null;
  title?: string | null;
  tags?: unknown;
}

function tagText(tags: unknown): string {
  if (!tags) return "";
  if (Array.isArray(tags)) return tags.filter(t => typeof t === "string").join(" ");
  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed.join(" ") : tags;
    } catch {
      return tags;
    }
  }
  return "";
}

export function initials(text: string): string {
  const clean = text.replace(/[^A-Za-z0-9 ]/g, " ").trim();
  if (!clean) return "CH";
  const words = clean.split(/\s+/).filter(w => w.length > 1);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.slice(0, 3).map(w => w[0]).join("").toUpperCase();
}

export function resolveInstitutionLogo(subject: LogoSubject, size = 128): ResolvedLogo {
  const school = (subject.school || "").trim();
  const all = [...overrides, ...INSTITUTION_REGISTRY];

  // 1 + 2. Direct match on the post's school value
  let entry = school ? matchEntry(school, all) : null;

  // 3. Fall back to detecting the institution inside the title / tags
  if (!entry) {
    const text = `${subject.title || ""} ${tagText(subject.tags)}`;
    if (text.trim()) entry = matchEntry(text, all);
  }

  if (entry) {
    const src = entry.logoUrl || (entry.domain ? logoUrlForDomain(entry.domain, size) : null);
    return { src, label: entry.name, short: entry.short, type: entry.type, matched: true };
  }

  // 4. Generic institution-type bucket — brand with the Akboy logo
  const bucketKey = norm(school || String(subject.institution_type || ""));
  const bucket = GENERIC_BUCKETS[bucketKey];
  if (bucket) {
    return {
      src: AKBOY_LOGO,
      label: school || "Nigerian institutions",
      short: bucket === "university" ? "UNI" : bucket === "polytechnic" ? "POLY" : bucket === "college" ? "COL" : "NG",
      type: bucket,
      matched: false,
    };
  }

  // 5. General Campus Hub post — Akboy logo, never a bare monogram
  const label = school || "Campus Hub";
  return { src: AKBOY_LOGO, label, short: initials(label), type: "other", matched: false };
}

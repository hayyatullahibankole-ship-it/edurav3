# Campus Hub: Editorial Redesign, Subdomain, Institution Logos

## 1. Campus Hub redesign (match the Akboy website)

Rebuild `AkboyCampusHub` so it reads as part of akboy.space instead of a separate multi-colour app.

- Cream/bone background, forest green (`akboy-forest`) headings, butter accents, Fraunces/Playfair display headings, same navbar/footer chrome as the rest of the Akboy site.
- Remove the 9 rainbow category colours and the coloured "Browse by topic" gradient tiles. Categories become quiet forest/bone text chips; the active one uses butter.
- New layout:
  - Slim masthead: "Campus Hub" wordmark, one-line description, single search field, date.
  - Lead story: one large editorial card (institution logo + headline + standfirst).
  - Secondary row: 2-3 medium cards.
  - Main feed: clean list rows (logo, category, headline, school, time) with pagination — replaces the current mixed card grid.
  - Right rail: Trending, Browse by category with counts, WhatsApp consult card, newsletter.
- Keep every existing feature: search, category/school filters, URL params, slideshow content (folded into the lead story rotation), WhatsApp share, newsletter, consultancy section.
- Mobile: single column, horizontally scrollable category chips, no horizontal page scroll.

## 2. Subdomain routing

- Add `campushub.akboy.com.ng` (and `www.`) alongside the existing `campushub.akboy.space` entries in `useDomainDetection`.
- On a Campus Hub host: `/` renders the Campus Hub, `/post/:slug` (and `/blog/:slug`) renders a single post, everything else redirects to `/`. Internal links become root-relative on that host and keep the `/akboy/campus-hub` prefix elsewhere.
- Campus Hub gets its own head metadata (title/description/canonical pointing at the subdomain) and its own Akboy-styled header/footer variant — no Edura assets.
- DNS: you point `campushub` at the project in Project Settings → Domains; the code handles both hostnames once DNS resolves.

## 3. Institution logos on every post

No post should fall back to the Edura logo.

- **Registry**: an alias map (`UNILAG`, `University of Lagos`, `JAMB`, `WAEC`, `NECO`, `NABTEB`, `NUC`, `LASU`, `UNIZIK`, `OAU`, `ABU`, `FUTA`, `UNIBEN`, `UNIPORT`, `UNILORIN`, `BUK`, `NOUN`, `FULAFIA`, `UNIOSUN`, `EBSU`, `FUTMINNA`, polytechnics, colleges of education/health/nursing …) → official domain + display name.
- **Resolution order per post**: uploaded admin logo → registry logo → institution matched from the post title/tags when `school` is empty (350 posts currently have no school) → generic type badge (University / Polytechnic / College / Exam body) → forest-green monogram tile built from the school initials. The Edura fallback image is removed.
- **Admin**: new "Institution Logos" section (in the Akboy area of the admin portal) backed by an `institution_logos` table — name, aliases, domain, uploaded logo image, active flag — so you can add or override any institution. Uploads go to the existing public images bucket.
- Logo shows on feed rows, lead/secondary cards, the post page header, and is used for the social/OG image when the post has no featured image.

## Technical notes

- Files: `src/pages/akboy/AkboyCampusHub.tsx` (rewrite), `src/components/akboy/CampusHubAdvanced.tsx` (restyle), `AkboyNavbar.tsx` / `AkboyFooter.tsx` (Campus Hub variants), `useDomainDetection.tsx`, `PlatformRouter.tsx`, `AkboyBlogPost.tsx`, new `src/lib/institutionLogos.ts`, new `src/components/InstitutionLogo.tsx`, new `src/components/admin/InstitutionLogosManager.tsx`.
- Migration: `institution_logos` table with GRANTs, RLS (public read of active rows, admin write).
- Automatic logo fetching by domain uses the Logo.dev connector (publishable key, browser-side `img.logo.dev/<domain>`); I'll open the connect card during the build. If you skip it, resolution falls back to admin uploads, type badges and monograms.

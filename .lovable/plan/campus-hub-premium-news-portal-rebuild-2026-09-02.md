# Campus Hub — Premium News Portal Rebuild

Goal: a Campus Hub that reads like a real, high-traffic Nigerian education news portal (the CampusInfo category), but visibly more premium: tighter grid, real imagery, live signals, and consultancy conversion built into the page instead of bolted on.

## What CampusInfo does that we are missing

- A live breaking-news ticker across the top with the newest headlines
- A persistent category bar (University, Post-UTME, Polytechnics, JAMB, Nursing, Scholarships) that acts like real site navigation
- Every story card is image-led with category chip, author, and relative time ("2 hours ago")
- A credibility stats strip (articles, categories, institutions covered)
- Popular / most-read rail and a WhatsApp community call to action

We adopt these information patterns, then raise the execution: better type scale, real institution logos, denser but calmer grid, and no WordPress-theme clutter.

## New page structure

1. **Utility bar** — today's date, live "Updated" indicator, social + WhatsApp community link.
2. **Breaking ticker** — auto-scrolling marquee of the 8 newest headlines, pauses on hover, respects reduced motion.
3. **Masthead + category nav** — Akboy Campus Hub wordmark, prominent search, sticky category bar with active state and counts.
4. **Hero block** — one dominant lead story (large image, category chip, headline, dek, author + relative time) with a stacked column of 4 secondary headlines beside it; auto-rotating lead with manual dots.
5. **Credibility strip** — total published stories, categories, institutions tracked, free access. Values come from real Supabase counts, not hardcoded.
6. **Consultancy panel** — forest card offering admissions guidance, Post-UTME processing, eligibility check and WhatsApp booking, placed directly after the hero where intent is highest.
7. **Latest updates feed** — image-led cards in a 3-column grid (1 column mobile), each with logo fallback, chip, time-ago, share, and hover lift. Keeps search / category / institution / URL filters and pagination.
8. **Sidebar rail (desktop)** — Most read, Trending institutions with logos, newsletter signup, and a compact deadline/alerts card. Collapses below the feed on mobile.
9. **Institution directory strip** — horizontally scrollable institution logos that filter the feed.
10. **Closing CTA + footer** — WhatsApp community, consultation, existing Akboy footer.

## Visual direction

- Fresh Campus palette stays: forest `#116149`, white `#FDFEFE`, mist `#E7F1ED`, lime `#BFE36C` via `akboy-*` tokens only.
- Editorial display face for headlines, clean sans for body and metadata; tighter leading, stronger size contrast between lead and feed.
- Flat surfaces, hairline borders, soft elevation on hover only. No gradients, no Edura branding, no rainbow categories, no AI-generic look.
- Motion: ticker scroll, lead crossfade, card hover lift, section reveal — all disabled under `prefers-reduced-motion`.

## Technical details

- Rewrite the presentation layer of `src/pages/akboy/AkboyCampusHub.tsx`; keep its Supabase query, `q`/`category`/`school` URL filters, lead rotation, pagination, share and routing logic intact.
- Add small presentational components under `src/components/akboy/campus-hub/` (ticker, story card, sidebar rail, stats strip) so the page file stays readable.
- Reuse `PostImage`, `InstitutionLogo`, `AkboyLayout`, and existing `akboy-*` tokens; add tokens only if a new surface shade is needed.
- Relative timestamps via a small local formatter; category and institution counts derived from the fetched post set.
- Fold `CampusHubAdvanced.tsx` content (eligibility, recommendations, newsletter, consultation) into the new sections so nothing looks detached.

## Verification

- `tsgo --noEmit`, smoke tests, and a clean build log.
- Playwright screenshots at 1440px and 390px, zero horizontal overflow.
- Manually confirm search, category filter, institution filter, pagination, article links, WhatsApp share and consultation actions still work.

# Campus Hub — Editorial Redesign (Creative-Studio Grade)

The current page reads like a plain news list: flat grey rows, small logos, no rhythm, no craft. Campus Hub should look like a designed publication from a creative studio — the kind of magazine layout you'd see on modern editorial sites, not a bulletin board.

## Design direction

A confident print-magazine feel, rendered digitally:

- **Oversized display typography.** Fraunces/Playfair headlines at real editorial scale (up to 72px on desktop), tight leading, generous letter-spacing on kickers. Headlines carry the page — not boxes.
- **Cream paper canvas, forest ink, butter accent.** Deep forest green as the ink colour, butter yellow used sparingly as a highlight (underline swipes, rule numbers, section markers). No greys as the dominant tone, no gradients, no rainbow category colours.
- **Editorial rules and grid.** Thin hairline rules, column dividers, numbered items, drop-cap style section markers — structure created by typography and spacing, not by card shadows.
- **Big imagery with intent.** Lead story gets a full-bleed image with an overlapping text block; secondary stories get portrait crops; text-only posts get a designed typographic tile (large institution monogram on butter/forest field) instead of an empty grey box.
- **Motion with restraint.** Fade-and-rise on scroll, slow image zoom on hover, headline underline swipe, lead-story crossfade. Nothing bouncy.

## Page structure

```text
┌─────────────────────────────────────────────────────┐
│ MASTHEAD  Campus Hub — serif wordmark, date line,   │
│ one-line manifesto, hairline rule, search + rail    │
├──────────────────────────────┬──────────────────────┤
│ LEAD  full-bleed image with  │ 01 …                 │
│ overlapping cream text card, │ 02 …  numbered       │
│ oversized headline, kicker   │ 03 …  briefs column  │
├──────────────────────────────┴──────────────────────┤
│ SECTION RULE — "Admissions" / "Scholarships"        │
│ magazine grid: 1 tall feature + 2 stacked stories   │
├─────────────────────────────────────────────────────┤
│ INSTITUTIONS strip — logo marquee/row, click filters│
├──────────────────────────────┬──────────────────────┤
│ THE FEED  editorial rows:    │ RAIL                 │
│ portrait thumb, kicker,      │ · Most read (numbered)│
│ headline, standfirst, meta   │ · Newsletter (forest) │
│ hairline dividers, pagination│ · Consultancy CTA     │
├──────────────────────────────┴──────────────────────┤
│ TOOLS  eligibility checker + recommendations,       │
│ restyled as editorial panels                        │
└─────────────────────────────────────────────────────┘
```

Mobile: single column, lead image 4:5, headline 32-36px, sticky category rail that scrolls horizontally, feed rows with 88px thumbnails, no horizontal overflow.

## What stays working

Search, category filter, institution filter, URL params, pagination, lead-story rotation, WhatsApp sharing, newsletter signup, consultation booking, WhatsApp float, institution logos with monogram fallback (never the Edura logo).

## Technical notes

- Rewrite `src/pages/akboy/AkboyCampusHub.tsx` around the layout above; keep the existing data query, filter state, and URL-param logic unchanged.
- Add a `PostImage` presentation piece: featured image when present, otherwise a designed typographic tile using the institution monogram — replaces every empty/grey fallback.
- Restyle `src/components/akboy/CampusHubAdvanced.tsx` panels to the same editorial system (hairline borders, serif headings, butter accents, no rounded-3xl card look).
- Give `src/pages/akboy/AkboyBlogPost.tsx` a matching article layout: full-bleed lead image, oversized serif headline, drop cap on the first paragraph, measured 68-72ch reading column, styled pull-quotes and headings, related-stories footer.
- Add a small reveal-on-scroll utility (IntersectionObserver + Tailwind transitions) used across sections; respect `prefers-reduced-motion`.
- Tokens only (`akboy-forest`, `akboy-moss`, `akboy-butter`, `akboy-bone`, `akboy-paper`, `akboy-line`, `akboy-muted`) — no hardcoded colours, no gradients.

## Verification

Typecheck, production build, and a preview pass at 390px and 1440px checking headline scale, image handling, filter behaviour, and no horizontal scroll.

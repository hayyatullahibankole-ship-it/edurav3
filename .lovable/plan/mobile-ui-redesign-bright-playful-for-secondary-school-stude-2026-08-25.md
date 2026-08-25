# Mobile UI Redesign — "Bright & Playful" for Secondary School Students

Goal: make the Edura mobile app feel like an app teenagers *want* to open — colourful, friendly, rewarding — without changing any features, data, payments or routing.

## Design direction (locked)

- **Base**: light, soft white/near-white canvas, generous rounding (20–28px), no gradients (keeping your rule), soft ambient shadows instead.
- **Accent system**: Edura Green stays primary. Add four soft pastel tints used only as *card backgrounds* — mint (practice), sky (learning), butter (rewards/streak), lilac (services). Each tint gets a matching deep text colour for contrast in light and dark mode.
- **Type**: Sora for headings and big numbers, Manrope for body — larger, friendlier sizes; short, plain-English labels ("Practice now", "My results", not "CBT engine").
- **Motion**: spring press on every tap target, count-up numbers, gentle card entry stagger, confetti-free but celebratory streak/level moments. All respect reduced motion.

## 1. New floating dock navigation (the reference image)

- Replace the flat bottom bar with a **floating rounded dock** that sits above the safe area with a soft shadow.
- **Raised circular centre button** with the curved notch cut out of the dock behind it, exactly like your reference: dark circle, white icon, springs on press.
- Two labelled tabs left, two right; the active tab gets a filled pill + colour, inactive stays quiet grey.
- Same dock shape for candidates and campus students, only the tabs differ.

## 2. Home screen (candidate)

- **Friendly greeting header**: avatar, "Hi, Tobi 👋", today's date, notification bell — the personal top row from your reference.
- **Hero card**: one big soft-tinted card with the single next action ("Continue practice" or "Start a quick practice"), a small progress ring, and streak flame.
- **Week strip**: a horizontal day row (Sun–Sat) showing which days were studied — visual streak proof, taps to that day's activity summary.
- **"Your tools" bento**: four large tinted cards — Practice, Study decks, AI tutor, Services — each with a real icon, one-line description and a mini stat.
- Metrics (tests taken, average, wallet) become a compact 3-up strip lower down, not the headline.

## 3. Real exam brand marks

- New `ExamBadge` component rendering **JAMB / WAEC / NECO / Post-UTME** as typographic brand tiles (bold wordmark on branded tint) instead of generic Lucide icons — used in CBT home, explore sheet, and schedule modal.

## 4. Other screens brought in line

- **CBT home**: exam picker as brand tiles, then a clear "Start practice" primary card; practice tools as a tinted grid; recent result card with a friendly score ring.
- **Services / Wallet**: same header, tinted status cards, larger tap targets, balance-first wallet.
- **Campus home**: same structure and dock, campus-specific tools.
- **Explore sheet**: reworked as a colourful, sectioned grid matching the new tiles.

## 5. Consistency pass

- Shared mobile primitives updated once (page header, hero card, tool tile, section heading, empty/loading skeletons) so every screen inherits the new look.
- 44px minimum tap targets, safe-area padding, no horizontal scroll at 360px width, dark-mode contrast checked.

## Technical notes

- Frontend only: tokens in `index.css` / `tailwind.config.ts`, `AppShell.tsx` (dock), `MobilePrimitives.tsx`, `Dashboard.tsx`, `CBTHome.tsx`, `ServicesHome.tsx`, `Wallet.tsx`, `CampusHome.tsx`, `ExploreSheet.tsx`, plus new `ExamBadge.tsx`.
- Dock notch drawn with an inline SVG mask so the curve is crisp on all widths.
- No database, payment, routing or business-logic changes; desktop and Akboy branding untouched.

## Validation

- Check candidate and campus flows at 360px and 430px widths, light and dark, with reduced motion on.
- Confirm every tab, centre action and tool tile navigates correctly and the build stays clean.

NOTE: no useless gradients whatsoever
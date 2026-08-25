# Playful Mobile Nav + Exam Brand Marks

Goal: kill the boring flat tab bar and the "Explore" pill, bring back a real circular center button in a modern floating dock, and make the app feel lighter and more fun — closer to the reference designs, without gradients or AI-generic styling.

## 1. New bottom navigation (the main change)

Replace the current full-width bordered bar with a **floating dock**:

- Rounded (28px) white/dark card floating above the safe area with a soft ambient shadow, not a hard top border.
- A **notched circular center button**: a true circle (60px), dark ink fill, lifted above the dock with a curved cut-out behind it, exactly like the first reference image.
- Center button opens Explore (candidate) / More (campus) — same actions as today, new shape.
- Four tabs around it, icon-first. Labels stay but shrink and only the active tab shows its label in full weight.
- Active tab gets a filled pill behind the icon plus a small dot indicator that **slides** between tabs (spring motion), instead of the static tint.
- Haptic/press feedback and reduced-motion fallback preserved.

## 2. Lighter, friendlier surface styling

Adopt the "soft card" feel from the reference without breaking the Edura palette:

- Softer radii (20-28px) and tinted pastel card backgrounds derived from existing tokens (green, blue, amber, violet accents at low opacity) for the home tool tiles — currently everything is white on white and reads as "serious".
- Larger, rounder section headings (Sora), more breathing room, and a friendlier greeting header row (avatar left, greeting + date center-left, action icon right) matching the reference home.
- Still no gradients; flat tinted fills only.

## 3. Real exam brand marks instead of generic icons

- Add a shared `ExamBadge` component that renders each exam as a **branded wordmark tile** (JAMB, WAEC, NECO, Post-UTME) with its own accent colour and typography, instead of the current Lucide glyphs.
- Use it everywhere exams appear: CBT home cards, Explore sheet practice row, results, and exam selection.
- Marks are original typographic badges (not copies of the official logos) so there is no trademark risk in the Play Store listing.

## 4. Scope of files

- `src/components/edura/AppShell.tsx` — new dock + circular center button + sliding indicator.
- `src/components/edura/ExploreSheet.tsx` — exam row uses the new badges, softer tiles.
- New `src/components/edura/ExamBadge.tsx`.
- `src/pages/Dashboard.tsx`, `src/pages/CBTHome.tsx` — greeting header, tinted tool tiles, exam badges.
- `src/index.css` / `tailwind.config.ts` — add the pastel accent tokens and dock shadow token.

Frontend-only; no data, routing, or payment logic changes.

## Validation

Check at 360px and 430px widths: dock does not overlap content, center circle is tappable, active indicator animates, dark mode contrast holds, and no horizontal scroll.

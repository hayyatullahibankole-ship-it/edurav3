# Edura Next — Existing Product Audit & Redesign Plan

**Status:** Discovery baseline  
**Repository:** `hayyatullahibankole-ship-it/edurav3`  
**Default branch audited:** `main`  
**Working branch:** `edura-next-audit`  
**Production status:** Edura is already live at https://edura.com.ng and in Google Play. This effort is a redesign/upgrade, not a greenfield rebuild.

## 1. Goal

Upgrade Edura’s visual identity, information architecture, interactions, animations and perceived product quality across the public website and Capacitor Android app, while preserving current business logic, routes, data, auth, CBT scoring/submission, payments, wallet, offline sync, school features and existing users.

Do not replace working features with mock implementations or introduce a separate subsystem that duplicates existing capabilities without a deliberate product decision.

## 2. Confirmed repository architecture

- Vite + React 18 + TypeScript.
- Tailwind CSS, shadcn/ui, Radix primitives and lucide-react.
- Supabase JS client for backend access.
- Capacitor 7 Android/iOS packages; Android app ID `com.akboy.edura`, web output `dist`.
- React Router with a large lazy-loaded route graph.
- React Query, next-themes, Vitest and ESLint.
- Existing PWA/offline support and Capacitor native hooks.

Primary inspected files:
- `src/pages/Home.tsx` — public marketing homepage.
- `src/pages/Dashboard.tsx` — candidate student dashboard.
- `src/pages/MobileHome.tsx` — mobile-specific home experience.
- `src/pages/CBTHome.tsx` — CBT landing/workspace.
- `src/components/PlatformRouter.tsx` — domain/platform and route selection.
- `src/components/edura/AppShell.tsx` — shared navigation shell.
- `src/components/edura/ExploreSheet.tsx` — discovery navigation.
- `src/components/MobileNav.tsx` — legacy/alternate mobile navigation.
- `src/pages/MobileOnboarding.tsx` and `MobileSplash.tsx`.
- `src/index.css`, `tailwind.config.ts` — tokens, primitives and motion utilities.
- `src/lib/gamify.ts`, `src/components/edura/gamify/*` — existing streak/XP/level/badge system.
- `capacitor.config.ts` — native configuration.

Domain detection explicitly recognizes `edura.com.ng` and `www.edura.com.ng`. Preserve that behavior.

## 3. Existing product features found in code

The repository includes distinct pages/components for:
- JAMB, WAEC, NECO and Post-UTME CBT; test/results/review flows.
- Question banks, offline exams and offline sync.
- Student dashboard, recent results, streaks, levels, XP and badges.
- Study hub, study decks/flashcards, topic/lesson views and study planner.
- AI tutor and campus AI companion.
- Challenge Arena, challenge detail/results and leaderboard.
- Performance report and subject-progress components.
- Forum/community, notifications, resource/ebook library.
- Wallet, payment/subscription, promo-code redemption and service desk.
- School registration, subscription and school dashboard.
- Campus academic workspace, projects, opportunities, tools, logbook, career/NYSC-related modules.
- Admin portal/dashboard and account settings.

Treat this list as code-surface inventory, not a guarantee that every feature is currently enabled or bug-free in production. Validate live behavior before changing it.

## 4. Initial design/product diagnosis

### A. Product architecture is broad; hierarchy needs validation
The code contains a large set of capabilities and multiple navigation surfaces. The risk is feature overload and unclear prioritisation, not necessarily feature scarcity. Audit which navigation options students need most by journey and stage.

### B. More than one home experience exists
`Home.tsx`, `Dashboard.tsx` and `MobileHome.tsx` represent distinct experiences. Trace routing and platform conditions before changing visual components. Avoid redesigning one screen while leaving another active on some entry paths.

### C. Gamification already exists
`lib/gamify.ts` derives XP from completed test count, average score and streak; badges include first test, ten tests, streak milestones, high score and consistency. Components include `StreakHero`, `BadgeStrip`, `ProgressRing`, `CountUp` and other primitives. Do not pitch basic streaks, XP, levels or badges as new USP. Evaluate whether the current system rewards learning quality and improvement, rather than only activity and scores.

### D. Motion utilities exist, but a coherent motion language may not
`src/index.css` contains screen-entry/pop animations, press feedback, hover lift, shimmer/loading animations and reduced-motion rules. The redesign should review how consistently these are applied and whether they look intentional, smooth and performant—not add random animation classes everywhere.

### E. Theme tokens exist
There are Edura green, ink, mint/sky/butter/lilac/peach and AKBOY forest/lime/bone tokens. Avoid a blind token rewrite. First settle a dedicated Edura brand system and ensure AKBOY/campus microsites are not unintentionally recoloured.

### F. Platform details are important
Capacitor, safe-area handling, Android back-button, status bar, splash screen, haptics, notifications and installed-app/PWA detection are present. Preserve and test them. Be careful with nested clickable elements, mobile bottom navigation, app-only feature gating, offline behavior and resume after an interrupted CBT.

## 5. Product positioning / USP hypothesis to validate

**Direction:** Edura as a complete student ecosystem, with exam preparation as the entry point and connected academic progress as the lasting value.

**Possible promise (hypothesis, not finalized):** “Edura helps students know what to work on next, practise it, and see whether they are improving—then carries their journey forward as their academic needs evolve.”

The potential differentiation is integration and continuity, not simply having AI, a leaderboard, flashcards, a question bank or gamification. Those features already exist in the market and/or in Edura.

### Candidate signature experience to investigate
A unified “next best action” on the dashboard that uses existing attempt, topic and progress data to recommend a short useful study action; then the follow-up session checks progress and records the outcome. This could connect current CBT, answer-review, study decks, AI tutor, study planner and performance reporting. Validate data availability and recommendation quality before implementing anything new. Do not claim a readiness score predicts exam results without validation.

## 6. Recommended sequence

### Phase 0 — Baseline and safety
1. Record current production flows and screenshots for public website, sign-in/sign-up, candidate dashboard, campus dashboard, CBT setup, active exam, submission, results/review, wallet/payment, resources, challenge, AI tutor and onboarding.
2. Create or verify a staging/preview environment and a branch; never experiment directly on production.
3. Run baseline `npm run build`, `npm run lint`, and `npm run test`; record existing failures.
4. Identify active route mapping by host, native app state, academic stage and user session.

### Phase 1 — Design foundation
1. Define Edura-specific visual tokens (color roles, type scale, spacing, radii, borders, elevation, icons and motion).
2. Document component states: default, hover/focus, pressed, disabled, loading, error, empty, offline and success.
3. Define a short motion spec with reduced-motion fallback and low-end Android performance constraints.
4. Keep CBT screens quieter and focused; use expressive motion on marketing, navigation, mission completion and progress reveals.
5. Use authentic Edura product screens/assets; do not depend on generic stock/AI-generated visuals to create identity.

### Phase 2 — Highest-leverage redesign
1. Public homepage at `edura.com.ng`: clarify the product promise, demonstrate the actual product, offer clear exam/campus entry paths and improve registration conversion.
2. Candidate dashboard: clear next action, useful progress, fewer competing priorities and cleaner progressive disclosure.
3. CBT workspace/setup/results: coherent journey, clear exam controls, legible questions, confidence around autosave/submission and meaningful review.
4. Shared shell/navigation: reconcile the main app shell and alternate mobile navigation after tracing which is actually active in each flow.

### Phase 3 — Make existing features feel connected
1. Prototype “recommended next action” with existing real data only.
2. Connect practice → explanation/review → targeted next practice → observable progress.
3. Test if this changes task completion, repeat sessions and topic improvement.
4. Only then decide whether to formalize a named signature product feature.

### Phase 4 — Rollout and validation
1. Implement in small PRs on a separate branch.
2. Regression test auth, route guards, role/stage routing, subscription gates, payment/wallet, exam scoring, question navigation, timer, submission, result review, offline sync and native navigation.
3. Check responsive breakpoints, reduced motion, keyboard/focus accessibility, dark mode and real low-end Android devices.
4. Roll out through staging/beta first, then update production website and prepare an Android release only after verification.
5. Track baseline and post-release activation, first-session completion, D1/D7/D30 retention, completed practice sessions, repeat topic accuracy, conversion, failed submissions, crash rate and loading performance.

## 7. Non-negotiable safeguards

- Do not change Supabase schema, security policies, auth, payment, question marking, score calculations or exam timing as part of a visual pass without a separate explicit design/engineering review.
- Never hardcode demo student statistics into production UI.
- Never remove routes or app-only guards based only on appearance.
- Keep all buttons and animations accessible and functional; respect `prefers-reduced-motion`.
- Avoid heavy animation libraries unless existing CSS/Framer alternatives are justified by the measured need. Prefer transform/opacity motion and avoid layout thrashing.
- Avoid changing global Edura/AKBOY/campus shared tokens before checking cross-surface effects.
- Do not ship UI changes directly from the main production branch without preview, tests and rollback plan.
- Review repository secret hygiene separately: the root listing includes a `.env` file. Do not expose its content in logs or documentation. If credentials are committed, assess whether values are public client configuration or actual secrets; rotate any genuine secrets and remove them from version control as appropriate.

## 8. First implementation target

Start with an isolated design foundation and a prototype/refactor of the public homepage and candidate dashboard, not a rewrite of the entire app. Build a reusable interaction and motion layer, compare preview screenshots on desktop and Android-sized viewports, and test route/behavior parity before moving on to CBT.

## 9. Open audit items

The repository source audit does not itself establish:
- Exactly which components are active in current production for every route/device.
- Actual user analytics, conversion funnels or retention baselines.
- Animation performance on representative Android devices.
- Whether topic-level attempt data is reliable enough to drive recommendations.
- Current Supabase RLS/policies and payment correctness.
- Current live website behavior beyond source-based inspection.

Resolve these from production/browser testing, analytics and staging before feature commitments.

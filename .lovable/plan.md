# Mobile app cleanup, speed and polish

## 1. Firebase / push
Add the uploaded `google-services.json` to `android/app/` so native push registration works. Package name in the file (`com.edura.app`) matches the Android build, so no config change is needed. Sending still needs the `FIREBASE_SERVICE_ACCOUNT_JSON` secret before notifications can be delivered.

## 2. Home page cleanup
- Remove the "Discover" panel from the dashboard.
- Remove the "Your first steps" get-started guide.
- Remove the complimentary-access banner from the home screen. Best approach: surface access status as a small, dismissible entry in the notifications list plus a permanent line in Profile/Settings ("Complimentary access — expires 12 Sep"), so nothing occupies home screen space.

## 3. Theme
Default the app to light mode (`defaultTheme="light"`, system detection off). Theme choice remains switchable in Settings and persists per user.

## 4. Explore button
Restore the prominent Explore control: a full-width, clearly labelled button in the shell (large pill with icon + "Explore" label) instead of the current small centre tab, both on the tab bar and where it appears in-page.

## 5. CBT page
Remove the two dead cards ("Quick practice" and "Full mock"). The recommended action card stays but will point at a real flow (opens the practice scheduler rather than the study hub).

## 6. AI Tutor page
It looks embedded because the page renders its own bordered chat frame inside `AppShell`. Rebuild it as a true full-height screen: no nested border/rounded container, header merged into the shell header, message list and composer filling the viewport with safe-area padding.

## 7. Icons
- Delete the floating AI Tutor button app-wide (AI Tutor stays reachable from navigation/Explore).
- Replace letter/placeholder tiles (JAMB "J", WAEC "W", NECO "N", Post-UTME "P" and similar) with real Lucide icons across CBT, Explore and dashboard tiles.

## 8. Student Forum redesign
Rebuild the forum screen: sticky search + category filter chips, compact post rows with author avatar, title, snippet, reply count, votes and relative time, clear empty state, and a floating "New post" action. Consistent with the app card system, no gradients.

## 9. Challenge Arena
Audit end-to-end (list → join → play → results) and complete anything unfinished: challenge state handling, entry/leave, live scoring, results screen and empty/error states.

## 10. Ranking fix
Confirmed cause: the leaderboard functions require at least 3 completed tests before a student is ranked, so most users see rank 0 / "unranked". The rank function also counts suspended users while the board excludes them, so positions can disagree.
Fix via migration: rank from the first completed test, exclude suspended users in both functions, and keep the board and personal rank consistent. UI shows the real position plus tests completed.

## 11. Load speed (target 1-2s)
- Cut the mobile splash hold (currently a fixed 1.3s timer) to fire as soon as the app is ready.
- Preload the first screen's chunk and avoid the double loading state between splash → auth → dashboard.
- Defer non-critical dashboard queries (stats, streaks, news) and render skeletons immediately instead of blocking.
- Split heavy vendor chunks (PDF reader, charts, admin portal) out of the initial bundle and prefetch on idle.
- Cache dashboard data in React Query with `staleTime` so returning to home is instant.

## Technical notes
- Files touched: `src/App.tsx`, `src/pages/Dashboard.tsx`, `src/pages/CBTHome.tsx`, `src/pages/AITutor.tsx`, `src/pages/Forum.tsx`, `src/pages/ChallengeArena.tsx`, `src/pages/Leaderboard.tsx`, `src/pages/MobileSplash.tsx`, `src/components/edura/AppShell.tsx`, `src/components/edura/ExploreSheet.tsx`, `src/components/AIAssistant.tsx` (deleted), `src/components/dashboard/FreeAccessBanner.tsx` (deleted), `vite.config.ts`, `android/app/google-services.json`.
- One database migration replaces `get_leaderboard` and `get_my_leaderboard_rank`.

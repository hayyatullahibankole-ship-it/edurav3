# Edura Mobile Experience Redesign

## Goal
Make every student-facing section immediately understandable, fast, and consistent while preserving existing features and stage-based routing. The selected direction is **Action-centric Candidate Home**, extended into one coherent mobile system for both candidates and campus students.

## Locked design direction
- **Brand palette:** Edura Green `#12B76A`, Deep Ink `#0B1520`, warm-neutral canvas `#F6F8F7`, white surfaces; amber only for achievements, blue only for learning information, red only for errors. No gradients.
- **Typography:** Sora for headings, scores, and key numbers; Manrope for body and controls.
- **Structure:** one obvious next action above the fold, compact tools grouped by user intent, visible progress, and stable bottom navigation.
- **Interaction:** 44px minimum targets, short spring press feedback, subtle page entry, skeleton loading, reduced-motion support, and safe-area spacing.

## What will change

### 1. Shared app shell and navigation
- Redesign the mobile header around profile identity, current workspace, notifications, and a compact streak/progress signal.
- Replace the oversized floating navigation treatment with a stable, edge-to-edge native tab bar that does not cover page content.
- Keep candidate navigation as **Home, CBT, Explore, Services, Wallet**.
- Keep campus navigation as **Home, Academics, AI, Projects, More**; place Career, Logbook, NYSC, Opportunities, Tools, Wallet, Settings, and Logout in a clearly grouped More sheet.
- Add consistent back navigation and contextual titles to secondary pages so users always know where they are.

### 2. Candidate home
- Match the selected prototype: greeting/profile header, compact streak indicator, Deep Ink “next action” card, and one clear green CTA.
- Use real activity to show **Continue practice** when available; otherwise show **Start a quick practice**.
- Replace the long mixed dashboard with four concise tool cards: Exam Prep, Study Decks, AI Tutor, and Services.
- Keep progress metrics compact and secondary; move occasional items such as access codes, referrals, news, and ebook discovery into Explore.
- Keep “I’ve been admitted” visible as a clear account-upgrade row without competing with daily study actions.
- Simplify the first-run guide into a short contextual checklist rather than another large dashboard section.

### 3. CBT workspace
- Lead with **Quick practice** and **Full mock** instead of making students interpret all exam cards first.
- Keep exam type and subject selection in a simple progressive flow with plain-language explanations.
- Show recent result, weakest subject, and recommended next action before aggregate statistics.
- Group Study Hub, Study Decks, Past Questions, Challenge, Forum, AI Tutor, and Leaderboard under a compact Practice Tools section.
- Standardize empty, loading, unavailable-on-browser, and retry states.

### 4. Services and wallet
- Services opens with two clear modes: **Browse services** and **My requests**, with live status counts and a concise explanation of the payment-first workflow.
- Reduce card density, expose price/turnaround/status consistently, and keep filters in a horizontal mobile rail.
- Make payment and details entry a visible step flow: Service → Payment → Details → Tracking.
- Wallet uses a balance-first hierarchy, makes bank transfer/account generation the primary funding path, and presents transactions as compact readable rows.
- Retain native billing restrictions and current payment logic; this is a presentation/workflow redesign only.

### 5. Campus experience
- Apply the same action-centric structure to Campus Home: next lecture/task/project milestone first, then Courses, AI Companion, Projects, and Career tools.
- Replace the current long equal-weight bento with grouped sections: **Today**, **Study**, **Build**, and **Career**.
- Surface context-specific actions from real data: add first course, continue a project milestone, explain a course topic, polish a logbook entry, or continue a CV.
- Standardize Campus Academics, AI Companion, Projects, Tools, Opportunities, Career, Logbook, and NYSC pages with the shared header, section hierarchy, buttons, loading states, and empty states.

### 6. Onboarding and guidance
- Keep the visual onboarding concise, but make the final journey choice directly explain which workspace the student will receive.
- After sign-in, show a lightweight first-session walkthrough anchored to the real bottom tabs and primary action; never re-open it after dismissal.
- Use student language throughout: task-first labels, short descriptions, and clear outcomes instead of internal feature names.

### 7. Design system and reusable components
- Align semantic tokens to the locked palette in light and dark mode; remove inconsistent one-off mobile colors and decorative gradients.
- Create shared mobile primitives for page headers, primary-action cards, tool tiles, progress summaries, section headings, status rows, empty/error states, and mobile sheets.
- Replace raw mobile buttons in touched screens with the existing Button component and ensure icons have accessible labels/tooltips where needed.
- Preserve desktop behavior and Akboy branding; changes are scoped to authenticated Edura student surfaces and mobile onboarding.

## Validation
- Verify candidate and campus routes at small Android and iPhone widths with no overlap or horizontal scrolling.
- Walk through first launch, sign-in return, candidate home → CBT, services purchase flow, wallet funding, profile/settings, and campus home → academics/AI/projects.
- Confirm stage routing remains correct, bottom navigation stays consistent, back behavior works, loading/empty/error states are visible, and all tap targets are reachable.
- Check reduced motion, dark mode contrast, dynamic text wrapping, and current build/runtime diagnostics.

## Technical notes
- Frontend-only redesign; no database or business-rule changes.
- Existing hooks, live data, payment controls, academic-stage routing, and security behavior remain authoritative.
- Implement incrementally through shared primitives first, then shell/home, core workspaces, campus pages, and final responsive QA.

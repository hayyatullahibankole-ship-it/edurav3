# Play Store announcement banner on the Edura homepage

## Goal
Make it obvious to every visitor that the Edura app is now live on Google Play, and get Android users into the store listing in one tap.

## Current state (verified)
- The Edura homepage is `src/pages/Home.tsx`, rendered inside `Layout` (which shows the Navbar) at route `/` on edura.com.ng.
- The Play Store link already lives in `src/pages/InstallApp.tsx` (`PLAY_STORE_URL` = com.akboy.edura listing) with device detection (Android / iPhone / desktop).
- A small bottom-corner popup (`AppDownloadPopup`) exists, but nothing on the page itself announces "now on Google Play".
- The existing "Edura app" section near the bottom of the homepage still says *"No app store account needed"* — outdated now that we're on the Play Store.

## Changes

### 1. New `PlayStoreBanner` component (`src/components/PlayStoreBanner.tsx`)
- Slim announcement strip rendered at the very top of the homepage, directly above the hero.
- Copy: **"Edura is now on Google Play"** with a short supporting line (offline CBT, instant PINs, your wallet — in your pocket) and a prominent **"Get it on Google Play"** button.
- Device-aware, reusing the same platform detection pattern as InstallApp:
  - Android → button opens the Play Store listing directly.
  - iPhone / desktop → button goes to `/install-app` (which already walks iPhone users through Add to Home Screen).
- Dismissible with an X; dismissal stored in localStorage and the banner stays hidden for 7 days, then shows again.
- Hidden entirely inside the installed app / native wrapper.
- Styled with the existing design tokens (deep-ink strip, Edura green accents, flat — no gradients), consistent with the homepage.

### 2. Homepage copy refresh in `src/pages/Home.tsx`
- Render the new banner at the top of the page.
- Update the bottom "Edura app" section: replace *"No app store account needed"* with Play Store messaging, and make its button go straight to the Play Store on Android (falls back to `/install-app` elsewhere) — same device-aware behavior as the banner.

## Out of scope
- Akboy pages (akboy.space) untouched — this banner is Edura-only.
- No changes to the popup, install page, or routing.

## Verification
- Production build passes (`tsgo` clean, no build errors).
- Playwright check at `http://localhost:8080/`: banner visible at top, Android user-agent tap opens the Play Store URL, dismiss X hides it, no horizontal overflow on mobile viewport.

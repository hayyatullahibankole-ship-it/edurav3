# Remove Add Admin button + Play Store launch & iPhone plan

## 1. Remove the "Add Admin Account" button

- Remove the "+ Add Admin Account" button and the `AddAdminModal` from the admin login page (`src/pages/AdminLogin.tsx`). This closes a public path that invited strangers to try creating admin accounts.
- Admin management continues from inside the admin dashboard (User Management), where only existing admins can grant the admin role — that stays as the only way in.
- Keep the secure `create-admin` edge function on the server as an emergency recovery path (it requires the secret creation token), but nothing in the app will link to it. `AddAdminModal.tsx` gets deleted since nothing else uses it.

## 2. Play Store link on the Get the App page

- Add a proper "Get it on Google Play" button to the install page (`src/pages/InstallApp.tsx`) once you share the link. Android visitors will see the Play Store button as the primary action; the browser-install option remains as a fallback.
- Replace the "Google Play listing coming soon" note with the live store link.
- I can add the link the moment you paste it, or leave a clearly marked placeholder you confirm before publish.

## 3. iPhone users (no App Store yet)

The app already works on iPhones through the browser, installed to the home screen (PWA) — full-screen, app icon, offline caching, push-free but otherwise the same experience:

- The install page already detects iPhone and shows the correct steps (Share → Add to Home Screen). I'll polish this section: clearer 3-step visual guide and a note that it's the full app, not a cut-down version.
- When iPhone users open the app link on Safari, they'll be guided to install it; once "installed" it behaves like a native app (own icon, no browser bars).
- Known iPhone limitation to be transparent about: push notifications are limited on iOS PWA (iOS 16.4+ supports them; the app already handles this gracefully — no breakage, just fewer reminders).
- Longer-term option (not in this change): an App Store build later using the same Capacitor setup we use for Android. Say the word when you want to pursue it — it needs an Apple Developer account ($99/yr).

## Technical notes

- `src/pages/AdminLogin.tsx`: drop import, state, button block, and modal render.
- Delete `src/components/AddAdminModal.tsx` after confirming no other imports.
- `src/pages/InstallApp.tsx`: platform-aware primary button (Play Store on Android, home-screen guide on iOS), updated copy.
- No database or permission changes required.

## After the changes

- Admin login page shows only the sign-in form.
- Android users get the Play Store button; iPhone users get the home-screen install guide.

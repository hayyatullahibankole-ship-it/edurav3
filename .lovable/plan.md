# Branded, device-aware Edura install page

## Goal
Turn the install page into a polished Edura app showcase with one primary action that automatically gives each visitor the correct installation path.

## Experience
- Lead with Edura’s logo, green brand system, a clear “Get Edura” message, and an app preview using the existing dashboard artwork.
- Present the Play Store release as the primary Android experience, including recognizable Google Play treatment, app benefits, trust details, and what students get after installing.
- Keep a clearly labeled iPhone section visible to everyone, explaining that the App Store version is not yet available and that the full Edura web app can be added to the Home Screen.
- Replace the current generic card-heavy presentation with a focused mobile-app storefront layout, without gradients.

## Smart install action
- Detect Android, iPhone/iPad, desktop, and already-installed app states.
- Android: the main button opens the live Google Play listing directly.
- iPhone/iPad: the main button opens a concise guided installation panel for Safari: Share → Add to Home Screen → Add.
- Supported desktop/mobile browsers: use the browser’s native install prompt when available; otherwise show the relevant manual steps.
- Already installed: replace installation actions with a clear “App installed” state and an “Open Edura” action.
- Desktop: show both Android and iPhone options rather than pretending one device path applies.

## iPhone guidance
- Add a dedicated, prominent iPhone section with visual step numbers and familiar Share/Add icons.
- Explain that Apple does not allow websites to trigger the iPhone installation confirmation directly; the button will reveal the shortest Safari process instead.
- Detect non-Safari iPhone browsers and tell the user to open the page in Safari before following the steps.

## Quality checks
- Keep all actions accessible, keyboard-friendly, and built from the existing design controls.
- Verify Android, iPhone, desktop, and installed-state layouts at mobile and desktop sizes.
- Confirm the Play Store link, install event handling, no horizontal overflow, and no console or build errors.

## Technical details
- Update only the install-page presentation and device/install-state behavior.
- Reuse the existing Edura logo, dashboard preview, Play Store URL, PWA manifest, and semantic color tokens.
- Preserve all existing routes and app-install entry points.

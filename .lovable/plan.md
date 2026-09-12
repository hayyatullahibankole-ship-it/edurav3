# Fix Play Console warnings for the Android app

Play Console flagged four items on release 5 (1.0.2). All four are fixable in the Android project plus small app-side tweaks, then a new version must be uploaded.

## 1. Edge-to-edge display (Android 15+)

- Make the app draw behind the system bars and let the web content handle insets.
- Add a small Android theme setup so the status/navigation bars are transparent and the system no longer needs the deprecated colour APIs.
- In the app itself, tell the status bar plugin to overlay the web view instead of setting a background colour, and keep the top/bottom safe-area padding the app already uses so nothing sits under the clock or the gesture bar.

## 2. Deprecated status bar colour APIs

- Stop calling "set status bar background colour" anywhere in the app (currently done in the main layout, the native wrapper, and the splash screen) and remove the colour setting from the Capacitor config.
- Keep only the light/dark icon style call, which is not deprecated.
- The transparent-bar theme from item 1 covers the visual result, so the header area still looks green because the page content paints it.

## 3. Orientation restriction on large screens

- Remove the portrait lock from the app's main screen so tablets and foldables can rotate.
- Review the exam console and main screens at landscape/tablet widths, since those were designed for a portrait phone. The exam console already uses a responsive layout; any landscape spacing issues found get adjusted.

## 4. R8 optimization

- Turn on code shrinking and resource shrinking for release builds.
- Add keep rules for Capacitor bridge classes, plugins and any JavaScript interfaces so nothing breaks when the code is shrunk.

## 5. Version bump

- Android versionCode 5 -> 6, versionName 1.0.2 -> 1.0.3, with the package version kept in sync.

## Technical notes

- `android/app/src/main/AndroidManifest.xml`: drop `android:screenOrientation="portrait"`.
- `android/app/src/main/res/values/styles.xml`: add transparent `statusBarColor`/`navigationBarColor` and `windowLayoutInDisplayCutoutMode shortEdges` on `AppTheme.NoActionBar`; add a `values-v35` variant if needed.
- `android/app/build.gradle`: `minifyEnabled true`, `shrinkResources true` for release; `versionCode 6`, `versionName "1.0.2"` -> `"1.0.3"`.
- `android/app/proguard-rules.pro`: keep rules for `com.getcapacitor.**`, `@CapacitorPlugin` classes, `JavascriptInterface` members, and the app package.
- Web side: `StatusBar.setOverlaysWebView({ overlay: true })` plus `setStyle` only; remove `setBackgroundColor` calls in `src/components/Layout.tsx`, `src/components/NativeAppWrapper.tsx`, `src/pages/MobileSplash.tsx`, and the `StatusBar.backgroundColor` key in `capacitor.config.ts`.
- Safe-area padding already exists (`pt-safe`, `pb-safe`, `NativeAppWrapper` env insets); verify the mobile tab bar and exam console bottom bars use it.

## After the changes

You will need to pull the project, run the native sync, build a fresh release bundle and upload it as version 6 (1.0.3) to Play Console.

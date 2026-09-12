# Remove photo/video permissions for Play Console

Play Console flagged the app for requesting broad photo and video permissions. The app never needs them: every image/PDF upload (profile picture, events, ebooks, question diagrams, portfolio) goes through the standard file chooser in the web view, which already uses Android's own system picker and requires no permission.

## Changes

1. Remove the three storage permissions from the Android manifest:
   - `READ_MEDIA_IMAGES`
   - `READ_MEDIA_VIDEO`
   - `READ_EXTERNAL_STORAGE` (the legacy one, also part of the same policy area)
2. Bump the app version so a new build can be uploaded: versionCode 6 -> 7, versionName 1.0.3 -> 1.0.4, kept in sync with the package version.

Camera and microphone permissions stay, since exam proctoring genuinely needs live capture.

## Technical notes

- `android/app/src/main/AndroidManifest.xml`: delete the three `uses-permission` lines.
- `android/app/build.gradle`: `versionCode 7`, `versionName "1.0.4"`.
- `package.json`: `"version": "1.0.4"`.
- No app code changes: uploads already use `<input type="file">`, no Capacitor Camera/Filesystem plugin is installed.

## After the changes

Pull the project, run the native sync, build a fresh release bundle, and upload it as version 7 (1.0.4).

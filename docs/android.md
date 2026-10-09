# GameBox — Android APK / AAB build guide

GameBox is a fully offline-capable PWA. The Android release path is **Capacitor**
(the standard, supported way to wrap a web app into a real APK/AAB).

> ✅ **Status (updated):** a signed **debug APK was built successfully**
> (`GameBox-debug-v1.0.0.apk`, package `com.gamebox.app`, targetSdk 34, ~4.8 MB,
> verified with `apksigner`). The sandbox had no JDK/Android SDK preinstalled,
> so they were downloaded during the build (Temurin JDK 17 + cmdline-tools +
> platform 34 + build-tools 34). `android/` is gitignored — regenerate it with
> `npm run android:add` (or see the steps below) to rebuild anywhere.

## What is already configured

- `capacitor.config.json` — appId `com.gamebox.app`, name `GameBox`, dark background
- `manifest.webmanifest` — app name, icons, standalone display, portrait
- `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon.svg`
- `scripts/copy-web.js` — copies the web app into `www/` for the native wrapper
- `assets/logo.png` — source icon used by `@capacitor/assets generate` to produce
  the Android launcher icons and the extra PWA icons in `icons/`

## Regenerating the launcher icons

`npx @capacitor/assets generate --iconBackgroundColor '#0b1020'` reads
`assets/logo.png` and writes all Android mipmaps (after `npm run android:add`)
plus PWA webp icons. Re-run it whenever the app icon changes, then rebuild.

## Build an APK (debug)

```bash
npm install                      # installs Capacitor (dev-only, listed in package.json)
npm run android:add              # copies web app + creates android/ project
npm run android:apk              # gradle assembleDebug → android/app/build/outputs/apk/debug/
```

Install on a phone: `adb install android/app/build/outputs/apk/debug/app-debug.apk`
or copy the APK to the phone and open it.

## Build a release AAB (Play Store)

```bash
cd android
./gradlew bundleRelease
# sign it:
jarsigner -keystore YOUR_KEYSTORE app-release.aab gamebox
```

You must create your own signing keystore first:
`keytool -genkey -v -keystore gamebox.keystore -alias gamebox -keyalg RSA -keysize 2048 -validity 10000`

## Requirements

- Node.js 18+
- JDK 17
- Android SDK (Android Studio, or `sdkmanager` command line) with platform 34
- `ANDROID_HOME` / `ANDROID_SDK_ROOT` env vars set

## Troubleshooting

- If the Gradle wrapper download fails with `SSLHandshakeException` (some proxies
  break Java TLS), download `gradle-8.2.1-bin.zip` manually from
  services.gradle.org, unzip it, and run `gradle assembleDebug` directly from
  `android/` instead of `./gradlew`.

## QR scanner note

The QR scanner uses the browser's `BarcodeDetector` API. In the Capacitor
WebView this works on Android 10+ with Google Play services; if unavailable the
tool shows an honest "not available on this device" message instead of failing
silently. Camera permission is requested at runtime.

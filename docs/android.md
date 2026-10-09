# GameBox — Android APK / AAB build guide

GameBox is a fully offline-capable PWA. The Android release path is **Capacitor**
(the standard, supported way to wrap a web app into a real APK/AAB).

> ⚠️ Honest note: an APK **cannot be compiled inside this sandbox** — building an
> APK requires the Android SDK + JDK (about 2 GB), which are not installed here.
> The project is fully wired for Capacitor, so on any machine with Android
> Studio (or just JDK 17 + Android SDK) the build is 4 commands, below.

## What is already configured

- `capacitor.config.json` — appId `com.gamebox.app`, name `GameBox`, dark background
- `manifest.webmanifest` — app name, icons, standalone display, portrait
- `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon.svg`
- `scripts/copy-web.js` — copies the web app into `www/` for the native wrapper

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

## QR scanner note

The QR scanner uses the browser's `BarcodeDetector` API. In the Capacitor
WebView this works on Android 10+ with Google Play services; if unavailable the
tool shows an honest "not available on this device" message instead of failing
silently. Camera permission is requested at runtime.

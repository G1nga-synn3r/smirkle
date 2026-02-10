# Android APK Setup (Capacitor)

This guide explains how to produce a signed Android APK for Smirkle using Capacitor while keeping the web app deployment intact.

Prerequisites
- Node.js 18+
- npm
- Android Studio (with SDKs)
- Java JDK (11+)
- Android platform tools (adb)

1) Install Capacitor packages
```bash
npm install @capacitor/core --save
npm install -D @capacitor/cli
```

2) Initialize Capacitor (if you haven't already)
```bash
# This will create capacitor.config.json (we include a template)
npm run cap:init
```

3) Build web assets and copy to Android
```bash
npm run build
npm run cap:copy
```

4) Add the Android platform
```bash
npm run cap:add:android
```

5) Open Android project in Android Studio
```bash
npm run cap:open:android
```

From Android Studio: Run → Select device → Run. Grant camera permission when requested.

6) Create a signing keystore (example, run in PowerShell)
```powershell
keytool -genkey -v -keystore C:\path\to\smirkle-release.jks -alias smirkle_key -keyalg RSA -keysize 2048 -validity 10000
```

7) Generate signed APK or AAB
- In Android Studio: Build → Generate Signed Bundle / APK → follow the GUI and provide keystore
- Or CLI:
```bash
cd android
# Windows
./gradlew assembleRelease
# or bundle
./gradlew bundleRelease
```

APK output (example): `android/app/build/outputs/apk/release/app-release.apk`

8) Install APK on device
```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

Notes & tips
- Camera/getUserMedia: Capacitor's WebView generally supports camera access on modern Android, but always test on target devices. If you experience issues, consider using a TWA wrapper instead (see below).
- To update the native project after web changes: `npm run build && npm run cap:copy` then rebuild in Android Studio.
- For Play Store: prefer `bundleRelease` (AAB) and follow Play Store guidelines.

Optional: Trusted Web Activity (TWA)
- If you'd rather wrap the hosted web app (no assets packaged), use Bubblewrap. TWA uses Chrome as runtime and often has fewer WebView compatibility issues for modern web APIs like getUserMedia.

If you want, I can run the initial `npm`/Capacitor scaffolding edits in the repo (package.json updated already). Tell me if you want me to continue by initializing Capacitor files or if you prefer to run the commands locally and I guide you.
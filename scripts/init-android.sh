#!/usr/bin/env bash
set -euo pipefail

echo "1/6 Installing Capacitor packages..."
npm install @capacitor/core
npm install -D @capacitor/cli

echo "2/6 Initializing Capacitor (creates capacitor.config.json if missing)..."
npx cap init smirkle com.example.smirkle --web-dir=dist || true

echo "3/6 Building web assets..."
npm run build

echo "4/6 Adding Android platform (this creates the 'android' folder)..."
npx cap add android || true

echo "5/6 Copying web assets into native project..."
npx cap copy android

echo "6/6 Opening the Android project in Android Studio..."
npx cap open android || echo "Open android/ in Android Studio manually."

echo "Done. Use Android Studio to generate signed APK/AAB."

echo "Example keystore command (run separately):"
echo "keytool -genkey -v -keystore /path/to/smirkle-release.jks -alias smirkle_key -keyalg RSA -keysize 2048 -validity 10000"

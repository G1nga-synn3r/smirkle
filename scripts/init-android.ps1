# PowerShell helper: Initialize Capacitor Android project for Windows
# Run from repository root: powershell -ExecutionPolicy Bypass -File .\scripts\init-android.ps1

Write-Host "1/6 Installing Capacitor packages (may ask for confirmation)..."
npm install @capacitor/core
npm install -D @capacitor/cli

Write-Host "2/6 Initializing Capacitor (creates capacitor.config.json if missing)..."
# If you already ran npm run cap:init, skip this. The script will still work.
npx cap init smirkle com.example.smirkle --web-dir=dist

Write-Host "3/6 Building web assets..."
npm run build

Write-Host "4/6 Adding Android platform (this creates the 'android' folder)..."
npx cap add android

Write-Host "5/6 Copying web assets into native project..."
npx cap copy android

Write-Host "6/6 Opening the Android project in Android Studio..."
npx cap open android

Write-Host "Done. In Android Studio: Build -> Generate Signed Bundle / APK to create a signed APK or AAB."

Write-Host "Helpful keystore command (run separately):"
Write-Host "keytool -genkey -v -keystore C:\path\to\smirkle-release.jks -alias smirkle_key -keyalg RSA -keysize 2048 -validity 10000"

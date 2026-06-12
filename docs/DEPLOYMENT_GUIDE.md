# Deployment Guide

## Web (GitHub Pages)

Push to `main` triggers `deploy-web.yml` which builds the `dist/` bundle and deploys to GitHub Pages.

Manual deploy:
```bash
npm run build
npx gh-pages -d dist
```

## Android APK

Push a tag matching `v*` triggers `build-apk.yml` which builds `app-debug.apk` and creates a GitHub Release.

Local build:
```bash
npm run build && npx cap sync android
cd android && ./gradlew assembleDebug
# APK → android/app/build/outputs/apk/debug/app-debug.apk
```

## iOS

Push a tag matching `v*` triggers `build-ios.yml` (macOS runner only). Produces unsigned IPA.

Local build:
```bash
npm run build && npx cap sync ios && npx cap open ios
```

## Prerequisites

- Node.js >= 22, npm >= 9
- Android SDK 36, JDK 21+ (for APK)
- Xcode 16+ (for iOS)
- Firebase project with RTDB and Anonymous Auth enabled

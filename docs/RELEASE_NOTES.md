# Release Notes — v2.3.0

**Release Date:** 2026-06-12

## ✨ New Features

- **Update modal** — Detects install type (PWA / Android / web), shows contextual update instructions, supports dismiss/skip with persistence, rechecks hourly
- **PWA foundation** — `manifest.json`, service worker (network-first caching), SVG icon for Add-to-Home-Screen
- **Leaderboard rewrite** — Loading skeleton UI, player stats bar, offline indicator, refresh timestamp, friend star badges

## 🔧 Improvements

- Leaderboard friend filtering now uses Firebase friends list instead of hardcoded names
- Firebase DB rules fix: period validation now accepts `'all'` to match client code
- Score submission optimized: only submits on new personal best (reduces Firebase writes)
- ESLint: React version auto-detection, service worker excluded from lint
- Android `versionCode` / `versionName` synced to 2.3.0

## 🐛 Bug Fixes

- Fixed `useAudio` hook exhaustive-deps warning (lint clean: 0 errors, 0 warnings)
- Fixed SECURITY.md git merge artifact (`>>>>>>>` marker)
- Fixed RELEASE_GUIDE.md referencing Windows-specific paths
- Fixed Android `versionCode` being out of sync (was 4/2.0.0, now 23/2.3.0)

## 📋 Quality

- **TypeScript:** 0 errors
- **ESLint:** 0 errors, 0 warnings
- **Tests:** 92/92 passing
- **Build:** Successful (single-file HTML, 718KB / 195KB gzip)
- **Coverage:** 83.5% statements, 69.6% branches, 90.2% functions, 88.3% lines
- **Dependencies:** 0 vulnerabilities (npm audit)
- **CodeQL:** Configured for JavaScript/TypeScript, Java/Kotlin, GitHub Actions

## ⚠️ Known Limitations

- Firebase chat has no rate-limiting beyond message length (500 chars)
- No cloud save conflict resolution UI (local save always wins)
- iOS builds are unsigned (no Apple Developer signing in CI)
- Android APK is debug-signed (not Play Store ready without signing config)

## 📦 Assets

| Asset | Description |
|-------|-------------|
| `app-debug.apk` | Android debug APK (sideload on any device) |
| `app-release-unsigned.apk` | Android release APK (unsigned, for custom signing) |
| iOS IPA / xcarchive | Unsigned iOS build for sideloading |

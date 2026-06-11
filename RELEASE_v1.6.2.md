# 🌿 KushCloud v1.6.2 — Player Naming & Leaderboard Integrity Update

**Release Date:** 11 June 2026  
**Version:** 1.6.2  
**Version Code:** 2  
**APK Size (Debug):** ~4.1 MB  
**APK Size (Release):** ~3.1 MB  

---

## Overview

v1.6.2 is a quality-of-life and integrity-focused release addressing the most impactful community feedback. The player naming system has been completely revamped to give users full control over their identity, while the leaderboard and run processing systems have been hardened against score anomalies and data corruption.

This release lays essential groundwork for the upcoming competitive features planned in the Road to V2.

---

## ✅ Bug Fixes

- **Player naming no longer overrides user input** — The system no longer auto-generates a new name before the user finishes typing. Users can now freely edit, backspace, and select every character including the first one.
- **Leaderboard score glitch resolved** — Fixed a race condition where scores could be submitted with incorrect or stale data following quick restarts.
- **Duplicate leaderboard entries eliminated** — Scores are now deduplicated server-side; no more duplicate entries from rapid restarts or reconnections.
- **Blank screen crash (regression guard)** — Additional null-safety checks prevent the rare circular dependency crash that affected some users.
- **Score validation on practice mode exit** — Practice runs can no longer accidentally trigger score submissions.

---

## 🎮 Gameplay Improvements

- **Run processing pipeline** — A new dedicated run processing module (`runProcessing.ts`) separates game logic from UI, improving maintainability and preventing state corruption during high-speed play.
- **Leaderboard model refactored** — Standalone `leaderboardModel.ts` with unit tests ensures consistent score ranking calculations across daily, weekly, and all-time boards.
- **Run deduplication** — Each run now carries a unique `runId`. Duplicate processing of the same run is prevented at the engine level.
- **Save data migration extended** — The save system now handles `processedRunIds` for future-proofing. Existing saves are migrated silently on first load.

---

## 🛠 Technical Improvements

- **Modular refactoring** — Core game logic extracted from `App.tsx` into dedicated modules:
  - `src/game/runProcessing.ts` — Run completion, XP/coin rewards, level-ups, achievements, missions
  - `src/game/leaderboardModel.ts` — Scoring model with unit test coverage
- **Test coverage** — Added 6 unit tests across 2 new test files covering run processing and leaderboard model logic. All tests pass.
- **Capacitor sync fixes** — Android build now works without requiring Node.js 22; Gradle build manual sync path documented.
- **Build system** — APK build verified with Gradle 8.14.3, Android SDK 36, JDK 21+.

---

## ⚡ Performance Optimizations

- Reduced unnecessary re-renders in the `Profile` screen when editing the player name.
- Leaderboard queries now batch submissions to minimise Firebase writes.
- Run validation moved earlier in the processing pipeline to skip unnecessary work for invalid runs.

---

## 🛡 Stability Enhancements

- Added global error boundary in `App.tsx` to catch and display unhandled exceptions gracefully.
- Run validation now checks for `processedRunIds` before accepting results, preventing double-counting.
- Cloud sync conflict resolution improved — the save with more XP is always preferred.
- Enhanced save data migration (version 4) with forward-compatible field initialization.

---

## 📦 Installation

### Android APK
1. Download `KushCloud-v1.6.2-debug.apk` from the [GitHub Releases page](https://github.com/LIN4CRE/KushCloud/releases/latest)
2. Open the APK on your Android device
3. Tap "Install anyway" if prompted about unknown sources
4. Play instantly — no account required

### Web Browser
Open **https://lin4cre.github.io/KushCloud/** in any modern browser.

---

## 📋 Changelog (v1.6.1 → v1.6.2)

```
Added:
- src/game/runProcessing.ts — Dedicated run processing module with test coverage
- src/game/leaderboardModel.ts — Standalone leaderboard model with unit tests
- src/game/runProcessing.test.ts — 3 test cases
- src/game/leaderboardModel.test.ts — 3 test cases

Fixed:
- Player name auto-generation no longer overwrites user input
- Leaderboard score glitch on quick restart resolved
- Duplicate leaderboard entries eliminated
- Run deduplication via unique runId
- Save data migration to version 4

Changed:
- Core game logic extracted from App.tsx into dedicated modules
- Profile screen performance optimizations
- Cloud sync conflict resolution improved
- Android version code bumped to 2, version name 1.6.2
```

---

## 🔮 Known Issues

- Release APK is unsigned — a signing key is required for Google Play Store distribution
- Firebase leaderboard requires internet connectivity; scores are stored locally when offline and synced when reconnected
- Capacitor CLI requires Node.js 22+; for local builds, manually copy `dist/` to `android/app/src/main/assets/public/` and run Gradle directly

---

## 🧪 Testing Summary

| Test Area | Status |
|---|---|
| Unit tests (6 total) | ✅ All passed |
| Player naming edge cases (empty, min, max, special chars, backspace, rapid input) | ✅ Verified |
| Android debug APK build | ✅ Build successful |
| Android release (unsigned) APK build | ✅ Build successful |
| Web build (Vite single-file bundle) | ✅ Build successful |
| Save migration v3 → v4 | ✅ Verified |
| Run deduplication | ✅ Verified |
| Cloud sync conflict resolution | ✅ Verified |

---

## 🙏 Credits

Built with ❤️ by Linacre. Special thanks to all testers and community members who reported the naming and leaderboard issues.

---

**[Download APK](https://github.com/LIN4CRE/KushCloud/releases/latest)** · **[Play in Browser](https://lin4cre.github.io/KushCloud/)** · **[Report Issue](https://github.com/LIN4CRE/KushCloud/issues)**
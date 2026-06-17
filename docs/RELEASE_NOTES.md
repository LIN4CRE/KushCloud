# Release Notes — v3.5.0

**Release Date:** 2026-06-17

## 🚀 Web-First Refactor

This release strips all server-dependent and native-platform features to focus on a clean, self-contained web experience.

### Removed
- **Firebase** — Auth, RTDB leaderboard, friends list, chat, cloud save sync
- **Capacitor** — Android/iOS native builds, `android/` directory
- **PWA** — Service worker, update checker, install prompt
- **Over-engineered features** — Achievements, missions, friends, badges, titles, effects, loot crates, seasonal events, tutorial, statistics, profile

### Changed
- **Leaderboard** — now localStorage-only, no submission network calls
- **SaveData** — simplified from ~40 fields to ~15
- **World type** — fixed to match engine expectations
- **Power-ups** — updated IDs and effect types; PICKUP_POOL now matches POWERUPS

### Quality

| Gate | Result |
|------|--------|
| TypeScript | ✅ 0 errors |
| Unit tests | ✅ **53/53** passing |
| Production build | ✅ Success |

### Versioning
- `package.json` → 3.5.0

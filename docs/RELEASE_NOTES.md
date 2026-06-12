# Release Notes — v2.6.0

**Release Date:** 2026-06-12

## 🚀 Major Updates

- **Merge complete:** Successfully merged v2.5.0 feature branch (FRENZY mode, clutch escapes, mid-run power-up pickups, revive system, podium badges) into main
- **Version bump:** 2.5.0 → 2.6.0 across all configuration files

## 🐛 Bug Fixes

- **Critical:** Fixed pipe gap Y-position underflow that could spawn invisible gaps (`engine.ts:360`)
- **Critical:** Fixed collision detection using strict `<` instead of `<=` allowing pixel-perfect tangent clipping (`engine.ts:797`)
- **Fixed:** Silent save failures now log a warning and queue for retry (`storage.ts:174`)
- **Fixed:** Environment validation now guards against SSR crashes (`env.ts:9`)

## 🔒 Security & Stability

- Removed duplicate/unused Firebase imports reducing bundle overhead
- Added save retry queue for localStorage failures
- Version consistency enforced across all configs and Android manifest

## 🧪 Testing

- Added podium badge test suite (`data.test.ts`)
- All existing tests pass without modification

## 📦 Build

- Clean reproducible build verified
- Android versionCode 26, versionName 2.6.0
- All CI/CD pipelines functional

# Release Notes — v2.5.0

**Release Date:** 2026-06-12
**Type:** Feature release — new gameplay mechanics (fully backward-compatible)

This release adds three skill-and-reward mechanics designed to deepen the
moment-to-moment hook without changing the core "tap to fly" feel. **No save-format
changes** — existing players keep all progress and cosmetics.

## 🎮 New Gameplay Mechanics

### ⚡ Clutch escapes
Squeeze through a gap *much* tighter than a normal near-miss and you pull off a
**CLUTCH** — worth **triple points**, with a dramatic longer slow-mo, a tense
"whoosh" SFX, and screen shake. Clutches are counted live on the HUD, shown as a
stat on the Game Over screen, and award **bonus XP** (capped at your run score so
they can't be farmed).

### 🔥 FRENZY (streak gate)
Land **3 PERFECT passes in a row** to ignite **FRENZY**: every point you score is
**doubled for 6 seconds**. A warm pulsing vignette, a fanfare, and a HUD countdown
bar make the window unmistakable. Miss a perfect and the streak resets — risk vs.
reward.

### 🧲 Mid-run power-up pickups
Floating power-up tokens now drift across the screen during a run. Fly into one to
activate it instantly:
- 🧲 **Coin Magnet** — 2× coins
- ⏱️ **Slow Motion** — slows the world
- 🔄 **Coin Vacuum** — auto-collects nearby coins
- ⬆️ **Double Jump** — mid-air second flap

Tokens pulse so they read as collectable, play a bright pickup sound, and show a
quick HUD toast. (Shields remain a deliberate shop purchase.)

All three mechanics stack with the existing combo/multiplier system and fully
respect **reduced-motion** and **practice mode** (pickups don't spawn in practice).

## 🧪 Quality

| Gate | Result |
|------|--------|
| TypeScript | ✅ 0 errors |
| ESLint | ✅ 0 errors, 0 warnings |
| Unit tests | ✅ **148/148** passing |
| Production build | ✅ Success, warning-free (739 KB / 200 KB gzip) |
| `npm audit` (prod, high gate) | ✅ 0 vulnerabilities |

## 🔢 Versioning
- `package.json` → 2.5.0
- Android `versionCode` 25 / `versionName` 2.5.0

## ⚠️ Known Limitations (unchanged from 2.4.0)
- Anonymous-UID writes are not strictly owner-scoped (mitigated by integrity rules; full fix needs Firebase Anonymous Auth — see SECURITY.md).
- Chat has no per-user rate limiting.
- `engine.ts` remains without unit tests (DOM/canvas-coupled); new mechanics' pure scoring is covered via `runProcessing` tests.
- Mobile release artifacts are unsigned.

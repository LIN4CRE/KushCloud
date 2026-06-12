# Changelog

## 2.4.0 (2026-06-12)

### Security
- Hardened Firebase Realtime Database rules: monotonic `updatedAt` to prevent profile rollbacks, upper bounds on all numeric profile fields, monotonic `bestScore`, sane timestamp floors (`> 2020-01-01`), field allow-listing on `users`, self-add guard on `friends`, and explicit chat immutability.
- Documented the anonymous-UID threat model, residual risks, and the recommended Firebase Anonymous Auth migration in `docs/SECURITY.md`.

### Build & Tooling
- App version is now injected from `package.json` at build time (`VITE_APP_VERSION`), eliminating the hardcoded version in `src/config/env.ts` and the risk of version drift.
- Eliminated the `EMPTY_IMPORT_META` build warning via a scoped Rollup `onwarn` filter — production build is now warning-free.
- Added typed `import.meta.env` declarations in `src/vite-env.d.ts`.

### Testing
- Added 53 new unit tests (92 → 145 total): `PowerUpManager` (20), `toLeaderboardEntry`/`compareLeaderboardEntries` validation (22), and `updateChecker` install-type & dismiss/skip logic (11).
- Coverage config now uses `all: true` with an explicit include/exclude list so the reported coverage honestly reflects untested modules.

### CI/CD
- Added missing `permissions: contents: write` to the iOS build workflow so release-asset uploads succeed on tagged builds.

### Release
- Version bump to 2.4.0; Android `versionCode` 24 / `versionName` 2.4.0.

## 2.3.0 (2026-06-12)
- Update modal with install-type detection (PWA/Android/web), dismiss/skip persistence, hourly recheck
- PWA foundation: manifest.json, service worker (network-first), icon.svg
- Leaderboard rewrite: loading skeleton, player stats bar, offline indicator, refresh timestamp, friend stars
- Leaderboard friend filtering now uses Firebase friends list instead of hardcoded names
- Firebase DB rules fix: period validation accepts 'all' to match client code
- Score submission optimized: only submits on period change or new personal best
- TypeScript/lint/build/test (92/92) all clean
- Production-readiness audit: lint fixes, version sync, security hardening, documentation
- ESLint: React version auto-detection, service worker excluded, all warnings resolved
- Android versionCode/versionName synced to 2.3.0 (was 4/2.0.0)
- Capacitor: allowMixedContent disabled for production security
- SECURITY.md: removed git merge artifact, updated supported versions
- RELEASE_GUIDE.md: removed Windows-specific path references
- Added: ARCHITECTURE.md, GOVERNANCE.md, CODEOWNERS, RELEASE_NOTES.md, HEALTH_REPORT.md
- Added: .github/ISSUE_TEMPLATE/config.yml (blank issues disabled, security contact link)

## 2.2.0 (2026-06-12)
- Version visibility polish across all screens (Menu badge, Game Over watermark, Settings footer)
- Fix leaderboard offline fallback — seeded scores when Firebase unavailable
- Fix Menu layout — scrollable content + fixed bottom nav
- Fix localStorage crash in getUID()
- Unhandled promise rejection handler for crash resilience

## 2.1.0 (2026-06-11)
- Event mechanics: Combo Carnival (+5 XP per near-miss), Loot Fever (bonus crate rolls)
- Game Over focus trap, fallback summary for crash resilience
- Audio GC pressure fix (OscillatorNode/GainNode disconnect)
- Accessibility improvements (ARIA roles, focus management, NaN guard)
- Dead code elimination (16 files, -118 lines)
- CI pipeline passes: typecheck, lint (0 errors), build, 92/92 tests

## 2.0.0 (2026-06-10)
- App.tsx refactor — extracted hooks (useShopHandlers, useGameHandlers, useAudio)
- Fixed React error #299 (classicScript plugin)
- CSP updated with api.github.com
- ESLint no-explicit-any resolved (0 errors)
- rank fix, MAX_LEVEL safety cap (1000)
- 15 runProcessing tests
- GitHub Pages deployment, APK build

## 2.0.0-rc (2026-06-09)
- Production readiness audit
- Fixed die() bypass, double jump flap count, in-place particle removal
- Leaderboard subscribeFriends leak fix
- Hardcoded version, localStorage try/catch fixes

## 1.7.0 (2026-06-09)
- New shop, missions, achievements screens
- Practice mode, statistics dashboard
- Loot crate system with rarity tiers

## 1.6.x (2026-06-03)
- v1.6.4: Anti-cheat + performance optimizations
- v1.6.3: Login streak rewards, daily missions
- v1.6.2: Friend system, global chat
- v1.6.1: Bug fixes, leaderboard pagination
- v1.6.0: Social update — Firebase auth, leaderboards

## 1.5.0 (2026-05-28)
- Shop update — unlockable cosmetics
- Trail system, enhanced particles

## 1.4.0 (2026-05-20)
- Competitive update — combo multiplier, near-miss detection
- Canvas optimizations, audio synthesis

## 1.3.x (2026-05-15)
- Perfect pass detection, world progression
- Tailwind CSS migration

## 1.2.x (2026-05-10)
- Progressive difficulty, increased player test coverage
- v1.2.5: Mobile responsiveness

## 1.1.0 (2026-05-01)
- Audio overhaul — procedural Web Audio synthesis
- Performance improvements

## 1.0.0 (2026-01-17)
- Initial release — basic Flappy Bird clone with canvas

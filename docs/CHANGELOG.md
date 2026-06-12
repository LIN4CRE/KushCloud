# Changelog

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

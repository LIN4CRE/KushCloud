# Changelog

All notable changes to this project will be documented in this file.

## [4.5.0] - 2026-06-24
### Added
- Added Cloudflare Workers + D1 leaderboard backend (`cloudflare/leaderboard-worker.js`, `schema.sql`).
- Added Wrangler example config and setup docs.
- Added stable anonymous `playerId` saves so cloud rankings update one row per player.
- Added cloud/local leaderboard status, refresh, and manual best-score sync controls.

### Changed
- Leaderboard priority reversed: Cloudflare D1 API is now checked first; Firebase is the fallback.
- Leaderboard submissions now sync locally first, then cloud when `VITE_LEADERBOARD_API_URL` is configured.
- GitHub Pages builds can now inject `VITE_LEADERBOARD_API_URL` from repository variables.
- The app automatically falls back to localStorage if the cloud leaderboard is down or not configured.

### Removed
- Firebase is no longer the primary leaderboard path; it remains as a fallback for existing deployments.

## [4.4.0] - 2026-06-24
### Added
- Added banner-style glass bong obstacles with round chambers, green liquid, bubbles, angled stems, bowls, cork/detail rings, glowing highlights, and smoke wisps.
- Added collectible bong smoke clouds that award Red Eye Bonus with score, combo, coin, and rush-time rewards.
- Added Red Eye run tracking to the HUD and game-over summary.
- Added a pale red glazed Red Eye screen effect with subtle stoned wave lines after collecting smoke.

### Changed
- Replaced the plain rectangular pipe look with detailed bong rendering while preserving fair collision geometry.
- Bong smoke now acts as a skill target in the gap, making centered passes more rewarding and visually closer to the banner art.

## [4.3.0] - 2026-06-24
### Added
- Added six more power-ups: Focus Flow, Guardian Bubble, Super Magnet, Coin Rush, Dash Hop, and Open Sky.
- Added Open Sky gap-widening support and stronger rescue-hop mechanics.

### Changed
- Coins now spawn 20% more often.
- Mid-run power-up pickups now spawn about 20% more often and can include the expanded utility set.
- Slow Motion now slows obstacles and the rush clock while keeping the bird responsive with calmer gravity and boosted flap control.
- Ghost Hop/Dash Hop now provide finite boosted rescue hops with brief phasing instead of a pointless normal flap duplicate.
- Bong gaps now expand as speed pressure rises, preventing late-game speed from becoming mathematically unfair.
- Magnet pickup radius increased; Super Magnet provides a larger pull radius.

## [4.2.0] - 2026-06-23
### Added
- Daily Cloud Drop rewards with streak scaling to improve return-session goals.
- Two-slot power-up loadout system; owned power-ups now activate at the start of runs.
- Pause/resume support with keyboard shortcuts and a clearer in-run HUD.
- Rush timer display with time rewards for normal, perfect, near-miss, and clutch passes.
- Build/deploy diagnostics via Settings and generated `dist/debug.json` artifacts.

### Changed
- Power-ups now match their descriptions: Slow Motion slows gameplay, 2x Score doubles score and coin pickups, Magnet has a larger pull radius, and Ghost Hop is described as a double-jump tool.
- Game-over/revive flow now banks a run only after the player finishes or leaves, preventing duplicate revive rewards.
- Menu now shows world progress, daily reward status, average score, combo, perfect-pass, and near-miss progress.

### Fixed
- Fixed runs ending immediately because the rush timer was not initialized on reset/start.
- Fixed shop power-ups being purchasable but not usable in gameplay.
- Fixed audio settings/music wiring so volume sliders affect the audio engine and music starts during play.
- Fixed reset progress to use the canonical default save shape.
- Hardened GitHub Pages deploy so tests and artifact verification gate deployment.

## [3.1.0] - 2026-06-17
### Added
- Bragging functionality to leaderboard.
- Ability to copy brag text to clipboard.
- Enhanced leaderboard competitiveness with difficulty scaling and time pressure.

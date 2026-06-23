# Changelog

All notable changes to this project will be documented in this file.

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

# Release Notes — v4.5.0

**Release Date:** 2026-06-24

## Cloudflare Leaderboard Migration

This release adds a Firebase-free online leaderboard using Cloudflare Workers + D1.

### Added
- Cloudflare Workers + D1 leaderboard backend (`cloudflare/leaderboard-worker.js`, `schema.sql`)
- Wrangler example config and setup docs
- Stable anonymous `playerId` for per-player cloud rankings
- Cloud/local leaderboard status indicators, refresh button, and best-score sync

### Changed
- **Leaderboard priority**: Cloudflare D1 API is now checked first; Firebase is the fallback
- Scores sync locally first, then to cloud when `VITE_LEADERBOARD_API_URL` is set
- GitHub Pages builds can inject `VITE_LEADERBOARD_API_URL` from repo variables
- Falls back to localStorage if all cloud paths are unavailable

### Quality

| Gate | Result |
|------|--------|
| TypeScript | ✅ 0 errors |
| Unit tests | ✅ **145/145** passing |
| Production build | ✅ Success |

### Versioning
- `package.json` → 4.5.0

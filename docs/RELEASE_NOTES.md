# Release Notes — v2.4.0

**Release Date:** 2026-06-12
**Type:** Maintenance / hardening release (no gameplay changes)

This release is a production-readiness pass focused on security hardening, build
correctness, and test coverage. There are **no gameplay or save-format changes**,
so existing players keep all progress and the experience is unchanged.

## 🔒 Security

- **Hardened Firebase Realtime Database rules** (`docs/firebase-database.rules.json`):
  - Profile writes now require a **monotonically non-decreasing `updatedAt`**, preventing stale/malicious rollbacks.
  - `bestScore` can only increase; `level`, `xp`, `totalGames`, `totalCoins` are upper-bounded.
  - All timestamps must be after 2020-01-01 and within `now + 60s`.
  - `users` enforces a strict field allow-list (`$other → validate:false`).
  - `friends` rejects self-adds; chat messages are explicitly immutable.
- **Documented threat model** — `docs/SECURITY.md` now describes the anonymous-UID
  identity model, residual risks, and a step-by-step Firebase Anonymous Auth
  migration path for true per-user authorization.

## 🛠️ Build & Tooling

- **App version is injected from `package.json`** at build time — no more hardcoded
  version strings to keep in sync.
- **Warning-free build** — the cosmetic `EMPTY_IMPORT_META` warning is suppressed
  with a scoped Rollup `onwarn` filter (genuine warnings still surface).
- Added typed `import.meta.env` declarations.

## 🧪 Testing

- **+53 unit tests (92 → 145)** covering the power-up state machine, leaderboard
  entry validation/comparison, and the update-checker helpers.
- Coverage reporting is now honest (`all: true`) — it includes untested modules
  so the metric reflects reality.

## 🤖 CI/CD

- Fixed the iOS workflow's missing `contents: write` permission so tagged builds
  can upload release assets.

## 📦 Versioning

- `package.json` → 2.4.0
- Android `versionCode` 24 / `versionName` 2.4.0

## ✅ Quality Gates (verified on this build)

| Gate | Result |
|------|--------|
| TypeScript (`tsc --noEmit`) | ✅ 0 errors |
| ESLint | ✅ 0 errors, 0 warnings |
| Unit tests | ✅ 145/145 passing |
| Production build | ✅ Success, **warning-free** (729 KB / 198 KB gzip) |
| `npm audit` (prod, high gate) | ✅ 0 vulnerabilities |

## ⚠️ Known Limitations (unchanged)

- Anonymous-UID model means writes are not strictly owner-scoped (mitigated by
  integrity rules; full fix requires Firebase Anonymous Auth — see SECURITY.md).
- Chat has no per-user rate limiting (requires Auth or a Cloud Function).
- `engine.ts`, `audio.ts`, `store.ts`, and `leaderboard.ts` remain without unit
  tests due to heavy DOM/canvas/Firebase coupling (roadmap item).
- Android/iOS release artifacts are unsigned (debug-signed APK + unsigned IPA).

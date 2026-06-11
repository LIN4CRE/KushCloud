# KushCloud v1.7.0 — Security & Hygiene Release

**Release date:** 2026-06-11
**Type:** Maintenance / security — no gameplay changes
**Android:** versionCode 3 · versionName 1.7.0

## Highlights

This release is the result of a full production-readiness audit. It contains
no gameplay changes — existing saves, cosmetics, and leaderboard entries are
unaffected — but significantly improves the project's security posture,
dependency health, and open-source hygiene.

## 🔒 Security

- **0 known vulnerabilities**: upgraded `firebase` 10.12 → 12.14, clearing all
  10 `npm audit` findings (1 high, 9 moderate, all via transitive `undici`).
- **Secrets out of git**: the committed `.env` has been removed from tracking;
  `.env.example` documents required variables. CI workflows now consume
  Firebase config from GitHub Actions secrets instead of hardcoded values.
- **Database security rules shipped** (`docs/firebase-database.rules.json`):
  default-deny with per-path schema validation, score bounds (0–100,000),
  monotonic score updates, and append-only chat. ⚠️ **Operators must deploy
  these rules to their Firebase project** — see `docs/SECURITY_NOTES.md`.
- **Input hardening**: chat messages trimmed and capped at 500 chars;
  display names sanitised on every write path; profile updates are now
  non-destructive merges; UIDs generated with `crypto.randomUUID()`.

## 🧹 Repository hygiene

- **MIT LICENSE file added** (was referenced everywhere but missing).
- Removed stale `release-v1.0.0/` artifact and broken `test-app.js`.
- Release notes consolidated under `docs/releases/`.
- `SECURITY.md` supported-versions table brought up to date.

## ⚙️ CI/CD

- New `CI` workflow runs typecheck, unit tests, build, and a production
  dependency-audit gate on every push and PR.
- Dependabot enabled for npm, GitHub Actions, and Gradle.
- Issue and PR templates added.

## ✅ Verification

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ pass |
| `npm test` (Vitest) | ✅ 6/6 pass |
| `npm run build` (Vite single-file) | ✅ 671 kB / 182 kB gzip |
| `npm audit` | ✅ 0 vulnerabilities |

## Upgrade notes

- **Maintainers:** set the `VITE_FIREBASE_*` repository secrets before the
  next CI run (Settings → Secrets and variables → Actions), and deploy
  `docs/firebase-database.rules.json` to the Realtime Database.
- **Players:** nothing to do — install the new APK or refresh the web app.

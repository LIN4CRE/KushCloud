# KushCloud Security Notes (Operator Guide)

This document is for maintainers/operators of a KushCloud deployment. For
vulnerability reporting, see [SECURITY.md](../SECURITY.md).

## Threat model summary

KushCloud is a fully client-side game. There is **no trusted server**: the
only backend is Firebase Realtime Database, accessed directly by the client
with anonymous, client-generated UIDs (no Firebase Authentication for
gameplay identity). Consequences:

1. **Any score/profile write can be forged** by a motivated user. Client-side
   validation (`submitScore` bounds, `validateRun` heuristics) raises the bar
   but cannot prevent cheating. Treat leaderboards as "best effort" integrity.
2. **The Firebase web config is public by design.** The `VITE_FIREBASE_*`
   values ship inside the JS bundle; an attacker can always extract them.
   Real protection comes from database rules, not from hiding the config.
3. **Chat is unauthenticated.** Anyone can write messages under any name.

## Required: deploy database security rules

Without rules, the default RTDB test-mode config allows anyone to read/write
the entire database, including deleting all leaderboards.

Deploy [`firebase-database.rules.json`](./firebase-database.rules.json):

```bash
firebase deploy --only database
```

(or paste into Firebase Console → Realtime Database → Rules).

These rules:
- Deny all access by default, allowing only the paths the app uses.
- Enforce schema and bounds (score ≤ 100,000, name ≤ 32 chars, chat text ≤ 500 chars).
- Make leaderboard scores monotonically non-decreasing per UID.
- Make chat messages append-only (no edits/deletes by clients).
- Add `.indexOn` for the queries the client performs (`score`, `timestamp`).

## Recommended hardening (requires code changes)

| Improvement | Effort | Impact |
|---|---|---|
| Enable Firebase **App Check** (reCAPTCHA / Play Integrity) | Low | Blocks non-app clients from the database API |
| Switch to **Firebase Anonymous Auth** and key data by `auth.uid` | Medium | Rules can enforce that users only write their own data |
| Server-side score validation via Cloud Functions | High | Real anti-cheat |
| Chat rate limiting (per-UID write throttling in rules or Functions) | Medium | Mitigates spam/flooding |
| Profanity/abuse filtering for names and chat | Medium | Community safety |

## Secrets hygiene

- `.env` is git-ignored and must never be committed. Use `.env.example` as a template.
- CI injects Firebase config from **GitHub Actions secrets**
  (`VITE_FIREBASE_API_KEY`, etc.). Configure them in
  *Settings → Secrets and variables → Actions*.
- A previous Firebase web config was committed to git history. Because web
  configs are public by design this is not a credential leak, but if you want
  a clean slate: create a fresh Firebase project, deploy the rules above, and
  optionally restrict the old API key in Google Cloud Console
  (APIs & Services → Credentials → key restrictions: HTTP referrers + Android
  app package/SHA-1).

## Android

- `webContentsDebuggingEnabled: false` and `loggingBehavior: 'none'` are set
  in `capacitor.config.ts` — keep these for release builds.
- `allowMixedContent: true` is set; consider removing it (the app only talks
  to HTTPS Firebase endpoints).
- The manifest declares `FOREGROUND_SERVICE` and `POST_NOTIFICATIONS` which
  the app does not currently use; consider removing them to reduce the
  permission surface (Play Store reviews penalise unused permissions).
- Release APKs are unsigned by CI. Sign locally with your keystore before
  distribution; never commit keystores or passwords.

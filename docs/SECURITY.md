# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 2.4.x   | :white_check_mark: |
| 2.3.x   | :white_check_mark: |
| < 2.3   | :x:                |

## Reporting a Vulnerability

**DO NOT open a public issue for security vulnerabilities.**

Instead, please report vulnerabilities via one of the following:

1. **GitHub Private Vulnerability Reporting:**
   [Report a vulnerability](../../security/advisories/new)

2. **Email:** security@kushcloud.app
   - Use the subject line: `[SECURITY] KushCloud - Brief Description`

### What to Include
- Description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Suggested fix (if any)

### Response Timeline
- **Acknowledgment:** Within 48 hours
- **Initial Assessment:** Within 5 business days
- **Resolution Target:** Within 30 days for critical, 90 days for others

### Disclosure Policy
- We follow [Coordinated Vulnerability Disclosure](https://vuls.cert.org/confluence/display/Wiki/Coordinated+Vulnerability+Disclosure+Guidance)
- Public disclosure after fix is released and users have had time to update
- Credit will be given to reporters (unless anonymity is requested)

## Security Best Practices for Contributors
- Never commit secrets, API keys, or credentials
- Use environment variables for sensitive configuration
- Keep dependencies updated
- Follow the principle of least privilege

## Threat Model & Data Security

KushCloud is a **client-only** application backed by Firebase Realtime Database.
There is no application server, so all trust boundaries are enforced by **Firebase
Security Rules** (`docs/firebase-database.rules.json`) plus client-side input
validation (`src/config/firebase.ts`, `src/game/leaderboardModel.ts`).

### Identity model (important)

Players are identified by an **anonymous UID** stored in `localStorage`
(`generateUID()` → `crypto.randomUUID`). Clients are **not** authenticated with
Firebase Auth for gameplay (Google sign-in is optional/cosmetic). Because of
this, database write rules cannot use `auth.uid` to scope writes to the owner.

To reduce abuse within that model, the security rules:

| Control | Mechanism |
|---------|-----------|
| Path/UID binding | `users/$uid` and `leaderboards/$period/$uid` require the `uid` field to equal `$uid` |
| Score integrity | Scores are bounded `0–100000` and may only **increase** (no rollbacks) |
| Profile rollback protection | `users/$uid` writes require `updatedAt` to be monotonically non-decreasing |
| Field allow-listing | `"$other": { ".validate": false }` rejects unknown fields |
| Timestamp sanity | All timestamps must be `> 2020-01-01` and `<= now + 60s` |
| Numeric bounds | `level`, `xp`, `totalGames`, `totalCoins` are all upper-bounded |
| Chat immutability | Messages can only be created, never edited/deleted (`!data.exists()`) |
| Friends self-guard | A user cannot add themselves; values must be boolean or null |

### Known residual risks (documented, not yet mitigated)

1. **Open writes within the anonymous model.** Since there is no Firebase Auth,
   a determined attacker who knows another user's UID could still attempt to
   write to that profile node. The integrity rules above make destructive
   tampering (score rollback, field injection) much harder, but do not provide
   true per-user authorization.
2. **Chat rate-limiting.** RTDB rules cannot reliably throttle anonymous clients.
   Hardened anti-spam requires Firebase Auth or a Cloud Function.

### Recommended future hardening (requires app changes)

To achieve true per-user authorization, migrate to **Firebase Anonymous Auth**:

1. Enable Anonymous Authentication in the Firebase console.
2. Call `signInAnonymously(auth)` at startup and use `user.uid` as the UID.
3. Replace the open write rules with `".write": "auth != null && auth.uid === $uid"`.
4. Add per-uid chat throttling (e.g. a `lastMessageAt` node with a rule that
   rejects messages sent within N seconds) or move chat writes to a Cloud Function.

This is the single highest-impact security upgrade and is tracked on the roadmap.

## Secrets & Build Configuration

- Firebase web config values ship inside the client bundle and are **not secrets**
  in the traditional sense — protection comes from the security rules above.
- They are nonetheless injected via CI secrets (`secrets.FIREBASE_*`) and are
  **never committed** (`.env` is git-ignored).
- The app version displayed in-product is injected from `package.json` at build
  time (`VITE_APP_VERSION`), so it cannot drift from the released artifact.

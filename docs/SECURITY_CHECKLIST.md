# KushCloud Security Checklist

This checklist ensures KushCloud meets security best practices before production release.

## Authentication & Authorization

### Firebase Configuration
- [ ] Firebase API key restricted to KushCloud domain
  - HTTP referrer: `https://lin4cre.github.io/KushCloud/*`
  - HTTP referrer: `http://localhost:5000/*` (dev only)
- [ ] Firebase API key restricted to Android app
  - Package name: `com.linacre.kushcloud`
  - SHA-1: [Signer's certificate hash]
- [ ] Firebase API key restricted to iOS app
  - Bundle ID: `com.linacre.kushcloud`
  - App Store ID: [If published]
- [ ] Firebase rules deployed for Realtime Database
- [ ] Firebase rules tested and verified

### User Identity
- [ ] Player UID generation uses cryptographically secure method
- [ ] No Personal Identifiable Information (PII) stored
- [ ] Anonymous user tracking in place

## Data Protection

### Client-Side Data
- [ ] Save data validated before loading
- [ ] Save data schema versioned for migrations
- [ ] localStorage usage minimized for sensitive data
- [ ] Clear data mechanism available (user-facing)

### Server-Side Data (Firebase)
- [ ] Database rules prevent unauthorized access
- [ ] Write operations require authentication (if applicable)
- [ ] Read operations appropriate for public leaderboard
- [ ] Rate limiting in place for write operations
- [ ] Data retention policy defined

## Input Validation

### User Inputs
- [ ] Player names sanitized
- [ ] Chat messages sanitized
- [ ] URL parameters validated
- [ ] No SQL/NoSQL injection vectors

### Game Data
- [ ] Score validation implemented
- [ ] Flap count validation
- [ ] Session duration validation
- [ ] Duplicate run detection

## Network Security

### Transport Layer
- [ ] All API calls use HTTPS in production
- [ ] HTTP only used in local dev (localhost)
- [ ] Certificate pinning considered (future)

### API Keys
- [ ] Keys stored in GitHub Secrets
- [ ] Keys not in repository history
- [ ] Keys rotated if compromised
- [ ] Keys have minimal required permissions

## Code Security

### Dependencies
- [ ] Regular `npm audit` runs in CI
- [ ] High-severity vulnerabilities blocked
- [ ] Dependencies updated regularly
- [ ] No deprecated packages

### Secrets Management
- [ ] No hardcoded secrets in code
- [ ] `.env` files in .gitignore
- [ ] Secrets injected at build time
- [ ] Production secrets different from dev

### Build Security
- [ ] Source maps disabled in production
- [ ] Minification enabled
- [ ] Tree-shaking enabled
- [ ] No development debug code in production

## Mobile Security

### Android
- [ ] `webContentsDebuggingEnabled: false` in production
- [ ] Logging disabled in production (`loggingBehavior: 'none'`)
- [ ] No backup of sensitive data enabled
- [ ] ProGuard/R8 code obfuscation (optional)
- [ ] Release APK signed with release keystore

### iOS
- [ ] WebKit debugging disabled
- [ ] Keychain usage secure
- [ ] No sensitive data in UserDefaults
- [ ] Certificate pinning considered

## Privacy

### Data Collection
- [ ] No analytics without consent
- [ ] No third-party tracking
- [ ] No data sold or shared
- [ ] Privacy policy posted (if required)

### User Rights
- [ ] Users can delete their data
- [ ] Data export capability
- [ ] Clear explanation of data stored

## Incident Response

### Security Contact
- [ ] SECURITY.md has reporting instructions
- [ ] Maintainer contact verified
- [ ] GitHub Security Advisories enabled

### Vulnerability Handling
- [ ] CVEs tracked and addressed
- [ ] Critical issues addressed within 24 hours
- [ ] High issues addressed within 7 days
- [ ] Medium issues addressed within 30 days

## Compliance

### Legal
- [ ] Privacy policy (if collecting data)
- [ ] Terms of service (if required)
- [ ] Age rating determined (if applicable)
- [ ] COPPA compliance (if applicable)

### Platform-Specific
- [ ] Google Play safety section completed
- [ ] App Store privacy nutrition labels completed
- [ ] GDPR considerations (EU users)

---

## Security Scan Results

### Automated Scans

| Tool | Last Run | Result | Action Required |
|------|----------|--------|-----------------|
| npm audit | [DATE] | ✅ Pass | None |
| GitHub Dependabot | [DATE] | ✅ Pass | None |
| GitHub Code Scanning | [DATE] | ✅ Pass | None |
| GitHub Secret Scanning | [DATE] | ✅ Pass | None |

### Manual Reviews

| Review | Date | Reviewer | Findings |
|--------|------|----------|----------|
| Code Review | [DATE] | [NAME] | [NOTES] |
| Architecture Review | [DATE] | [NAME] | [NOTES] |
| Penetration Testing | [DATE] | [NAME] | [NOTES] |

---

## Security Improvements Roadmap

### Implemented (v2.0.0)
- ✅ Firebase v12.14.0 upgrade (remediates undici CVE)
- ✅ GitHub Secrets for Firebase config
- ✅ Input sanitization (chatInput)
- ✅ crypto.randomUUID() for player UIDs
- ✅ Database rules documented
- ✅ Security.md policy document

### Planned (Future)
- ⏳ Firebase Anonymous Auth for write-ownership
- ⏳ Server-side score validation
- ⏳ Content Security Policy headers
- ⏳ HTTPS enforcement for all resources
- ⏳ Firebase App Check integration

---

## Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| Security Review | | | ☐ |
| Privacy Review | | | ☐ |
| Compliance Check | | | ☐ |

**Security Approved for Production:** ☐ Yes ☐ No

**Notes:**
```
# KushCloud Version Management Guide

This document outlines how version numbers are managed across the KushCloud project.

## Semantic Versioning (SemVer)

KushCloud follows [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH
  │     │     │
  │     │     └── Patch version (backwards-compatible bug fixes)
  │     └──────── Minor version (backwards-compatible features)
  └────────────── Major version (incompatible API changes)
```

## Version Files

Version information must be synchronized across these files:

### 1. package.json
```json
{
  "version": "2.0.0"
}
```

### 2. src/config/env.ts (or similar)
```typescript
export const APP_VERSION = '2.0.0';
export const VERSION_CODE = 4; // Android build version
```

### 3. android/app/build.gradle
```groovy
android {
    defaultConfig {
        versionCode 4
        versionName "2.0.0"
    }
}
```

### 4. src/screens/Menu.tsx (display version)
```typescript
const APP_VERSION = '2.0.0';
```

## Version Bump Process

### Manual Bump (Pre-release)

```bash
# 1. Update package.json
# Edit version field directly or use npm version
npm version patch  # or minor, or major

# 2. Update Android build.gradle
# Manually edit android/app/build.gradle

# 3. Update app display version (Menu.tsx or config)
# Manually update APP_VERSION constant

# 4. Commit changes
git add .
git commit -m "chore: bump version to X.Y.Z"

# 5. Create and push tag
git tag -a vX.Y.Z -m "Release version X.Y.Z"
git push origin vX.Y.Z
```

### Automated Bump (Using release-please - Future)

```bash
# Configure in .github/workflows/release.yml
# release-please auto-bumps and creates PRs
```

## Version Code (Android)

Android uses a separate integer `versionCode` for Play Store requirements:

| Version | versionCode | Notes |
|---------|-------------|-------|
| 1.0.0 | 1 | Initial release |
| 1.6.2 | 2 | Critical fixes |
| 1.6.3 | 3 | Security hardening |
| 1.6.4 | 3 | Repository cleanup (no APK change) |
| 2.0.0 | 4 | Major release |

## Release Channels

| Channel | Version Pattern | Example |
|---------|-----------------|---------|
| Stable | `X.Y.Z` | `2.0.0` |
| Beta | `X.Y.Z-beta.N` | `2.1.0-beta.1` |
| Alpha | `X.Y.Z-alpha.N` | `2.1.0-alpha.1` |
| RC | `X.Y.Z-rc.N` | `2.1.0-rc.1` |

## Pre-release Version Check

Before each release, verify:

- [ ] package.json version updated
- [ ] build.gradle versionCode updated
- [ ] build.gradle versionName updated
- [ ] APP_VERSION in app code updated
- [ ] CHANGELOG.md updated
- [ ] All files consistent

## Node.js Version Requirements

| KushCloud Version | Node.js Minimum | npm Minimum |
|-------------------|-----------------|-------------|
| 2.0.0+ | 20.0.0 | 9.0.0 |
| 1.6.x | 18.0.0 | 8.0.0 |

## Update Checker

The app includes an in-app update checker that:
1. Queries GitHub Releases API
2. Compares with current APP_VERSION
3. Displays prompt if newer version available

See `src/utils/updateChecker.ts` for implementation.

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-06-11 | 2.0.0 | V2 milestone - ESLint, 100 tests, auto-update |
| 2026-06-11 | 1.6.4 | Repository audit & cleanup |
| 2026-06-11 | 1.6.3 | Security hardening |
| 2026-06-11 | 1.6.2 | Leaderboard integrity fixes |
| 2025-06-11 | 1.6.1 | Persistent leaderboards |
| 2025-06-10 | 1.6.0 | Competitive update |
| 2025-06-09 | 1.5.2 | The Shop Update |
| 2025-06-08 | 1.5.1 | Bug fixes |
| ... | ... | ... |

## Migration Notes

### v1.x to v2.0
- Save data version 5 introduces runId deduplication
- Automatic migration handled by `storage.migrateSaveData()`
- SharedPreferencesHelper removed (use localStorage directly)
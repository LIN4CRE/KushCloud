# Release Guide

## How to Cut a Release

```bash
# 1. Update version (single source of truth)
# Edit package.json (version field) — injected via VITE_APP_VERSION at build time

# 2. Update CHANGELOG.md with new version notes

# 3. Commit and tag
git add -A
git commit -m "release: vX.Y.Z — release title"
git tag -a "vX.Y.Z" -m "Release vX.Y.Z"
git push origin main --tags
```

Pushing a `v*` tag triggers CI to:
- Build debug APK → attach to GitHub Release
- Build iOS IPA → attach to GitHub Release
- Deploy web to GitHub Pages

## Version Scheme

- **Major** (X): Breaking changes or major feature milestones
- **Minor** (Y): New features, non-breaking
- **Patch** (Z): Bug fixes, performance, polish

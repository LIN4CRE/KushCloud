# Release Guide

## How to Cut a Release

```bash
# 1. Update version
# Edit D:\LIN4CRE\KushCloud\src\config\env.ts (app.version)
# Edit D:\LIN4CRE\KushCloud\package.json (version field)

# 2. Update CHANGELOG.md with new version notes

# 3. Commit and tag
git add -A
git commit -m "chore: bump version to X.Y.Z"
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

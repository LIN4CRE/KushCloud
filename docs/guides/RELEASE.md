# Release Process

This document describes the process for creating and publishing a new release of KushCloud.

## Versioning

KushCloud follows [Semantic Versioning (SemVer)](https://semver.org/):
- **MAJOR** version for incompatible API changes.
- **MINOR** version for functionality in a backwards compatible manner.
- **PATCH** version for backwards compatible bug fixes.

## Release Steps

### 1. Preparation
- Ensure all tests pass: `npm test`.
- Verify the build: `npm run build`.
- Update `CHANGELOG.md` with the changes since the last release.
- Update the version in `package.json`.

### 2. Tagging
Create a new git tag for the version:
```bash
git tag -a v1.6.3 -m "Release version 1.6.3"
git push origin v1.6.3
```

### 3. Automated Builds
- Pushing a tag starting with `v*` will trigger the **Build Android APK** and **Build iOS** GitHub Actions.
- The Android workflow will automatically create a GitHub Release and attach the APK artifacts.
- The iOS workflow will build the archive and upload it as an artifact (manual distribution to App Store is currently required).

### 4. Web Deployment
- Pushing to the `main` branch automatically triggers a deployment to the web hosting (e.g., GitHub Pages).

### 5. Post-Release
- Verify the GitHub Release contains the correct artifacts.
- Announce the release in the project discussions or social channels.

## Automated Release Notes

The project uses GitHub's automated release notes feature, which generates a summary of merged Pull Requests since the last tag.

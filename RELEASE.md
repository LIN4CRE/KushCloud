# Release Process

## Versioning
This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR:** Breaking changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes (backward compatible)

## Release Checklist

### Pre-Release
- [ ] All tests pass on `main`
- [ ] CHANGELOG.md updated with new version section
- [ ] Version bumped in `package.json`
- [ ] Security audit passed (`npm audit`)
- [ ] Documentation updated
- [ ] Breaking changes documented in migration guide

### Release
1. Create release branch: `release/vX.Y.Z`
2. Final review and approval
3. Merge to `main`
4. Tag: `git tag -s vX.Y.Z -m "Release vX.Y.Z"`
5. Push tag: `git push origin vX.Y.Z`
6. CI/CD publishes release artifacts
7. Create GitHub Release with changelog excerpt

### Post-Release
- [ ] Verify published artifacts
- [ ] Announce release (if applicable)
- [ ] Monitor for regression reports (48-hour window)
- [ ] Merge `main` back to `develop` (if using gitflow)

# Deployment Guide

## Web (GitHub Pages)

Push to `main` triggers `deploy-web.yml`, which now runs lint, type-checking, unit tests, a production build, and artifact verification before deploying to GitHub Pages.

The build writes `dist/debug.json` with version, commit, branch, build time, base path, and emitted file sizes. In the app, open **Settings → Build & Deploy Debug** to copy a runtime debug report for troubleshooting.

Manual deploy:
```bash
npm run lint
npm run typecheck
npm test
npm run build
npx gh-pages -d dist
```

## Prerequisites

- Node.js >= 22, npm >= 9

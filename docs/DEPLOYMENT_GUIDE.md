# Deployment Guide

## Web (GitHub Pages)

Push to `main` triggers `deploy-web.yml`, which now runs lint, type-checking, unit tests, a production build, and artifact verification before deploying to GitHub Pages.

The build writes `dist/debug.json` with version, commit, branch, build time, base path, and emitted file sizes. In the app, open **Settings → Build & Deploy Debug** to copy a runtime debug report for troubleshooting.

Online leaderboards use the optional Cloudflare Worker/D1 endpoint documented in [`ONLINE_LEADERBOARD.md`](./ONLINE_LEADERBOARD.md). Set the GitHub repository variable `VITE_LEADERBOARD_API_URL` to enable cloud ranks in the Pages build.

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

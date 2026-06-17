# Deployment Guide

## Web (GitHub Pages)

Push to `main` triggers `deploy-web.yml` which builds the `dist/` bundle and deploys to GitHub Pages.

Manual deploy:
```bash
npm run build
npx gh-pages -d dist
```

## Prerequisites

- Node.js >= 22, npm >= 9

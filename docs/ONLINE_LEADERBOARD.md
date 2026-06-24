# Online Leaderboard: Cloudflare Workers + D1

Firebase has been removed from the leaderboard path. KushCloud now supports a small Cloudflare Worker backed by D1 SQLite:

- free tier friendly,
- no secret key exposed in the browser,
- works from GitHub Pages via CORS,
- local leaderboard fallback if the cloud endpoint is down or not configured.

## 1) Create the free D1 database

```bash
npx wrangler login
npx wrangler d1 create kushcloud-leaderboard
```

Copy the generated `database_id`, then:

```bash
cp cloudflare/wrangler.toml.example wrangler.toml
# edit wrangler.toml and paste database_id
npx wrangler d1 execute kushcloud-leaderboard --file=cloudflare/schema.sql
```

## 2) Deploy the Worker

```bash
npx wrangler deploy --config wrangler.toml
```

Your endpoint will look like:

```text
https://kushcloud-leaderboard.<your-subdomain>.workers.dev
```

Test it:

```bash
curl https://kushcloud-leaderboard.<your-subdomain>.workers.dev/health
curl https://kushcloud-leaderboard.<your-subdomain>.workers.dev/leaderboard
```

## 3) Connect GitHub Pages build

Add this repository variable or secret in GitHub:

```text
VITE_LEADERBOARD_API_URL=https://kushcloud-leaderboard.<your-subdomain>.workers.dev
```

Then update `.github/workflows/deploy-web.yml` build step to expose it if needed:

```yaml
env:
  VITE_LEADERBOARD_API_URL: ${{ vars.VITE_LEADERBOARD_API_URL }}
```

Local dev:

```bash
VITE_LEADERBOARD_API_URL=https://kushcloud-leaderboard.<your-subdomain>.workers.dev npm run dev
```

## API

### GET `/leaderboard?limit=50&uid=<playerId>`

Returns top scores plus the current player's rank when `uid` is provided.

### POST `/leaderboard`

```json
{
  "uid": "stable-player-id",
  "name": "Player",
  "score": 123,
  "totalGames": 10,
  "bestCombo": 4,
  "redEye": 2
}
```

The Worker stores one row per player and only keeps the player's best score, while accumulating Red Eye count.

## Failure mode

If the Worker is down or `VITE_LEADERBOARD_API_URL` is blank, the game automatically falls back to localStorage scores. The leaderboard screen shows whether it is using `cloud` or `local`.

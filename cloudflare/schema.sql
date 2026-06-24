-- KushCloud free online leaderboard schema for Cloudflare D1.
-- Run with: npx wrangler d1 execute kushcloud-leaderboard --file=cloudflare/schema.sql

CREATE TABLE IF NOT EXISTS scores (
  uid TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_games INTEGER NOT NULL DEFAULT 0,
  best_combo INTEGER NOT NULL DEFAULT 0,
  red_eye INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scores_rank ON scores(score DESC, updated_at ASC);
CREATE INDEX IF NOT EXISTS idx_scores_updated ON scores(updated_at DESC);

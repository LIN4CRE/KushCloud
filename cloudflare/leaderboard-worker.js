/* global Response, URL */
const MAX_SCORE = 100_000;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      ...CORS_HEADERS,
      "content-type": "application/json; charset=utf-8",
      "cache-control": status === 200 ? "public, max-age=20" : "no-store",
    },
  });
}

function cleanName(name) {
  return String(name || "Anonymous")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 32) || "Anonymous";
}

function cleanUid(uid) {
  return String(uid || "")
    .replace(/[^a-zA-Z0-9_:-]/g, "")
    .slice(0, 80);
}

function toEntry(row, rank) {
  if (!row) return null;
  return {
    uid: row.uid,
    name: row.name,
    score: Number(row.score) || 0,
    date: Number(row.updated_at) || Date.now(),
    rank,
    redEye: Number(row.red_eye) || 0,
  };
}

async function rankForScore(db, score) {
  const row = await db
    .prepare("SELECT COUNT(*) AS better FROM scores WHERE score > ?")
    .bind(score)
    .first();
  return (Number(row?.better) || 0) + 1;
}

async function getLeaderboard(request, env) {
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(MAX_LIMIT, Number(url.searchParams.get("limit")) || DEFAULT_LIMIT));
  const uid = cleanUid(url.searchParams.get("uid"));

  const { results } = await env.DB
    .prepare(
      `SELECT uid, name, score, total_games, best_combo, red_eye, updated_at
       FROM scores
       ORDER BY score DESC, updated_at ASC
       LIMIT ?`,
    )
    .bind(limit)
    .all();

  const entries = (results || []).map((row, index) => toEntry(row, index + 1));
  let playerEntry = null;
  let playerRank = 0;

  if (uid) {
    const row = await env.DB
      .prepare("SELECT uid, name, score, total_games, best_combo, red_eye, updated_at FROM scores WHERE uid = ?")
      .bind(uid)
      .first();
    if (row) {
      playerRank = await rankForScore(env.DB, Number(row.score) || 0);
      playerEntry = toEntry(row, playerRank);
    }
  }

  return json({ ok: true, entries, playerEntry, playerRank, updatedAt: Date.now() });
}

async function postScore(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const uid = cleanUid(body.uid);
  const name = cleanName(body.name);
  const score = Math.floor(Number(body.score));
  const totalGames = Math.max(0, Math.min(1_000_000, Math.floor(Number(body.totalGames) || 0)));
  const bestCombo = Math.max(0, Math.min(10_000, Math.floor(Number(body.bestCombo) || 0)));
  const redEye = Math.max(0, Math.min(1_000_000, Math.floor(Number(body.redEye) || 0)));
  const now = Date.now();

  if (!uid || !Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
    return json({ ok: false, error: "invalid_score" }, 400);
  }

  await env.DB
    .prepare(
      `INSERT INTO scores (uid, name, score, total_games, best_combo, red_eye, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(uid) DO UPDATE SET
         name = excluded.name,
         score = CASE WHEN excluded.score > scores.score THEN excluded.score ELSE scores.score END,
         total_games = CASE WHEN excluded.total_games > scores.total_games THEN excluded.total_games ELSE scores.total_games END,
         best_combo = CASE WHEN excluded.best_combo > scores.best_combo THEN excluded.best_combo ELSE scores.best_combo END,
         red_eye = scores.red_eye + excluded.red_eye,
         updated_at = CASE WHEN excluded.score >= scores.score THEN excluded.updated_at ELSE scores.updated_at END`,
    )
    .bind(uid, name, score, totalGames, bestCombo, redEye, now, now)
    .run();

  const row = await env.DB
    .prepare("SELECT uid, name, score, total_games, best_combo, red_eye, updated_at FROM scores WHERE uid = ?")
    .bind(uid)
    .first();
  const rank = await rankForScore(env.DB, Number(row?.score) || score);

  return json({ ok: true, rank, entry: toEntry(row, rank) });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
    if (!env.DB) return json({ ok: false, error: "missing_d1_binding" }, 500);

    const url = new URL(request.url);
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return json({ ok: true, service: "kushcloud-leaderboard", time: Date.now() });
    }
    if (request.method === "GET" && url.pathname === "/leaderboard") return getLeaderboard(request, env);
    if (request.method === "POST" && url.pathname === "/leaderboard") return postScore(request, env);

    return json({ ok: false, error: "not_found" }, 404);
  },
};

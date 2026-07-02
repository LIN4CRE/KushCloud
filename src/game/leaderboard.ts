const LB_KEY = "kushcloud_leaderboard_v1";
const MAX_ENTRIES = 100;
const DEFAULT_LIMIT = 50;
const REQUEST_TIMEOUT_MS = 6_000;

import { isFirebaseConfigured, submitLeaderboardScore, getLeaderboardEntries, getPlayerRank } from "../config/firebase";

export interface LbEntry {
  name: string;
  score: number;
  date: number;
  uid?: string;
  rank?: number;
  redEye?: number;
}

export interface SubmitScoreInput {
  uid: string;
  name: string;
  score: number;
  totalGames?: number;
  bestCombo?: number;
  redEye?: number;
}

export interface LeaderboardResult {
  entries: LbEntry[];
  source: "cloud" | "local";
  online: boolean;
  error?: string;
  playerRank?: number;
  playerEntry?: LbEntry;
}

export interface SubmitScoreResult {
  localRank: number;
  cloudRank?: number;
  online: boolean;
  error?: string;
}

function safeApiBase() {
  return (import.meta.env.VITE_LEADERBOARD_API_URL || "").trim().replace(/\/+$/, "");
}

export function isCloudLeaderboardConfigured(): boolean {
  return safeApiBase().length > 0 || isFirebaseConfigured();
}

function cleanName(name: string) {
  return (name || "Anonymous").trim().replace(/\s+/g, " ").slice(0, 32) || "Anonymous";
}

function normalizeEntry(entry: Partial<LbEntry>): LbEntry | null {
  const score = Number(entry.score);
  const date = Number(entry.date);
  if (!Number.isFinite(score) || score < 0) return null;
  return {
    uid: typeof entry.uid === "string" ? entry.uid : undefined,
    name: cleanName(String(entry.name || "Anonymous")),
    score: Math.floor(score),
    date: Number.isFinite(date) && date > 0 ? date : Date.now(),
    rank: Number.isFinite(Number(entry.rank)) ? Number(entry.rank) : undefined,
    redEye: Number.isFinite(Number(entry.redEye)) ? Number(entry.redEye) : undefined,
  };
}

export function getLocalLeaderboard(): LbEntry[] {
  try {
    const raw = localStorage.getItem(LB_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeEntry).filter((entry): entry is LbEntry => !!entry);
  } catch {
    return [];
  }
}

export function submitLocalScore(name: string, score: number, uid?: string): { rank: number } {
  if (!name || !Number.isFinite(score) || score < 0) return { rank: -1 };
  const cleanScore = Math.floor(score);
  const cleanUid = uid?.trim();
  const entries = getLocalLeaderboard();
  const existingIndex = cleanUid ? entries.findIndex((entry) => entry.uid === cleanUid) : -1;

  if (existingIndex >= 0) {
    const existing = entries[existingIndex];
    entries[existingIndex] = {
      ...existing,
      name: cleanName(name),
      score: Math.max(existing.score, cleanScore),
      date: cleanScore >= existing.score ? Date.now() : existing.date,
      uid: cleanUid,
    };
  } else {
    entries.push({ uid: cleanUid, name: cleanName(name), score: cleanScore, date: Date.now() });
  }

  entries.sort((a, b) => b.score - a.score || a.date - b.date);
  const trimmed = entries.slice(0, MAX_ENTRIES).map((entry, index) => ({ ...entry, rank: index + 1 }));
  try {
    localStorage.setItem(LB_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }
  const rank = trimmed.findIndex((entry) => (cleanUid ? entry.uid === cleanUid : entry.name === cleanName(name) && entry.score === cleanScore)) + 1;
  return { rank: rank > 0 ? rank : -1 };
}

function localResult(uid?: string, limit = DEFAULT_LIMIT): LeaderboardResult {
  const entries = getLocalLeaderboard().slice(0, limit).map((entry, index) => ({ ...entry, rank: entry.rank || index + 1 }));
  const playerEntry = uid ? getLocalLeaderboard().find((entry) => entry.uid === uid) : undefined;
  return {
    entries,
    source: "local",
    online: false,
    playerEntry,
    playerRank: playerEntry?.rank,
  };
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const base = safeApiBase();
  if (!base) throw new Error("Cloud leaderboard is not configured");

  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: {
        "content-type": "application/json",
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`Leaderboard cloud returned ${res.status}`);
    return await res.json() as T;
  } finally {
    window.clearTimeout(timer);
  }
}

async function firebaseLeaderboard(uid?: string, limit = DEFAULT_LIMIT): Promise<LeaderboardResult | null> {
  if (!isFirebaseConfigured()) return null;
  try {
    const raw = await getLeaderboardEntries(limit);
    const entries: LbEntry[] = raw.map((e, i) => ({
      uid: e.uid,
      name: e.name,
      score: e.score,
      date: e.date,
      rank: i + 1,
    }));
    let playerEntry: LbEntry | undefined;
    let playerRank = 0;
    if (uid) {
      const found = entries.find((e) => e.uid === uid);
      if (found) {
        playerEntry = found;
        playerRank = found.rank || 0;
      } else {
        playerRank = await getPlayerRank(uid, 0);
      }
    }
    return { entries, source: "cloud", online: true, playerRank, playerEntry };
  } catch {
    return null;
  }
}

async function apiLeaderboard(uid?: string, limit = DEFAULT_LIMIT): Promise<LeaderboardResult | null> {
  if (!safeApiBase()) return null;
  try {
    const params = new URLSearchParams({ limit: String(limit) });
    if (uid) params.set("uid", uid);
    const data = await fetchJson<{
      ok: boolean;
      entries: Partial<LbEntry>[];
      playerRank?: number;
      playerEntry?: Partial<LbEntry>;
    }>(`/leaderboard?${params.toString()}`);

    const entries = (data.entries || [])
      .map(normalizeEntry)
      .filter((entry): entry is LbEntry => !!entry)
      .map((entry, index) => ({ ...entry, rank: entry.rank || index + 1 }));
    const playerEntry = data.playerEntry ? normalizeEntry(data.playerEntry) ?? undefined : undefined;

    return {
      entries,
      source: "cloud",
      online: true,
      playerRank: data.playerRank,
      playerEntry,
    };
  } catch {
    return null;
  }
}

export async function getLeaderboard(uid?: string, limit = DEFAULT_LIMIT): Promise<LeaderboardResult> {
  const api = await apiLeaderboard(uid, limit);
  if (api) return api;

  const fb = await firebaseLeaderboard(uid, limit);
  if (fb) return fb;

  return localResult(uid, limit);
}

export async function submitScore(input: SubmitScoreInput): Promise<SubmitScoreResult> {
  const local = submitLocalScore(input.name, input.score, input.uid);

  if (safeApiBase()) {
    try {
      const data = await fetchJson<{ ok: boolean; rank?: number }>("/leaderboard", {
        method: "POST",
        body: JSON.stringify({
          uid: input.uid,
          name: cleanName(input.name),
          score: Math.floor(input.score),
          totalGames: input.totalGames ?? 0,
          bestCombo: input.bestCombo ?? 0,
          redEye: input.redEye ?? 0,
        }),
      });
      return { localRank: local.rank, cloudRank: data.rank, online: true };
    } catch {
      return {
        localRank: local.rank,
        online: false,
        error: "Cloud score submit failed",
      };
    }
  }

  if (isFirebaseConfigured()) {
    try {
      const result = await submitLeaderboardScore(input.uid, input.name, input.score);
      if (result) {
        return { localRank: local.rank, cloudRank: result.rank, online: true };
      }
    } catch {
      /* fall through */
    }
  }

  return { localRank: local.rank, online: false };
}

const LB_KEY = "kushcloud_leaderboard_v1";
const MAX_ENTRIES = 100;

export interface LbEntry {
  name: string;
  score: number;
  date: number;
}

export function getLocalLeaderboard(): LbEntry[] {
  try {
    const raw = localStorage.getItem(LB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function submitLocalScore(name: string, score: number): { rank: number } {
  if (!name || !Number.isFinite(score) || score < 0) return { rank: -1 };
  const entries = getLocalLeaderboard();
  entries.push({ name: name.trim().slice(0, 32) || "Anonymous", score, date: Date.now() });
  entries.sort((a, b) => b.score - a.score);
  const trimmed = entries.slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(LB_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }
  const rank = trimmed.findIndex((e) => e.name === name && e.score === score) + 1;
  return { rank: rank > 0 ? rank : -1 };
}

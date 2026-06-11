export type LeaderboardPeriod = "daily" | "weekly" | "all";

export interface LeaderboardEntry {
  name: string;
  score: number;
  timestamp: number;
  uid: string;
  period: LeaderboardPeriod;
}

function isPeriod(value: unknown): value is LeaderboardPeriod {
  return value === "daily" || value === "weekly" || value === "all";
}

export function toLeaderboardEntry(
  value: unknown,
  fallbackUid?: string | null,
  fallbackPeriod?: LeaderboardPeriod,
): LeaderboardEntry | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Partial<LeaderboardEntry>;
  const uid = typeof data.uid === "string" && data.uid.trim() ? data.uid.trim() : fallbackUid;
  const name = typeof data.name === "string" && data.name.trim() ? data.name.trim() : null;
  const period = isPeriod(data.period) ? data.period : fallbackPeriod;
  const score = typeof data.score === "number" ? data.score : null;
  const timestamp = typeof data.timestamp === "number" ? data.timestamp : null;

  if (!uid || !name || !period) return null;
  if (score === null || timestamp === null) return null;
  if (!Number.isFinite(score) || !Number.isInteger(score) || score < 0 || score > 100000) return null;
  if (!Number.isFinite(timestamp) || timestamp < 0) return null;

  return {
    uid,
    name,
    score,
    timestamp,
    period,
  };
}

export function compareLeaderboardEntries(a: LeaderboardEntry, b: LeaderboardEntry): number {
  return (
    b.score - a.score ||
    a.timestamp - b.timestamp ||
    a.uid.localeCompare(b.uid) ||
    a.name.localeCompare(b.name)
  );
}

export function normalizeLeaderboardEntries(
  entries: unknown[],
  fallbackPeriod?: LeaderboardPeriod,
): LeaderboardEntry[] {
  const bestByUid = new Map<string, LeaderboardEntry>();

  for (const entry of entries) {
    const normalized = toLeaderboardEntry(entry, undefined, fallbackPeriod);
    if (!normalized) continue;
    const current = bestByUid.get(normalized.uid);
    if (!current || compareLeaderboardEntries(normalized, current) < 0) {
      bestByUid.set(normalized.uid, normalized);
    }
  }

  return [...bestByUid.values()].sort(compareLeaderboardEntries);
}

export function calculateRank(entries: LeaderboardEntry[], uid: string, playerScore: number): number {
  const normalized = normalizeLeaderboardEntries(entries);
  const ownIndex = normalized.findIndex((entry) => entry.uid === uid);
  if (ownIndex >= 0) return ownIndex + 1;
  if (!Number.isFinite(playerScore)) return 1;
  return normalized.filter((entry) => entry.score > playerScore).length + 1;
}

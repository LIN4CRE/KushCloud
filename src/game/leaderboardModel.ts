export type LeaderboardPeriod = "allTime";

export interface LeaderboardEntry {
  uid: string;
  name: string;
  score: number;
  timestamp: number;
  period: LeaderboardPeriod;
}

export function toLeaderboardEntry(
  _val: unknown, _key: string | null, _period: LeaderboardPeriod
): LeaderboardEntry | null {
  return null;
}

export function normalizeLeaderboardEntries(
  _entries: LeaderboardEntry[], _period: LeaderboardPeriod
): LeaderboardEntry[] {
  return [];
}

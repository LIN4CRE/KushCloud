import { describe, expect, it } from "vitest";
import { calculateRank, normalizeLeaderboardEntries, type LeaderboardEntry } from "./leaderboardModel";

function entry(overrides: Partial<LeaderboardEntry>): LeaderboardEntry {
  return {
    uid: "uid-a",
    name: "A",
    score: 10,
    timestamp: 100,
    period: "daily",
    ...overrides,
  };
}

describe("leaderboard model", () => {
  it("collapses duplicate UID rows and keeps the best score", () => {
    const list = normalizeLeaderboardEntries([
      entry({ uid: "uid-a", name: "Old A", score: 10, timestamp: 100 }),
      entry({ uid: "uid-a", name: "New A", score: 15, timestamp: 200 }),
      entry({ uid: "uid-b", name: "B", score: 12, timestamp: 50 }),
    ]);

    expect(list).toHaveLength(2);
    expect(list.map((item) => [item.uid, item.name, item.score])).toEqual([
      ["uid-a", "New A", 15],
      ["uid-b", "B", 12],
    ]);
  });

  it("sorts deterministically by score, timestamp, uid, then name", () => {
    const list = normalizeLeaderboardEntries([
      entry({ uid: "uid-c", name: "C", score: 10, timestamp: 200 }),
      entry({ uid: "uid-b", name: "B", score: 10, timestamp: 100 }),
      entry({ uid: "uid-a", name: "A", score: 20, timestamp: 300 }),
      entry({ uid: "uid-d", name: "D", score: 10, timestamp: 100 }),
    ]);

    expect(list.map((item) => item.uid)).toEqual(["uid-a", "uid-b", "uid-d", "uid-c"]);
  });

  it("ranks the current UID before falling back to score insertion", () => {
    const list = normalizeLeaderboardEntries([
      entry({ uid: "uid-top", name: "Top", score: 30, timestamp: 100 }),
      entry({ uid: "uid-me", name: "Me", score: 20, timestamp: 100 }),
      entry({ uid: "uid-tie", name: "Tie", score: 20, timestamp: 50 }),
    ]);

    expect(calculateRank(list, "uid-me", 20)).toBe(3);
    expect(calculateRank(list, "uid-missing", 20)).toBe(2);
  });
});

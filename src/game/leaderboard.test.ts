import { describe, it, expect, beforeEach, vi } from "vitest";
import { getLocalAllLeaderboards, getLocalRank, setUID } from "./leaderboard";

vi.mock("../config/firebase", () => ({
  LeaderboardPeriod: {} as any,
  subscribeLeaderboard: vi.fn((_period: string, cb: (entries: any[]) => void) => { cb([]); return () => {}; }),
  submitScore: vi.fn(),
  generateUID: () => "test-uid-123",
  getUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
  addFriend: vi.fn(),
  removeFriend: vi.fn(),
  subscribeFriends: vi.fn((_uid: string, cb: (uids: string[]) => void) => { cb([]); return () => {}; }),
  searchUserByUid: vi.fn(),
}));

describe("Leaderboard Service - Local Cache Fix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setUID("test-uid-123");
    localStorage.clear();
  });

  it("should filter cached entries within 24 hours", () => {
    const mockEntries = [
      { uid: "user1", name: "Player1", score: 1000, timestamp: Date.now() - 3600000 },
      { uid: "user2", name: "Player2", score: 800, timestamp: Date.now() - 7200000 },
      { uid: "user3", name: "Player3", score: 600, timestamp: Date.now() - 25 * 60 * 60 * 1000 },
    ];
    localStorage.setItem("kushcloud_leaderboard_cache", JSON.stringify(mockEntries));

    const result = getLocalAllLeaderboards();
    expect(result).toHaveLength(2);
    expect(result[0].uid).toBe("user1");
    expect(result[1].uid).toBe("user2");
  });

  it("should return rank 1 for score higher than all entries", () => {
    const rank = getLocalRank(1500);
    expect(rank).toBe(1);
  });

  it("should return 0 rank for zero score", () => {
    const rank = getLocalRank(0);
    expect(rank).toBe(0);
  });

  it("should handle empty cache gracefully", () => {
    const result = getLocalAllLeaderboards();
    expect(result).toEqual([]);
  });
});

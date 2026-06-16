import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getLocalAllLeaderboards, getLocalLeaderboard, getLocalRank, subscribeToLeaderboard, cleanupSubscriptions, setUID } from "./leaderboard";
import { LeaderboardPeriod } from "./leaderboardModel";

vi.mock("./leaderboard", () => ({
  subscribeLeaderboard: vi.fn(),
  subscribeFriends: vi.fn(),
  submitScore: vi.fn(),
  getUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
  addFriend: vi.fn(),
  removeFriend: vi.fn(),
  searchUserByUid: vi.fn(),
  generateUID: () => "test-uid-123",
  getUID: () => "test-uid-123",
  setUID: (uid: string) => {},
  subscribeToLeaderboard: vi.fn(),
  cleanupSubscriptions: vi.fn(),
}));

vi.mock("./storage", () => ({
  loadSave: () => ({
    playerName: "TestPlayer",
    stats: { bestScore: 100 },
  }),
}));

vi.mock("./data", () => ({
  getDailyMissions: () => [],
  getActiveEvents: () => [],
}));

vi.mock("./audio", () => ({
  playSound: vi.fn(),
  stopSound: vi.fn(),
}));

describe("Leaderboard Service - Local Cache Fix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setUID("test-uid-123");
  });

  afterEach(() => {
    cleanupSubscriptions();
  });

  it("should calculate rank using local cache", async () => {
    const mockEntries = [
      { uid: "user1", name: "Player1", score: 1000, timestamp: Date.now() - 3600000 },
      { uid: "user2", name: "Player2", score: 800, timestamp: Date.now() - 7200000 },
      { uid: "user3", name: "Player3", score: 600, timestamp: Date.now() - 10800000 },
    ];
    localStorage.setItem("kushcloud_leaderboard_cache", JSON.stringify(mockEntries));

    const rank = await getRank("daily", 900);

    expect(rank).toBe(2);
  });

  it("should return rank 1 for score higher than all cached entries", async () => {
    const mockEntries = [
      { uid: "user1", name: "Player1", score: 1000, timestamp: Date.now() - 3600000 },
      { uid: "user2", name: "Player2", score: 800, timestamp: Date.now() - 7200000 },
    ];
    localStorage.setItem("kushcloud_leaderboard_cache", JSON.stringify(mockEntries));

    const rank = await getRank("daily", 1500);

    expect(rank).toBe(1);
  });
});

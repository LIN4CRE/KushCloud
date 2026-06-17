import { describe, it, expect, beforeEach } from "vitest";
import { getLocalLeaderboard, submitLocalScore } from "./leaderboard";

describe("Local Leaderboard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty array when no scores exist", () => {
    const entries = getLocalLeaderboard();
    expect(entries).toEqual([]);
  });

  it("returns rank for a submitted score", () => {
    const { rank } = submitLocalScore("TestPlayer", 100);
    expect(rank).toBe(1);
  });

  it("returns -1 rank for invalid name", () => {
    const { rank } = submitLocalScore("", 100);
    expect(rank).toBe(-1);
  });

  it("returns -1 rank for invalid score", () => {
    const { rank } = submitLocalScore("Test", NaN);
    expect(rank).toBe(-1);
  });

  it("sorts entries by score descending", () => {
    submitLocalScore("Player1", 50);
    submitLocalScore("Player2", 200);
    submitLocalScore("Player3", 100);
    const entries = getLocalLeaderboard();
    expect(entries[0].name).toBe("Player2");
    expect(entries[1].name).toBe("Player3");
    expect(entries[2].name).toBe("Player1");
  });

  it("persists across reloads", () => {
    submitLocalScore("Persist", 300);
    const entries = getLocalLeaderboard();
    expect(entries).toHaveLength(1);
    expect(entries[0].score).toBe(300);
  });
});

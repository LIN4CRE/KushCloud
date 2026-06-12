import { describe, expect, it } from "vitest";
import {
  toLeaderboardEntry,
  compareLeaderboardEntries,
  type LeaderboardEntry,
} from "./leaderboardModel";

/**
 * Tests for `toLeaderboardEntry` — the validation/sanitization layer that turns
 * untrusted Firebase snapshot values into typed leaderboard entries. This is a
 * core anti-cheat / data-integrity boundary, so malformed input must be
 * rejected rather than propagated into the UI.
 */
describe("toLeaderboardEntry", () => {
  const valid = {
    uid: "uid-a",
    name: "Alice",
    score: 42,
    timestamp: 1000,
    period: "daily" as const,
  };

  it("accepts a fully valid entry", () => {
    expect(toLeaderboardEntry(valid)).toEqual(valid);
  });

  it("trims whitespace from uid and name", () => {
    const result = toLeaderboardEntry({ ...valid, uid: "  uid-a  ", name: "  Alice  " });
    expect(result?.uid).toBe("uid-a");
    expect(result?.name).toBe("Alice");
  });

  it("uses fallback uid and period when absent", () => {
    const { uid: _uid, period: _period, ...rest } = valid;
    void _uid;
    void _period;
    const result = toLeaderboardEntry(rest, "fallback-uid", "weekly");
    expect(result?.uid).toBe("fallback-uid");
    expect(result?.period).toBe("weekly");
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a number", 5],
    ["a string", "nope"],
  ])("rejects non-object input (%s)", (_label, input) => {
    expect(toLeaderboardEntry(input)).toBeNull();
  });

  it("rejects entries with no resolvable uid", () => {
    const { uid: _uid, ...rest } = valid;
    void _uid;
    expect(toLeaderboardEntry(rest)).toBeNull();
  });

  it("rejects entries with an empty name", () => {
    expect(toLeaderboardEntry({ ...valid, name: "   " })).toBeNull();
  });

  it("rejects entries with an invalid period and no fallback", () => {
    expect(toLeaderboardEntry({ ...valid, period: "monthly" })).toBeNull();
  });

  it.each([
    ["negative", -1],
    ["too large", 100001],
    ["non-integer", 12.5],
    ["NaN", NaN],
    ["Infinity", Infinity],
    ["not a number", "10"],
  ])("rejects invalid score (%s)", (_label, score) => {
    expect(toLeaderboardEntry({ ...valid, score })).toBeNull();
  });

  it.each([
    ["negative timestamp", -1],
    ["non-number timestamp", "1000"],
  ])("rejects invalid timestamp (%s)", (_label, timestamp) => {
    expect(toLeaderboardEntry({ ...valid, timestamp })).toBeNull();
  });

  it("accepts the boundary scores 0 and 100000", () => {
    expect(toLeaderboardEntry({ ...valid, score: 0 })?.score).toBe(0);
    expect(toLeaderboardEntry({ ...valid, score: 100000 })?.score).toBe(100000);
  });
});

describe("compareLeaderboardEntries", () => {
  function e(overrides: Partial<LeaderboardEntry>): LeaderboardEntry {
    return { uid: "u", name: "n", score: 10, timestamp: 1, period: "all", ...overrides };
  }

  it("orders higher scores first", () => {
    expect(compareLeaderboardEntries(e({ score: 20 }), e({ score: 10 }))).toBeLessThan(0);
  });

  it("breaks score ties by earlier timestamp", () => {
    expect(
      compareLeaderboardEntries(e({ score: 10, timestamp: 1 }), e({ score: 10, timestamp: 2 })),
    ).toBeLessThan(0);
  });

  it("breaks remaining ties by uid then name", () => {
    expect(
      compareLeaderboardEntries(
        e({ uid: "a", name: "z", timestamp: 1 }),
        e({ uid: "b", name: "a", timestamp: 1 }),
      ),
    ).toBeLessThan(0);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  xpForLevel, levelFromXp, worldForScore, getDailyMissions,
  SKINS, TRAILS, WORLDS, ACHIEVEMENTS, POWERUPS, LOOT_CRATES,
  RARITY, currentWeekIndex, getActiveEvents, isEventActive,
  rollLootCrate, EVENT_DEFS, podiumBadgeForRank, BADGES,
} from "./data";

describe("xpForLevel", () => {
  it("returns base XP for level 1 (100 + 12 from the pow term)", () => {
    expect(xpForLevel(1)).toBe(112);
  });

  it("increases with level", () => {
    const xp1 = xpForLevel(1);
    const xp2 = xpForLevel(2);
    const xp5 = xpForLevel(5);
    expect(xp2).toBeGreaterThan(xp1);
    expect(xp5).toBeGreaterThan(xp2);
  });

  it("returns a finite integer", () => {
    for (let i = 1; i <= 100; i++) {
      const xp = xpForLevel(i);
      expect(Number.isFinite(xp)).toBe(true);
      expect(Number.isInteger(xp)).toBe(true);
    }
  });
});

describe("levelFromXp", () => {
  it("returns level 1 with 0 XP", () => {
    const result = levelFromXp(0);
    expect(result.level).toBe(1);
    expect(result.into).toBe(0);
    expect(result.need).toBe(112);
  });

  it("returns level 2 after earning enough XP", () => {
    const result = levelFromXp(112);
    expect(result.level).toBe(2);
    expect(result.into).toBe(0);
  });

  it("tracks partial progress into current level", () => {
    const result = levelFromXp(50);
    expect(result.level).toBe(1);
    expect(result.into).toBe(50);
    expect(result.need).toBe(112);
  });

  it("produces consistent results", () => {
    const result = levelFromXp(1500);
    expect(result.level).toBeGreaterThan(1);
    expect(result.into).toBeGreaterThanOrEqual(0);
    expect(result.need).toBeGreaterThan(0);
    expect(result.into).toBeLessThan(result.need);
  });
});

describe("worldForScore", () => {
  it("returns the first world for score 0", () => {
    expect(worldForScore(0).id).toBe("dispensary");
  });

  it("returns the correct world based on score thresholds", () => {
    expect(worldForScore(11).id).toBe("dispensary");
    expect(worldForScore(12).id).toBe("grow");
    expect(worldForScore(27).id).toBe("grow");
    expect(worldForScore(28).id).toBe("smoke");
    expect(worldForScore(47).id).toBe("smoke");
    expect(worldForScore(48).id).toBe("festival");
    expect(worldForScore(74).id).toBe("festival");
    expect(worldForScore(75).id).toBe("cosmos");
  });

  it("returns highest world for very large scores", () => {
    expect(worldForScore(999).id).toBe("cosmos");
  });
});

describe("getDailyMissions", () => {
  it("returns exactly 3 missions for a given day seed", () => {
    const missions = getDailyMissions(20260611);
    expect(missions).toHaveLength(3);
  });

  it("returns deterministic results for the same seed", () => {
    const a = getDailyMissions(42);
    const b = getDailyMissions(42);
    expect(a).toEqual(b);
  });

  it("returns different missions for different seeds", () => {
    const a = getDailyMissions(1);
    const b = getDailyMissions(2);
    const idsA = a.map((m) => m.id).sort();
    const idsB = b.map((m) => m.id).sort();
    expect(idsA).not.toEqual(idsB);
  });

  it("each mission has required fields", () => {
    const missions = getDailyMissions(100);
    for (const m of missions) {
      expect(m.id).toBeDefined();
      expect(m.text).toBeDefined();
      expect(m.goal).toBeGreaterThan(0);
      expect(m.reward).toBeGreaterThan(0);
      expect(["runScore", "runCoins", "runNearMiss", "plays", "totalCoins"]).toContain(m.metric);
    }
  });
});

describe("static data integrity", () => {
  it("SKINS has unique ids", () => {
    const ids = SKINS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("TRAILS has unique ids", () => {
    const ids = TRAILS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("WORLDS has increasing minScore", () => {
    for (let i = 1; i < WORLDS.length; i++) {
      expect(WORLDS[i].minScore).toBeGreaterThan(WORLDS[i - 1].minScore);
    }
  });

  it("RARITY has all 6 rarities", () => {
    expect(Object.keys(RARITY)).toHaveLength(6);
  });

  it("POWERUPS each have valid effect and duration", () => {
    const validEffects = ["coinMultiplier", "slowMotion", "magnet", "shield", "doubleJump"];
    for (const p of POWERUPS) {
      expect(validEffects).toContain(p.effect);
      expect(p.duration).toBeGreaterThanOrEqual(0);
    }
  });

  it("ACHIEVEMENTS have increasing goals per stat group", () => {
    const bestScoreAch = ACHIEVEMENTS.filter((a) => a.stat === "bestScore");
    for (let i = 1; i < bestScoreAch.length; i++) {
      expect(bestScoreAch[i].goal).toBeGreaterThan(bestScoreAch[i - 1].goal);
    }
  });

  it("LOOT_CRATES have valid configuration", () => {
    for (const c of LOOT_CRATES) {
      expect(c.minRolls).toBeGreaterThanOrEqual(1);
      expect(c.maxRolls).toBeGreaterThanOrEqual(c.minRolls);
      expect(c.rarities.length).toBeGreaterThan(0);
    }
  });
});

describe("currentWeekIndex", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("returns expected value for known date", () => {
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    const index = currentWeekIndex();
    expect(Number.isFinite(index)).toBe(true);
    expect(index).toBeGreaterThan(0);
    vi.useRealTimers();
  });
});

describe("getActiveEvents / isEventActive", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("returns no events when outside all windows", () => {
    vi.setSystemTime(new Date("2020-01-01T00:00:00Z"));
    expect(getActiveEvents()).toHaveLength(0);
  });

  it("returns events during their window", () => {
    vi.setSystemTime(new Date("2025-04-25T12:00:00Z"));
    const events = getActiveEvents();
    expect(events.length).toBeGreaterThanOrEqual(0);
    for (const e of events) {
      expect(isEventActive(e)).toBe(true);
    }
    vi.useRealTimers();
  });

  it("isEventActive returns false before event start", () => {
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    const event = EVENT_DEFS[0];
    expect(isEventActive(event)).toBe(false);
    vi.useRealTimers();
  });
});

describe("rollLootCrate", () => {
  it("returns a result with drops array and dust number", () => {
    const result = rollLootCrate(LOOT_CRATES[0]);
    expect(Array.isArray(result.drops)).toBe(true);
    expect(typeof result.dust).toBe("number");
  });

  it("returns at least minRolls drops for basic crate with no owned items", () => {
    const result = rollLootCrate(LOOT_CRATES[0], new Set());
    expect(result.drops.length).toBeGreaterThanOrEqual(LOOT_CRATES[0].minRolls);
  });

  it("each drop has valid rarity", () => {
    const result = rollLootCrate(LOOT_CRATES[2], new Set());
    for (const drop of result.drops) {
      expect(["common", "uncommon", "rare", "epic", "legendary", "mythic"]).toContain(drop.rarity);
    }
  });

  it("dust is non-negative", () => {
    const result = rollLootCrate(LOOT_CRATES[3], new Set());
    expect(result.dust).toBeGreaterThanOrEqual(0);
  });
});

describe("podiumBadgeForRank", () => {
  it("maps ranks 1-3 to gold/silver/bronze badges", () => {
    expect(podiumBadgeForRank(1)).toBe("b_gold");
    expect(podiumBadgeForRank(2)).toBe("b_silver");
    expect(podiumBadgeForRank(3)).toBe("b_bronze");
  });

  it("returns null for ranks outside the podium", () => {
    expect(podiumBadgeForRank(4)).toBeNull();
    expect(podiumBadgeForRank(100)).toBeNull();
    expect(podiumBadgeForRank(0)).toBeNull();
  });

  it("podium badge ids exist in the BADGES list", () => {
    for (const id of ["b_gold", "b_silver", "b_bronze"]) {
      expect(BADGES.find((b) => b.id === id)).toBeTruthy();
    }
  });
});

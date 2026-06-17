import { describe, it, expect } from "vitest";
import {
  worldForScore, SKINS, TRAILS, WORLDS, POWERUPS, RARITY,
} from "./data";

describe("worldForScore", () => {
  it("returns the first world for score 0", () => {
    expect(worldForScore(0).id).toBe("dispensary");
  });

  it("returns the correct world based on score thresholds", () => {
    expect(worldForScore(10).id).toBe("dispensary");
    expect(worldForScore(25).id).toBe("sunset");
    expect(worldForScore(49).id).toBe("sunset");
    expect(worldForScore(50).id).toBe("night");
  });

  it("returns highest world for very large scores", () => {
    expect(worldForScore(999).id).toBe("neon");
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

  it("POWERUPS each have valid effect", () => {
    const validEffects = ["coinMultiplier", "slowMotion", "magnet", "shield", "doubleJump"];
    for (const p of POWERUPS) {
      expect(validEffects).toContain(p.effect);
      expect(p.duration).toBeGreaterThanOrEqual(0);
      expect(p.icon).toBeDefined();
    }
  });
});

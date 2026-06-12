import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PowerUpManager } from "./powerups";

/**
 * PowerUpManager unit tests.
 *
 * These exercise the pure power-up state machine that drives in-run modifiers.
 * `performance.now()` is mocked so timed power-ups can be advanced
 * deterministically without relying on wall-clock timing.
 */

let nowValue = 0;

function advance(ms: number) {
  nowValue += ms;
}

describe("PowerUpManager", () => {
  let mgr: PowerUpManager;

  beforeEach(() => {
    nowValue = 0;
    vi.spyOn(performance, "now").mockImplementation(() => nowValue);
    mgr = new PowerUpManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns neutral modifiers when nothing is active", () => {
    const mods = mgr.getModifiers();
    expect(mods).toEqual({
      coinMult: 1,
      speedMult: 1,
      gravityMult: 1,
      magnetRadius: 0,
      shieldHits: 0,
      doubleJumpAvailable: false,
    });
  });

  it("ignores unknown power-up ids", () => {
    expect(mgr.activate("does_not_exist")).toBe(false);
    expect(mgr.getActive()).toHaveLength(0);
  });

  it("activates a coin multiplier (2x) and reflects it in modifiers", () => {
    expect(mgr.activate("pu_coin")).toBe(true);
    expect(mgr.getModifiers().coinMult).toBe(2);
  });

  it("uses the stronger coin multiplier (3x) for pu_coin2", () => {
    mgr.activate("pu_coin2");
    expect(mgr.getModifiers().coinMult).toBe(3);
  });

  it("does not stack the same power-up twice", () => {
    expect(mgr.activate("pu_coin")).toBe(true);
    expect(mgr.activate("pu_coin")).toBe(false);
    expect(mgr.getActive()).toHaveLength(1);
  });

  it("applies slow motion to speed and gravity", () => {
    mgr.activate("pu_slow");
    const mods = mgr.getModifiers();
    expect(mods.speedMult).toBeCloseTo(0.5);
    expect(mods.gravityMult).toBeCloseTo(0.6);
  });

  it("applies extreme slow motion for pu_slow2", () => {
    mgr.activate("pu_slow2");
    const mods = mgr.getModifiers();
    expect(mods.speedMult).toBeCloseTo(0.3);
    expect(mods.gravityMult).toBeCloseTo(0.4);
  });

  it("sets magnet radius when magnet power-up is active", () => {
    mgr.activate("pu_magnet");
    expect(mgr.getModifiers().magnetRadius).toBe(80);
  });

  it("expires timed power-ups after their duration", () => {
    mgr.activate("pu_coin"); // 20s duration
    expect(mgr.getModifiers().coinMult).toBe(2);

    advance(19_000);
    mgr.update();
    expect(mgr.getModifiers().coinMult).toBe(2);

    advance(2_000); // now past 20s
    mgr.update();
    expect(mgr.getModifiers().coinMult).toBe(1);
    expect(mgr.getActive()).toHaveLength(0);
  });

  describe("shields", () => {
    it("grants one shield hit for pu_shield", () => {
      mgr.activate("pu_shield");
      expect(mgr.getShieldHits()).toBe(1);
      expect(mgr.getModifiers().shieldHits).toBe(1);
    });

    it("grants three shield hits for pu_mega", () => {
      mgr.activate("pu_mega");
      expect(mgr.getShieldHits()).toBe(3);
    });

    it("consumes shield hits one at a time", () => {
      mgr.activate("pu_mega");
      expect(mgr.consumeShield()).toBe(true);
      expect(mgr.consumeShield()).toBe(true);
      expect(mgr.consumeShield()).toBe(true);
      expect(mgr.consumeShield()).toBe(false);
      expect(mgr.getShieldHits()).toBe(0);
    });

    it("does not place shields into the active timed list", () => {
      mgr.activate("pu_shield");
      expect(mgr.getActive()).toHaveLength(0);
    });
  });

  describe("double jump", () => {
    it("becomes available when activated and unused", () => {
      mgr.activate("pu_double");
      expect(mgr.isDoubleJumpAvailable()).toBe(true);
      expect(mgr.getModifiers().doubleJumpAvailable).toBe(true);
    });

    it("is consumed by useDoubleJump and resettable", () => {
      mgr.activate("pu_double");
      expect(mgr.useDoubleJump()).toBe(true);
      expect(mgr.isDoubleJumpAvailable()).toBe(false);
      // second call fails until reset
      expect(mgr.useDoubleJump()).toBe(false);

      mgr.resetDoubleJump();
      expect(mgr.isDoubleJumpAvailable()).toBe(true);
    });

    it("cannot be used when no double jump power-up is active", () => {
      expect(mgr.useDoubleJump()).toBe(false);
    });
  });

  describe("getRemainingTime", () => {
    it("returns 0 for an inactive power-up", () => {
      expect(mgr.getRemainingTime("pu_coin")).toBe(0);
    });

    it("counts down toward zero", () => {
      mgr.activate("pu_coin"); // 20s
      expect(mgr.getRemainingTime("pu_coin")).toBe(20_000);
      advance(5_000);
      expect(mgr.getRemainingTime("pu_coin")).toBe(15_000);
      advance(100_000);
      expect(mgr.getRemainingTime("pu_coin")).toBe(0);
    });
  });

  describe("reset", () => {
    it("clears all active power-ups, shields and double-jump state", () => {
      mgr.activate("pu_coin");
      mgr.activate("pu_mega");
      mgr.activate("pu_double");
      mgr.useDoubleJump();

      mgr.reset();

      expect(mgr.getActive()).toHaveLength(0);
      expect(mgr.getShieldHits()).toBe(0);
      expect(mgr.getModifiers().coinMult).toBe(1);
      expect(mgr.isDoubleJumpAvailable()).toBe(false);
    });
  });

  it("returns a defensive copy from getActive", () => {
    mgr.activate("pu_coin");
    const active = mgr.getActive();
    active.pop();
    expect(mgr.getActive()).toHaveLength(1);
  });
});

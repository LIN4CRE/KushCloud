import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PowerUpManager } from "./powerups";

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
      magnetRadius: 0,
      shieldHits: 0,
      doubleJumpAvailable: false,
    });
  });

  it("ignores unknown power-up ids", () => {
    expect(mgr.activate("does_not_exist")).toBe(false);
    expect(mgr.getActive()).toHaveLength(0);
  });

  it("activates coin multiplier and reflects it in modifiers", () => {
    expect(mgr.activate("double")).toBe(true);
    expect(mgr.getModifiers().coinMult).toBe(2);
  });

  it("does not stack the same power-up twice", () => {
    expect(mgr.activate("double")).toBe(true);
    expect(mgr.activate("double")).toBe(false);
    expect(mgr.getActive()).toHaveLength(1);
  });

  it("sets magnet radius when magnet power-up is active", () => {
    mgr.activate("magnet");
    expect(mgr.getModifiers().magnetRadius).toBe(80);
  });

  it("expires timed power-ups after their duration", () => {
    mgr.activate("double");
    expect(mgr.getModifiers().coinMult).toBe(2);

    advance(7_000);
    mgr.update();
    expect(mgr.getModifiers().coinMult).toBe(2);

    advance(2_000);
    mgr.update();
    expect(mgr.getModifiers().coinMult).toBe(1);
    expect(mgr.getActive()).toHaveLength(0);
  });

  describe("shields", () => {
    it("grants one shield hit for invincible", () => {
      mgr.activate("invincible");
      expect(mgr.getShieldHits()).toBe(1);
      expect(mgr.getModifiers().shieldHits).toBe(1);
    });

    it("consumes shield hits one at a time", () => {
      mgr.activate("invincible");
      expect(mgr.consumeShield()).toBe(true);
      expect(mgr.consumeShield()).toBe(false);
      expect(mgr.getShieldHits()).toBe(0);
    });

    it("does not place shields into the active timed list", () => {
      mgr.activate("invincible");
      expect(mgr.getActive()).toHaveLength(0);
    });
  });

  describe("double jump", () => {
    it("becomes available when activated and unused", () => {
      mgr.activate("ghost");
      expect(mgr.isDoubleJumpAvailable()).toBe(true);
      expect(mgr.getModifiers().doubleJumpAvailable).toBe(true);
    });

    it("is consumed by useDoubleJump and resettable", () => {
      mgr.activate("ghost");
      expect(mgr.useDoubleJump()).toBe(true);
      expect(mgr.isDoubleJumpAvailable()).toBe(false);
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
      expect(mgr.getRemainingTime("double")).toBe(0);
    });

    it("counts down toward zero", () => {
      mgr.activate("double");
      expect(mgr.getRemainingTime("double")).toBe(8_000);
      advance(3_000);
      expect(mgr.getRemainingTime("double")).toBe(5_000);
      advance(100_000);
      expect(mgr.getRemainingTime("double")).toBe(0);
    });
  });

  describe("reset", () => {
    it("clears all active power-ups, shields and double-jump state", () => {
      mgr.activate("double");
      mgr.activate("invincible");
      mgr.activate("ghost");
      mgr.useDoubleJump();

      mgr.reset();

      expect(mgr.getActive()).toHaveLength(0);
      expect(mgr.getShieldHits()).toBe(0);
      expect(mgr.getModifiers().coinMult).toBe(1);
      expect(mgr.isDoubleJumpAvailable()).toBe(false);
    });
  });

  it("returns a defensive copy from getActive", () => {
    mgr.activate("double");
    const active = mgr.getActive();
    active.pop();
    expect(mgr.getActive()).toHaveLength(1);
  });
});

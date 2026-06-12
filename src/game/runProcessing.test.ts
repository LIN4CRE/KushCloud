import { describe, expect, it } from "vitest";
import type { RunResult } from "./engine";
import { applyCompletedRun } from "./runProcessing";
import { migrateSave } from "./storage";

function makeSave() {
  return migrateSave({
    version: 4,
    playerName: "Tester",
    seenTutorial: true,
    processedRunIds: [],
  });
}

function makeRun(overrides: Partial<RunResult> = {}): RunResult {
  return {
    runId: "run-1",
    score: 10,
    coins: 2,
    nearMiss: 1,
    perfectPasses: 1,
    bestCombo: 2,
    durationMs: 3000,
    flaps: 6,
    ...overrides,
  };
}

describe("applyCompletedRun", () => {
  it("records a run only once per runId", () => {
    const save = makeSave();
    const run = makeRun();

    const first = applyCompletedRun(save, run);
    const second = applyCompletedRun(save, run);

    expect(first.summary.status).toBe("recorded");
    expect(second.summary.status).toBe("duplicate");
    expect(save.stats.totalGames).toBe(1);
    expect(save.stats.totalScore).toBe(10);
    expect(save.scoreHistory).toEqual([10]);
    expect(save.processedRunIds).toEqual(["run-1"]);
    expect(second.submissions).toEqual([]);
  });

  it("does not submit or count invalid runs", () => {
    const save = makeSave();
    const result = applyCompletedRun(save, makeRun({ score: Number.POSITIVE_INFINITY }));

    expect(result.summary.status).toBe("invalid");
    expect(result.summary.valid).toBe(false);
    expect(result.submissions).toEqual([]);
    expect(save.stats.totalGames).toBe(0);
    expect(save.scoreHistory).toEqual([]);
  });

  it("creates one submit intent for each period when a valid run sets a best score", () => {
    const save = makeSave();
    save.stats.bestScore = 5;

    const result = applyCompletedRun(save, makeRun({ score: 12, durationMs: 4000 }));

    expect(result.summary.newBest).toBe(true);
    expect(result.submissions).toEqual([
      { period: "daily", score: 12 },
      { period: "weekly", score: 12 },
      { period: "all", score: 12 },
    ]);
  });

  it("rejects empty runId", () => {
    const save = makeSave();
    const result = applyCompletedRun(save, makeRun({ runId: "" }));
    expect(result.summary.status).toBe("invalid");
    expect(result.summary.valid).toBe(false);
  });

  it("rejects negative score", () => {
    const save = makeSave();
    const result = applyCompletedRun(save, makeRun({ score: -5 }));
    expect(result.summary.status).toBe("invalid");
    expect(save.stats.totalGames).toBe(0);
  });

  it("accepts zero-score run as valid", () => {
    const save = makeSave();
    const result = applyCompletedRun(save, makeRun({ score: 0, coins: 0, nearMiss: 0, perfectPasses: 0, bestCombo: 0 }));
    expect(result.summary.status).toBe("recorded");
    expect(result.summary.valid).toBe(true);
    expect(save.stats.totalGames).toBe(1);
    expect(save.stats.totalScore).toBe(0);
  });

  it("calculates coins correctly", () => {
    const save = makeSave();
    const result = applyCompletedRun(save, makeRun({ score: 20, coins: 5, nearMiss: 3 }));
    expect(result.summary.status).toBe("recorded");
    // coinsGained = Math.round(run.coins * 10 * coinBoost) + run.score * 2
    // With default coinBoost of 1.0: Math.round(5 * 10 * 1) + 20 * 2 = 50 + 40 = 90
    expect(save.stats.totalCoins).toBeGreaterThanOrEqual(90);
  });

  it("calculates XP correctly", () => {
    const save = makeSave();
    const result = applyCompletedRun(save, makeRun({ score: 20, coins: 5, nearMiss: 3 }));
    expect(result.summary.status).toBe("recorded");
    // xpGained = Math.round((20 * 10 + 5 * 5 + 3 * 8 + 5) * xpBoost)
    // With default xpBoost 1.0: Math.round(200 + 25 + 24 + 5) = 254
    expect(save.xp).toBeGreaterThanOrEqual(254);
  });

  it("awards bonus XP for clutch escapes", () => {
    const baseline = makeSave();
    applyCompletedRun(baseline, makeRun({ runId: "base", score: 20, coins: 5, nearMiss: 3, clutch: 0 }));

    const withClutch = makeSave();
    applyCompletedRun(withClutch, makeRun({ runId: "clutch", score: 20, coins: 5, nearMiss: 3, clutch: 4 }));

    // 4 clutches × 15 XP = +60 base XP (before any weekly multiplier), so the
    // clutch run must earn strictly more XP than the identical no-clutch run.
    expect(withClutch.xp).toBeGreaterThan(baseline.xp);
  });

  it("caps the clutch XP bonus at the run score (anti-exploit)", () => {
    const inflated = makeSave();
    // Absurd clutch count far above score should be clamped to `score`.
    applyCompletedRun(inflated, makeRun({ runId: "x", score: 5, coins: 0, nearMiss: 0, clutch: 9999 }));

    const clamped = makeSave();
    applyCompletedRun(clamped, makeRun({ runId: "y", score: 5, coins: 0, nearMiss: 0, clutch: 5 }));

    // Both should yield the same XP because clutch is clamped to score (5).
    expect(inflated.xp).toBe(clamped.xp);
  });

  it("treats a missing clutch field as zero", () => {
    const save = makeSave();
    const result = applyCompletedRun(save, makeRun({ score: 10 }));
    expect(result.summary.status).toBe("recorded");
    expect(save.xp).toBeGreaterThan(0);
  });

  it("auto-awards the First Flight badge on the first game", () => {
    const save = makeSave();
    expect(save.ownedBadges).not.toContain("b_first");
    const result = applyCompletedRun(save, makeRun({ score: 5 }));
    expect(result.summary.status).toBe("recorded");
    expect(save.ownedBadges).toContain("b_first");
    expect(result.summary.badges).toContain("First Flight");
  });

  it("awards a milestone score badge when the best score crosses the threshold", () => {
    const save = makeSave();
    const result = applyCompletedRun(save, makeRun({ runId: "hi", score: 55, coins: 0, nearMiss: 0, flaps: 30 }));
    expect(result.summary.status).toBe("recorded");
    expect(save.ownedBadges).toContain("b_score50");
    expect(result.summary.badges).toContain("Sky High");
  });

  it("does not re-award a badge that is already owned", () => {
    const save = makeSave();
    applyCompletedRun(save, makeRun({ runId: "a", score: 5 }));
    const before = [...save.ownedBadges];
    const second = applyCompletedRun(save, makeRun({ runId: "b", score: 6 }));
    // b_first should not be listed again
    expect(second.summary.badges).not.toContain("First Flight");
    expect(save.ownedBadges.filter((id) => id === "b_first")).toHaveLength(1);
    expect(save.ownedBadges).toEqual(expect.arrayContaining(before));
  });

  it("awards the Perfect Run badge for a clean run with perfects and no misses", () => {
    const save = makeSave();
    const result = applyCompletedRun(save, makeRun({ runId: "perf", score: 12, nearMiss: 0, perfectPasses: 4, flaps: 12 }));
    expect(result.summary.status).toBe("recorded");
    expect(save.ownedBadges).toContain("b_perfect");
  });

  it("tracks daily plays", () => {
    const save = makeSave();
    applyCompletedRun(save, makeRun({ runId: "r1", score: 5 }));
    applyCompletedRun(save, makeRun({ runId: "r2", score: 10 }));
    expect(save.dailyPlays).toBe(2);
  });

  it("caps scoreHistory at 100 entries", () => {
    const save = makeSave();
    // Fill history to 100 with consistent durations
    for (let i = 0; i < 100; i++) {
      applyCompletedRun(save, makeRun({ runId: `r${i}`, score: i + 1, durationMs: 3000 + (i + 1) * 100 }));
    }
    expect(save.scoreHistory.length).toBe(100);
    // Add one more - should cap at 100
    applyCompletedRun(save, makeRun({ runId: "r100", score: 101, durationMs: 13000 }));
    expect(save.scoreHistory.length).toBe(100);
    // First entry should be shifted out (was score 1)
    expect(save.scoreHistory[0]).toBe(2);
    expect(save.scoreHistory[99]).toBe(101);
  });

  it("updates bestCombo", () => {
    const save = makeSave();
    applyCompletedRun(save, makeRun({ bestCombo: 5 }));
    expect(save.stats.bestCombo).toBe(5);
    applyCompletedRun(save, makeRun({ runId: "r2", bestCombo: 3 }));
    expect(save.stats.bestCombo).toBe(5); // Not updated since 3 < 5
    applyCompletedRun(save, makeRun({ runId: "r3", bestCombo: 10 }));
    expect(save.stats.bestCombo).toBe(10);
  });

  it("tracks nearMisses", () => {
    const save = makeSave();
    applyCompletedRun(save, makeRun({ nearMiss: 7 }));
    expect(save.stats.totalNearMiss).toBe(7);
  });

  it("tracks perfect passes", () => {
    const save = makeSave();
    applyCompletedRun(save, makeRun({ perfectPasses: 3 }));
    expect(save.stats.totalPerfectPasses).toBe(3);
  });

  it("returns newBest as true when score beats previous best", () => {
    const save = makeSave();
    save.stats.bestScore = 5;
    const result = applyCompletedRun(save, makeRun({ score: 20, durationMs: 5000 }));
    expect(result.summary.newBest).toBe(true);
  });

  it("returns newBest as false when score does not beat previous best", () => {
    const save = makeSave();
    save.stats.bestScore = 100;
    const result = applyCompletedRun(save, makeRun({ score: 10, durationMs: 3000 }));
    expect(result.summary.newBest).toBe(false);
    expect(result.submissions).toEqual([]); // No leaderboard submissions
  });

  it("processes multiple different runIds sequentially", () => {
    const save = makeSave();
    const r1 = applyCompletedRun(save, makeRun({ runId: "r1", score: 10 }));
    const r2 = applyCompletedRun(save, makeRun({ runId: "r2", score: 20 }));
    const r3 = applyCompletedRun(save, makeRun({ runId: "r3", score: 30 }));
    expect(r1.summary.status).toBe("recorded");
    expect(r2.summary.status).toBe("recorded");
    expect(r3.summary.status).toBe("recorded");
    expect(save.stats.totalGames).toBe(3);
    expect(save.stats.totalScore).toBe(60);
  });
});

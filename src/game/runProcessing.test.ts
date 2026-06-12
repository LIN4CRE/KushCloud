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

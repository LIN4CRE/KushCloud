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
});

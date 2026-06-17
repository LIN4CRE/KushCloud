import { describe, expect, it, beforeEach } from "vitest";
import { applyCompletedRun } from "./runProcessing";
import { loadSave, dayNumber, type SaveData } from "./storage";

function makeRun(overrides: Partial<{
  runId: string; score: number; coins: number; nearMiss: number;
  perfectPasses: number; bestCombo: number; durationMs: number; flaps: number;
}> = {}) {
  return {
    runId: "run-00001",
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

function makeSave(): SaveData {
  const s = loadSave();
  s.playerName = "Tester";
  s.stats.bestScore = 0;
  s.stats.totalGames = 0;
  s.stats.totalScore = 0;
  s.stats.totalCoins = 0;
  s.stats.totalNearMiss = 0;
  s.stats.totalPerfectPasses = 0;
  s.stats.bestCombo = 0;
  s.stats.totalFlaps = 0;
  s.coins = 0;
  return s;
}

describe("applyCompletedRun", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("records a run only once per runId", () => {
    const save = makeSave();
    const run = makeRun();

    const first = applyCompletedRun(save, run);
    const second = applyCompletedRun(save, run);

    expect(first.status).toBe("recorded");
    expect(second.status).toBe("duplicate");
    expect(save.stats.totalGames).toBe(1);
    expect(save.stats.totalScore).toBe(10);
  });

  it("does not count invalid runs", () => {
    const save = makeSave();
    const result = applyCompletedRun(save, makeRun({ score: Infinity }));
    expect(result.status).toBe("invalid");
    expect(result.valid).toBe(false);
    expect(save.stats.totalGames).toBe(0);
  });

  it("rejects empty runId", () => {
    const save = makeSave();
    const result = applyCompletedRun(save, makeRun({ runId: "" }));
    expect(result.status).toBe("invalid");
    expect(result.valid).toBe(false);
  });

  it("rejects negative score", () => {
    const save = makeSave();
    const result = applyCompletedRun(save, makeRun({ score: -5 }));
    expect(result.status).toBe("invalid");
    expect(save.stats.totalGames).toBe(0);
  });

  it("accepts zero-score run as valid", () => {
    const save = makeSave();
    const result = applyCompletedRun(save, makeRun({ score: 0, coins: 0 }));
    expect(result.status).toBe("recorded");
    expect(result.valid).toBe(true);
    expect(save.stats.totalGames).toBe(1);
  });

  it("calculates coins correctly", () => {
    const save = makeSave();
    const result = applyCompletedRun(save, makeRun({ score: 20, coins: 5 }));
    expect(result.status).toBe("recorded");
    expect(save.stats.totalCoins).toBeGreaterThanOrEqual(90);
    expect(save.coins).toBeGreaterThanOrEqual(90);
  });

  it("updates bestCombo", () => {
    const save = makeSave();
    applyCompletedRun(save, makeRun({ bestCombo: 5 }));
    expect(save.stats.bestCombo).toBe(5);
    applyCompletedRun(save, makeRun({ runId: "run-00002", bestCombo: 3 }));
    expect(save.stats.bestCombo).toBe(5);
    applyCompletedRun(save, makeRun({ runId: "run-00003", bestCombo: 10 }));
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
    const result = applyCompletedRun(save, makeRun({ score: 20 }));
    expect(result.newBest).toBe(true);
    expect(save.stats.bestScore).toBe(20);
  });

  it("returns newBest as false when score does not beat previous best", () => {
    const save = makeSave();
    save.stats.bestScore = 100;
    const result = applyCompletedRun(save, makeRun({ score: 10 }));
    expect(result.newBest).toBe(false);
    expect(save.stats.bestScore).toBe(100);
  });

  it("processes multiple different runIds sequentially", () => {
    const save = makeSave();
    applyCompletedRun(save, makeRun({ runId: "run-00001", score: 10 }));
    applyCompletedRun(save, makeRun({ runId: "run-00002", score: 20 }));
    applyCompletedRun(save, makeRun({ runId: "run-00003", score: 30 }));
    expect(save.stats.totalGames).toBe(3);
    expect(save.stats.totalScore).toBe(60);
  });

  it("updates lastDay to current day number", () => {
    const save = makeSave();
    const before = save.lastDay;
    applyCompletedRun(save, makeRun({ runId: "run-daytest", score: 1 }));
    expect(save.lastDay).toBe(dayNumber());
  });
});

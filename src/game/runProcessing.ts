import { type SaveData, dayNumber } from "./storage";
import type { RunResult } from "./engine";

export type { RunResult } from "./engine";

export interface RunSummary {
  coinsGained: number;
  newBest: boolean;
  valid: boolean;
  status: "recorded" | "duplicate" | "invalid";
}

const DUPE_KEY = "kushcloud_processed_runs";

function isDuplicate(runId: string): boolean {
  try {
    const processed: string[] = JSON.parse(localStorage.getItem(DUPE_KEY) || "[]");
    return processed.includes(runId);
  } catch {
    return false;
  }
}

function markProcessed(runId: string) {
  try {
    const processed: string[] = JSON.parse(localStorage.getItem(DUPE_KEY) || "[]");
    const next = [...processed, runId].slice(-200);
    localStorage.setItem(DUPE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function validateRun(score: number, durationMs: number, flaps: number, coins: number) {
  const valid = (
    Number.isFinite(score) && score >= 0 && score < 100000 &&
    Number.isFinite(durationMs) && durationMs >= 0 && durationMs < 86400000 &&
    Number.isFinite(flaps) && flaps >= 0 && flaps < 10000 &&
    Number.isFinite(coins) && coins >= 0 && coins < 10000
  );
  return { valid, reason: valid ? undefined : "invalid_run_data" as const };
}

export function applyCompletedRun(save: SaveData, run: RunResult): RunSummary {
  if (!run.runId || typeof run.runId !== "string" || run.runId.length < 8) {
    return { coinsGained: 0, newBest: false, valid: false, status: "invalid" };
  }

  if (isDuplicate(run.runId)) {
    return { coinsGained: 0, newBest: false, valid: true, status: "duplicate" };
  }

  const check = validateRun(run.score, run.durationMs, run.flaps, run.coins);
  if (!check.valid) {
    return { coinsGained: 0, newBest: false, valid: false, status: "invalid" };
  }

  markProcessed(run.runId);

  const newBest = run.score > save.stats.bestScore;
  const coinsGained = Math.round(run.coins * 10) + Math.round(run.score * 2);

  save.stats.totalGames += 1;
  save.stats.totalFlaps += run.flaps;
  save.stats.totalScore += run.score;
  save.stats.totalCoins += coinsGained;
  save.stats.totalNearMiss += run.nearMiss;
  save.stats.totalPerfectPasses += run.perfectPasses;
  save.stats.bestCombo = Math.max(save.stats.bestCombo, run.bestCombo);
  if (newBest) save.stats.bestScore = run.score;
  save.coins += coinsGained;
  save.lastDay = dayNumber();

  return { coinsGained, newBest, valid: true, status: "recorded" };
}

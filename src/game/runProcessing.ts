import type { RunResult } from "./engine";
import {
  ACHIEVEMENTS,
  WEEKLY_EVENTS,
  currentWeekIndex,
  getActiveEvents,
  getDailyMissions,
  levelFromXp,
} from "./data";
import { dayNumber, type SaveData, validateRun } from "./storage";
import type { LeaderboardPeriod } from "../config/firebase";

const PROCESSED_RUN_HISTORY_LIMIT = 100;

export type RunProcessStatus = "recorded" | "duplicate" | "invalid";

export interface RunSummary {
  xpGained: number;
  coinsGained: number;
  levelUpCoins: number;
  newBest: boolean;
  leveledUp: number[];
  achievements: string[];
  missions: string[];
  valid: boolean;
  rank: number;
  status: RunProcessStatus;
}

export interface RunSubmitIntent {
  period: LeaderboardPeriod;
  score: number;
}

export interface RunProcessResult {
  summary: RunSummary;
  submissions: RunSubmitIntent[];
  rankScore: number;
}

// Run tracking log for debugging and validation
interface RunLogEntry {
  runId: string;
  timestamp: number;
  action: "recorded" | "duplicate" | "invalid";
  reason?: string;
  score: number;
  totalGames: number;
}

const _runLog: RunLogEntry[] = [];
const MAX_LOG_SIZE = 200;

export function getRunLog(): readonly RunLogEntry[] {
  return _runLog;
}

function logRun(entry: RunLogEntry) {
  _runLog.push(entry);
  if (_runLog.length > MAX_LOG_SIZE) _runLog.shift();
  if (import.meta.env.DEV) {
    console.log(
      `[RunTracker] ${entry.action.toUpperCase()}: runId=${entry.runId.slice(0, 8)}... ` +
      `score=${entry.score} totalGames=${entry.totalGames}` +
      (entry.reason ? ` reason="${entry.reason}"` : "")
    );
  }
}

function emptySummary(status: RunProcessStatus, valid: boolean): RunSummary {
  return {
    xpGained: 0,
    coinsGained: 0,
    levelUpCoins: 0,
    newBest: false,
    leveledUp: [],
    achievements: [],
    missions: [],
    valid,
    rank: 1,
    status,
  };
}

function rememberProcessedRun(save: SaveData, runId: string) {
  save.processedRunIds = [...save.processedRunIds.filter((id) => id !== runId), runId]
    .slice(-PROCESSED_RUN_HISTORY_LIMIT);
}

/**
 * Check if a run is a likely duplicate based on score+duration fingerprinting.
 * Catches edge cases where runIds might be regenerated (e.g. app crash mid-processing).
 */
function isLikelyDuplicateRun(save: SaveData, run: RunResult): boolean {
  // If the run has identical characteristics to the most recent run in scoreHistory,
  // and it happened within 2 seconds, it's suspicious
  if (save.scoreHistory.length === 0) return false;
  const lastScore = save.scoreHistory[save.scoreHistory.length - 1];
  if (lastScore !== run.score) return false;
  // Score matches last recorded - check duration anomaly (very short run with same score)
  if (run.durationMs < 1000 && run.score > 0) return true;
  return false;
}

export function applyCompletedRun(save: SaveData, run: RunResult): RunProcessResult {
  const bestBeforeRun = save.stats.bestScore;

  if (!run.runId || typeof run.runId !== "string") {
    logRun({ runId: "INVALID", timestamp: Date.now(), action: "invalid", reason: "Missing or invalid runId", score: run.score, totalGames: save.stats.totalGames });
    return { summary: emptySummary("invalid", false), submissions: [], rankScore: bestBeforeRun };
  }

  if (save.processedRunIds.includes(run.runId)) {
    logRun({ runId: run.runId, timestamp: Date.now(), action: "duplicate", reason: "runId already in processedRunIds", score: run.score, totalGames: save.stats.totalGames });
    return { summary: emptySummary("duplicate", true), submissions: [], rankScore: bestBeforeRun };
  }

  const check = validateRun(run.score, run.durationMs, run.flaps, run.coins);
  rememberProcessedRun(save, run.runId);

  if (!check.valid) {
    logRun({ runId: run.runId, timestamp: Date.now(), action: "invalid", reason: check.reason, score: run.score, totalGames: save.stats.totalGames });
    return { summary: emptySummary("invalid", false), submissions: [], rankScore: bestBeforeRun };
  }

  // Additional fingerprint-based duplicate detection
  if (isLikelyDuplicateRun(save, run)) {
    logRun({ runId: run.runId, timestamp: Date.now(), action: "duplicate", reason: "Fingerprint match (score+duration anomaly)", score: run.score, totalGames: save.stats.totalGames });
    return { summary: emptySummary("duplicate", true), submissions: [], rankScore: bestBeforeRun };
  }

  const week = currentWeekIndex();
  const ev = WEEKLY_EVENTS[week % WEEKLY_EVENTS.length];
  const coinBoost = ev.coinBoost;
  const xpBoost = ev.xpBoost;
  // Combo Carnival: near-misses give extra combo bonus to XP
  const comboCarnivalBonus = ev.name === "Combo Carnival" ? run.nearMiss * 5 : 0;

  const beforeLevel = levelFromXp(save.xp).level;
  const coinsGained = Math.round(run.coins * 10 * coinBoost) + run.score * 2;
  const xpGained = Math.round((run.score * 10 + run.coins * 5 + run.nearMiss * 8 + comboCarnivalBonus + 5) * xpBoost);
  const projectedXp = save.xp + xpGained;
  const targetLevel = levelFromXp(projectedXp).level;
  const leveledUp: number[] = [];
  let levelUpCoins = 0;
  for (let level = beforeLevel + 1; level <= targetLevel; level++) {
    leveledUp.push(level);
    levelUpCoins += level * 5;
  }

  const achievements: string[] = [];
  const missions: string[] = [];
  const newBest = run.score > save.stats.bestScore;

  save.stats.totalGames += 1;
  save.stats.totalFlaps += run.flaps;
  save.stats.totalScore += run.score;
  save.stats.totalCoins += coinsGained;
  save.stats.totalNearMiss += run.nearMiss;
  save.stats.totalPerfectPasses += run.perfectPasses;
  save.stats.bestCombo = Math.max(save.stats.bestCombo, run.bestCombo);
  if (newBest) save.stats.bestScore = run.score;
  save.coins += coinsGained + levelUpCoins;
  save.xp += xpGained;
  save.seasonalXp += xpGained;
  save.scoreHistory.push(run.score);
  if (save.scoreHistory.length > 100) save.scoreHistory = save.scoreHistory.slice(-100);
  save.dailyPlays += 1;
  save.dailyCoins += run.coins;

  const todays = getDailyMissions(dayNumber());
  for (const mission of todays) {
    let progress = save.missions.find((p) => p.id === mission.id);
    if (!progress) {
      progress = { id: mission.id, progress: 0, claimed: false };
      save.missions.push(progress);
    }
    let value = progress.progress;
    if (mission.metric === "runScore") value = Math.max(value, run.score);
    else if (mission.metric === "runCoins") value = Math.max(value, run.coins);
    else if (mission.metric === "runNearMiss") value = Math.max(value, run.nearMiss);
    else if (mission.metric === "plays") value = save.dailyPlays;
    else if (mission.metric === "totalCoins") value = save.dailyCoins;
    const wasComplete = progress.progress >= mission.goal;
    progress.progress = value;
    if (!wasComplete && value >= mission.goal) missions.push(mission.text);
  }

  for (const achievement of ACHIEVEMENTS) {
    if (save.unlockedAchievements.includes(achievement.id)) continue;
    let value = 0;
    if (achievement.stat === "score") value = save.stats.bestScore;
    else if (achievement.stat === "ownedSkins") value = save.ownedSkins.length;
    else if (achievement.stat === "ownedTrails") value = save.ownedTrails.length;
    else if (achievement.stat === "ownedEffects") value = save.ownedEffects.length;
    else if (achievement.stat === "ownedBadges") value = save.ownedBadges.length;
    else if (achievement.stat === "ownedTitles") value = save.ownedTitles.length;
    else {
      // achievement.stat is keyof PlayerStats
      value = save.stats[achievement.stat as keyof typeof save.stats];
    }
    if (value >= achievement.goal) {
      save.unlockedAchievements.push(achievement.id);
      achievements.push(achievement.name);
    }
  }

  const activeEvents = getActiveEvents();
  for (const event of activeEvents) {
    const state = save.eventState[event.id] || (save.eventState[event.id] = {
      objectives: {},
      claimedObjectives: [],
      rewardTrackPoints: 0,
      claimedRewardTiers: [],
      lastRefreshDay: dayNumber(),
    });
    for (const objective of event.objectives) {
      if (state.claimedObjectives.includes(objective.id)) continue;
      let value = 0;
      if (objective.metric === "score") value = run.score;
      else if (objective.metric === "coins") value = coinsGained;
      else if (objective.metric === "nearMiss") value = run.nearMiss;
      else if (objective.metric === "combo") value = run.bestCombo;
      else if (objective.metric === "gamesPlayed") value = save.dailyPlays;
      else if (objective.metric === "totalCoins") value = save.stats.totalCoins;
      else if (objective.metric === "totalScore") value = save.stats.totalScore;
      else if (objective.metric === "cratesOpened") value = save.cratesOpened;

      const current = Math.max(state.objectives[objective.id] || 0, value);
      const wasIncomplete = (state.objectives[objective.id] || 0) < objective.goal;
      state.objectives[objective.id] = current;
      if (wasIncomplete && current >= objective.goal) state.rewardTrackPoints += objective.reward;
    }
  }

  const rankScore = save.stats.bestScore;
  const submissions: RunSubmitIntent[] = newBest && rankScore > 0
    ? [
        { period: "daily", score: rankScore },
        { period: "weekly", score: rankScore },
        { period: "all", score: rankScore },
      ]
    : [];

  logRun({
    runId: run.runId,
    timestamp: Date.now(),
    action: "recorded",
    score: run.score,
    totalGames: save.stats.totalGames,
  });

  return {
    summary: {
      xpGained,
      coinsGained,
      levelUpCoins,
      newBest,
      leveledUp,
      achievements,
      missions,
      valid: true,
      rank: 1,
      status: "recorded",
    },
    submissions,
    rankScore,
  };
}

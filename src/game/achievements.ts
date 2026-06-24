import { type RunResult } from "./engine";
import { type PlayerStats } from "./data";

const ACHIEVEMENT_KEY = "kushcloud_achievements_v1";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  secret?: boolean;
  condition: (stats: PlayerStats, lastRun: RunResult | null) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_flight",
    name: "First Flight",
    description: "Complete your first game",
    icon: "🪽",
    condition: (stats) => stats.totalGames >= 1,
  },
  {
    id: "ten_games",
    name: "Getting Started",
    description: "Play 10 games",
    icon: "🎮",
    condition: (stats) => stats.totalGames >= 10,
  },
  {
    id: "hundred_games",
    name: "Dedicated Toker",
    description: "Play 100 games",
    icon: "💚",
    condition: (stats) => stats.totalGames >= 100,
  },
  {
    id: "score_10",
    name: "Double Digits",
    description: "Score 10 points in a run",
    icon: "🔟",
    condition: (_stats, lastRun) => lastRun !== null && lastRun.score >= 10,
  },
  {
    id: "score_50",
    name: "High Roller",
    description: "Score 50 points in a run",
    icon: "🎰",
    condition: (_stats, lastRun) => lastRun !== null && lastRun.score >= 50,
  },
  {
    id: "score_100",
    name: "Century Club",
    description: "Score 100 points in a run",
    icon: "💯",
    condition: (_stats, lastRun) => lastRun !== null && lastRun.score >= 100,
  },
  {
    id: "score_250",
    name: "Legend Status",
    description: "Score 250 points in a run",
    icon: "🏆",
    condition: (_stats, lastRun) => lastRun !== null && lastRun.score >= 250,
  },
  {
    id: "combo_5",
    name: "On Fire",
    description: "Reach a 5x combo",
    icon: "🔥",
    condition: (stats, lastRun) => stats.bestCombo >= 5 || (lastRun !== null && lastRun.bestCombo >= 5),
  },
  {
    id: "combo_10",
    name: "Unstoppable",
    description: "Reach a 10x combo",
    icon: "⚡",
    condition: (stats, lastRun) => stats.bestCombo >= 10 || (lastRun !== null && lastRun.bestCombo >= 10),
  },
  {
    id: "combo_20",
    name: "God Mode",
    description: "Reach a 20x combo",
    icon: "👑",
    condition: (stats, lastRun) => stats.bestCombo >= 20 || (lastRun !== null && lastRun.bestCombo >= 20),
  },
  {
    id: "coins_100",
    name: "Coin Collector",
    description: "Collect 100 coins total",
    icon: "🪙",
    condition: (stats) => stats.totalCoins >= 100,
  },
  {
    id: "coins_1000",
    name: "Rich Stoner",
    description: "Collect 1,000 coins total",
    icon: "💰",
    condition: (stats) => stats.totalCoins >= 1000,
  },
  {
    id: "coins_10000",
    name: "Billionaire",
    description: "Collect 10,000 coins total",
    icon: "🤑",
    condition: (stats) => stats.totalCoins >= 10000,
  },
  {
    id: "near_miss_10",
    name: "Dodger",
    description: "Near-miss 10 obstacles total",
    icon: "😮",
    condition: (stats) => stats.totalNearMiss >= 10,
  },
  {
    id: "perfect_10",
    name: "Perfect Storm",
    description: "Get 10 perfect passes total",
    icon: "✨",
    condition: (stats) => stats.totalPerfectPasses >= 10,
  },
  {
    id: "clutch_5",
    name: "Nine Lives",
    description: "Survive 5 clutch escapes total",
    icon: "🐱",
    condition: (_stats, lastRun) => {
      // Accumulated across runs via stats isn't tracked, check lastRun
      return lastRun !== null && (lastRun.clutch ?? 0) >= 5;
    },
  },
  {
    id: "redeye_3",
    name: "Red Eye King",
    description: "Collect 3 smoke clouds in a single run",
    icon: "👁️",
    condition: (_stats, lastRun) => lastRun !== null && (lastRun.redEye ?? 0) >= 3,
  },
  {
    id: "frenzy_first",
    name: "Frenzy Mode",
    description: "Trigger FRENZY mode for the first time",
    icon: "🌀",
    condition: () => true, // checked separately via flag
    secret: true,
  },
  {
    id: "flap_1000",
    name: "Flap Happy",
    description: "Flap 1,000 times total",
    icon: "🦅",
    condition: (stats) => stats.totalFlaps >= 1000,
  },
  {
    id: "flap_10000",
    name: "Flap Master",
    description: "Flap 10,000 times total",
    icon: "🏅",
    condition: (stats) => stats.totalFlaps >= 10000,
  },
  {
    id: "milestone_50",
    name: "Halfway There",
    description: "Score a total of 500 points across all runs",
    icon: "🎯",
    condition: (stats) => stats.totalScore >= 500,
  },
  {
    id: "milestone_5000",
    name: "Kush Legend",
    description: "Score a total of 5,000 points across all runs",
    icon: "🌟",
    condition: (stats) => stats.totalScore >= 5000,
  },
  {
    id: "all_skins",
    name: "Collector",
    description: "Own every skin",
    icon: "👗",
    condition: () => false, // checked via ownedSkins length
    secret: true,
  },
  {
    id: "new_best",
    name: "Personal Best",
    description: "Beat your high score",
    icon: "🏅",
    condition: () => true, // checked via flag
  },
  {
    id: "first_win",
    name: "First Win",
    description: "Score at least 1 point",
    icon: "🎉",
    condition: (_stats, lastRun) => lastRun !== null && lastRun.score >= 1,
  },
];

export function loadUnlocked(): string[] {
  try {
    const raw = localStorage.getItem(ACHIEVEMENT_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data;
    return [];
  } catch {
    return [];
  }
}

export function saveUnlocked(ids: string[]): void {
  try {
    localStorage.setItem(ACHIEVEMENT_KEY, JSON.stringify(ids));
  } catch {
    // storage full — ignore
  }
}

export function checkNewAchievements(
  unlocked: string[],
  stats: PlayerStats,
  lastRun: RunResult | null,
  extraFlags?: Record<string, boolean>,
): Achievement[] {
  const newlyUnlocked: Achievement[] = [];
  for (const ach of ACHIEVEMENTS) {
    if (unlocked.includes(ach.id)) continue;
    let met = false;
    try {
      met = ach.condition(stats, lastRun);
    } catch {
      met = false;
    }
    // Check extra flags for special achievements
    if (!met && extraFlags && extraFlags[ach.id]) {
      met = true;
    }
    if (met) {
      newlyUnlocked.push(ach);
    }
  }
  return newlyUnlocked;
}

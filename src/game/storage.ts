import { PlayerStats, getDailyMissions, Mission, LOGIN_REWARDS } from "./data";

const KEY = "kushcloud_save_v1";

export interface MissionProgress {
  id: string; progress: number; claimed: boolean;
}

export interface OwnedItem {
  id: string; obtained: number; // timestamp
}

export interface SaveData {
  version: number;
  playerName: string;
  coins: number;
  xp: number;
  dust: number;
  stats: PlayerStats;
  ownedSkins: string[];
  ownedTrails: string[];
  ownedTitles: string[];
  ownedBadges: string[];
  ownedEffects: string[];
  ownedPowerUps: string[];
  equippedSkin: string;
  equippedTrail: string;
  equippedTitle: string | null;
  equippedBadge: string | null;
  equippedEffect: string;
  unlockedAchievements: string[];
  claimedAchievements: string[];
  cratesOpened: number;
  lastDay: number;
  missions: MissionProgress[];
  dailyPlays: number;
  dailyCoins: number;
  lastLoginDay: number;
  loginStreak: number;
  loginClaimedToday: boolean;
  musicVol: number;
  sfxVol: number;
  reducedMotion: boolean;
  highContrast: boolean;
  seenTutorial: boolean;
  scoreHistory: number[];
  lastSync: number;
  seenItems: Record<string, boolean>;
}

export const DEFAULT_STATS: PlayerStats = {
  totalGames: 0, totalScore: 0, totalCoins: 0, totalNearMiss: 0,
  bestCombo: 0, totalFlaps: 0, bestScore: 0,
};

export function dayNumber(): number {
  return Math.floor(Date.now() / 86400000);
}

function defaultSave(): SaveData {
  return {
    version: 2,
    playerName: randomName(),
    coins: 0,
    xp: 0,
    dust: 0,
    stats: { ...DEFAULT_STATS },
    ownedSkins: ["bud"],
    ownedTrails: ["none"],
    ownedTitles: [],
    ownedBadges: [],
    ownedEffects: ["e_none"],
    ownedPowerUps: [],
    equippedSkin: "bud",
    equippedTrail: "none",
    equippedTitle: null,
    equippedBadge: null,
    equippedEffect: "e_none",
    unlockedAchievements: [],
    claimedAchievements: [],
    cratesOpened: 0,
    lastDay: dayNumber(),
    missions: [],
    dailyPlays: 0,
    dailyCoins: 0,
    lastLoginDay: 0,
    loginStreak: 0,
    loginClaimedToday: false,
    musicVol: 0.5,
    sfxVol: 0.8,
    reducedMotion: false,
    highContrast: false,
    seenTutorial: false,
    scoreHistory: [],
    lastSync: Date.now(),
    seenItems: {},
  };
}

const ADJ = ["Dank", "Hazy", "Mellow", "Chill", "Cosmic", "Frosty", "Sticky", "Lofi", "Zen", "Groovy"];
const NOUN = ["Toker", "Nugget", "Sprout", "Cloud", "Wizard", "Panda", "Sloth", "Buddha", "Gnome", "Yeti"];
export function randomName(): string {
  return ADJ[Math.floor(Math.random() * ADJ.length)] + NOUN[Math.floor(Math.random() * NOUN.length)] + Math.floor(Math.random() * 90 + 10);
}

export function migrateSave(data: Record<string, any>): SaveData {
  const def = defaultSave();
  if (!data.version || data.version < 2) {
    data.dust ??= 0;
    data.ownedTitles ??= [];
    data.ownedBadges ??= [];
    data.ownedEffects ??= ["e_none"];
    data.ownedPowerUps ??= [];
    data.equippedTitle ??= null;
    data.equippedBadge ??= null;
    data.equippedEffect ??= "e_none";
    data.cratesOpened ??= 0;
    data.seenItems ??= {};
    data.version = 2;
  }
  return { ...def, ...data, stats: { ...DEFAULT_STATS, ...data.stats } };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const data = JSON.parse(raw);
    if (typeof data === "object" && data !== null) return migrateSave(data);
    return defaultSave();
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData) {
  try {
    data.lastSync = Date.now();
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch { /* offline fine */ }
}

export function rollDaily(data: SaveData): SaveData {
  const today = dayNumber();
  if (data.lastDay !== today || data.missions.length === 0) {
    const missions = getDailyMissions(today);
    data.missions = missions.map((m) => ({ id: m.id, progress: 0, claimed: false }));
    data.dailyPlays = 0;
    data.dailyCoins = 0;
    data.lastDay = today;
  }
  if (data.lastLoginDay !== today) {
    if (data.lastLoginDay === today - 1) {
      data.loginStreak = Math.min(data.loginStreak + 1, LOGIN_REWARDS.length);
    } else {
      data.loginStreak = 1;
    }
    data.lastLoginDay = today;
    data.loginClaimedToday = false;
  }
  return data;
}

export function currentMissions(): Mission[] {
  return getDailyMissions(dayNumber());
}

export function validateRun(score: number, durationMs: number, flaps: number, coins: number): { valid: boolean; reason?: string } {
  if (score < 0 || coins < 0 || flaps < 0) return { valid: false, reason: "Negative values" };
  if (score > 0 && durationMs < score * 250) return { valid: false, reason: "Score/time mismatch" };
  if (score > 5 && flaps < 2) return { valid: false, reason: "Insufficient inputs" };
  if (coins > score + 5) return { valid: false, reason: "Coin anomaly" };
  if (score > 100000) return { valid: false, reason: "Out of bounds" };
  return { valid: true };
}

export interface LeaderEntry { name: string; score: number; you?: boolean; friend?: boolean; }

const BOT_NAMES = [
  "GanjaGuru", "BluntForce", "MissMary", "HighKing", "PuffDaddy420", "ChronicChris", "DabQueen",
  "StonerSam", "KushKween", "HazeHazel", "ReeferRick", "BongBella", "NugNomad", "TokeTitan",
  "GreenGoblin", "VapeViper", "SmokeShadow", "LeafLord", "BudBaron", "ZenZara", "CloudChaser",
  "TrichomeTara", "DankDuke", "PineappleP", "GrapeApe", "SourD", "OGOscar", "WaxWilly", "EdibleEd",
  "FrostyFinn", "MellowMia",
];

function seededScores(period: "daily" | "weekly" | "all"): LeaderEntry[] {
  const seedBase = period === "daily" ? dayNumber() : period === "weekly" ? Math.floor(dayNumber() / 7) : 777;
  let s = seedBase * 7919 + 13;
  const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const max = period === "daily" ? 55 : period === "weekly" ? 90 : 140;
  return BOT_NAMES.map((name, i) => {
    const base = Math.floor(rnd() * max) + Math.floor((BOT_NAMES.length - i) * (rnd() * 1.5));
    return { name, score: Math.max(2, base) };
  });
}

const FRIEND_NAMES = ["GanjaGuru", "DabQueen", "MellowMia", "ZenZara", "FrostyFinn"];

export async function getLeaderboard(
  period: "daily" | "weekly" | "all",
  playerName: string,
  playerScore: number,
  friendsOnly: boolean
): Promise<LeaderEntry[]> {
  try {
    const { subscribeToLeaderboard, getLocalLeaderboard } = await import("./leaderboard");
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(getLocalLeaderboard(period, playerName, playerScore, friendsOnly));
      }, 2000);
      subscribeToLeaderboard(period, playerName, playerScore, friendsOnly, (list) => {
        clearTimeout(timeout);
        resolve(list);
      });
    });
  } catch {
    const list = seededScores(period);
    const all = [...list, { name: playerName, score: playerScore, you: true }]
      .sort((a, b) => b.score - a.score);
    return friendsOnly ? all.filter((e) => e.name === playerName || FRIEND_NAMES.includes(e.name)) : all;
  }
}

export async function getRank(period: "daily" | "weekly" | "all", playerScore: number): Promise<number> {
  try {
    const { subscribeToLeaderboard } = await import("./leaderboard");
    return new Promise((resolve) => {
      subscribeToLeaderboard(period, "Temp", playerScore, false, (list) => {
        resolve(list.findIndex((e) => e.score === playerScore) + 1 || 1);
      });
    });
  } catch {
    const list = seededScores(period);
    const all = [...list.map((e) => e.score), playerScore].sort((a, b) => b - a);
    return all.indexOf(playerScore) + 1;
  }
}

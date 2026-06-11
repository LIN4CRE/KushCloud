import { PlayerStats, getDailyMissions, getActiveEvents, EventMetric, Mission, LOGIN_REWARDS } from "./data";

const KEY = "kushcloud_save_v1";

export interface MissionProgress {
  id: string; progress: number; claimed: boolean;
}

export interface OwnedItem {
  id: string; obtained: number; // timestamp
}

export interface EventSaveState {
  objectives: Record<string, number>;
  claimedObjectives: string[];
  rewardTrackPoints: number;
  claimedRewardTiers: number[];
  lastRefreshDay: number;
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
  seasonalXp: number;
  currentSeason: number;
  lastSync: number;
  lastCloudSync: number;
  seenItems: Record<string, boolean>;
  eventState: Record<string, EventSaveState>;
  processedRunIds: string[];
}

export const DEFAULT_STATS: PlayerStats = {
  totalGames: 0, totalScore: 0, totalCoins: 0, totalNearMiss: 0,
  totalPerfectPasses: 0, bestCombo: 0, totalFlaps: 0, bestScore: 0,
};

export function dayNumber(): number {
  return Math.floor(Date.now() / 86400000);
}

function defaultSave(): SaveData {
  return {
    version: 4,
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
    seasonalXp: 0,
    currentSeason: 1,
    lastSync: Date.now(),
    lastCloudSync: 0,
    seenItems: {},
    eventState: {},
    processedRunIds: [],
  };
}

const ADJ = ["Dank", "Hazy", "Mellow", "Chill", "Cosmic", "Frosty", "Sticky", "Lofi", "Zen", "Groovy"];
const NOUN = ["Toker", "Nugget", "Sprout", "Cloud", "Wizard", "Panda", "Sloth", "Buddha", "Gnome", "Yeti"];
export function randomName(): string {
  return ADJ[Math.floor(Math.random() * ADJ.length)] + NOUN[Math.floor(Math.random() * NOUN.length)] + Math.floor(Math.random() * 90 + 10);
}

export function normalizePlayerName(name: string, fallback = randomName()): string {
  const trimmed = name.trim().slice(0, 16);
  return trimmed || fallback;
}

export function migrateSave(data: Record<string, any>): SaveData {
  const def = defaultSave();
  if (data.stats && data.stats.totalPerfectPasses === undefined) {
    data.stats.totalPerfectPasses = 0;
  }
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
    data.seasonalXp ??= 0;
    data.currentSeason ??= 1;
    data.version = 2;
  }
  if (data.version < 3) {
    data.eventState ??= {};
    data.version = 3;
  }
  if (data.version < 4) {
    data.processedRunIds ??= [];
    data.version = 4;
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
  const activeEvents = getActiveEvents();
  for (const event of activeEvents) {
    if (event.type === "daily") {
      const state = data.eventState[event.id];
      if (state && state.lastRefreshDay !== today) {
        state.objectives = {};
        state.claimedObjectives = [];
        state.rewardTrackPoints = 0;
        state.claimedRewardTiers = [];
        state.lastRefreshDay = today;
      }
    }
  }
  return data;
}

export function currentMissions(): Mission[] {
  return getDailyMissions(dayNumber());
}

export function validateRun(score: number, durationMs: number, flaps: number, coins: number): { valid: boolean; reason?: string } {
  if (![score, durationMs, flaps, coins].every(Number.isFinite)) return { valid: false, reason: "Non-finite values" };
  if (![score, flaps, coins].every(Number.isInteger)) return { valid: false, reason: "Malformed values" };
  if (score < 0 || coins < 0 || flaps < 0) return { valid: false, reason: "Negative values" };
  if (durationMs < 0) return { valid: false, reason: "Negative duration" };
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

export function seededScores(period: "daily" | "weekly" | "all"): LeaderEntry[] {
  const seedBase = period === "daily" ? dayNumber() : period === "weekly" ? Math.floor(dayNumber() / 7) : 777;
  let s = seedBase * 7919 + 13;
  const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const max = period === "daily" ? 55 : period === "weekly" ? 90 : 140;
  return BOT_NAMES.map((name, i) => {
    const base = Math.floor(rnd() * max) + Math.floor((BOT_NAMES.length - i) * (rnd() * 1.5));
    return { name, score: Math.max(2, base) };
  });
}

export const FRIEND_NAMES = ["GanjaGuru", "DabQueen", "MellowMia", "ZenZara", "FrostyFinn"];

export function trackEventMetric(
  metric: EventMetric,
  value: number,
  _save: SaveData,
  update: (fn: (s: SaveData) => void) => void
): void {
  const events = getActiveEvents();
  if (events.length === 0) return;
  update((s) => {
    for (const event of events) {
      const state = s.eventState[event.id] || (s.eventState[event.id] = {
        objectives: {}, claimedObjectives: [], rewardTrackPoints: 0,
        claimedRewardTiers: [], lastRefreshDay: dayNumber(),
      });
      for (const obj of event.objectives) {
        if (state.claimedObjectives.includes(obj.id)) continue;
        if (obj.metric === metric) {
          state.objectives[obj.id] = (state.objectives[obj.id] || 0) + value;
          const current = state.objectives[obj.id] || 0;
          if (current >= obj.goal && current - value < obj.goal) {
            state.rewardTrackPoints += obj.reward;
          }
        }
      }
    }
  });
}

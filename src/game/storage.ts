import { type PlayerStats } from "./data";

const KEY = "kushcloud_save_v1";
const VERSION = 5;

export interface SaveData {
  version: number;
  playerName: string;
  coins: number;
  stats: PlayerStats;
  ownedSkins: string[];
  ownedTrails: string[];
  ownedPowerUps: string[];
  equippedSkin: string;
  equippedTrail: string;
  lastDay: number;
  musicVol: number;
  sfxVol: number;
  reducedMotion: boolean;
  highContrast: boolean;
  seenTutorial: boolean;
}

export const DEFAULT_STATS: PlayerStats = {
  totalGames: 0,
  totalScore: 0,
  totalCoins: 0,
  totalNearMiss: 0,
  totalPerfectPasses: 0,
  bestCombo: 0,
  totalFlaps: 0,
  bestScore: 0,
};

export function dayNumber(): number {
  return Math.floor(Date.now() / 86400000);
}

const ADJ = ["Dank","Hazy","Mellow","Chill","Cosmic","Frosty","Sticky","Lofi","Zen","Groovy"];
const NOUN = ["Toker","Nugget","Sprout","Cloud","Wizard","Panda","Sloth","Buddha","Gnome","Yeti"];

export function randomName(): string {
  const a = ADJ[Math.floor(Math.random() * ADJ.length)];
  const n = NOUN[Math.floor(Math.random() * NOUN.length)];
  const num = Math.floor(Math.random() * 90 + 10);
  return `${a}${n}${num}`;
}

function defaultSave(): SaveData {
  return {
    version: VERSION,
    playerName: randomName(),
    coins: 0,
    stats: { ...DEFAULT_STATS },
    ownedSkins: ["bud"],
    ownedTrails: ["none"],
    ownedPowerUps: [],
    equippedSkin: "bud",
    equippedTrail: "none",
    lastDay: dayNumber(),
    musicVol: 0.5,
    sfxVol: 0.8,
    reducedMotion: false,
    highContrast: false,
    seenTutorial: false,
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return defaultSave();
    const def = defaultSave();
    const stats = (data.stats as Partial<PlayerStats>) || {};
    return {
      ...def,
      ...data,
      stats: { ...DEFAULT_STATS, ...stats },
      version: VERSION,
    } as SaveData;
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    console.warn("Failed to write save");
  }
}

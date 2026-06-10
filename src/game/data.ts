// ===== Game content & progression data =====

export interface Skin {
  id: string;
  name: string;
  desc: string;
  cost: number; // kush coins, 0 = free/default
  body: string; // primary color
  accent: string; // secondary color
  eye: string;
  unlockLevel?: number; // optional level requirement
  emoji: string;
}

export interface Trail {
  id: string;
  name: string;
  desc: string;
  cost: number;
  color: string;
  glow: string;
  kind: "puff" | "spark" | "leaf" | "rainbow" | "none";
}

export interface World {
  id: string;
  name: string;
  minScore: number;
  sky: [string, string]; // gradient top/bottom
  pipe: string;
  pipeDark: string;
  ground: string;
  accent: string;
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  reward: number; // coins
  // check returns true when unlocked, given stats
  goal: number;
  stat: keyof PlayerStats | "score";
}

export interface Mission {
  id: string;
  text: string;
  goal: number;
  reward: number;
  metric: "runScore" | "runCoins" | "runNearMiss" | "plays" | "totalCoins";
}

export interface PlayerStats {
  totalGames: number;
  totalScore: number;
  totalCoins: number;
  totalNearMiss: number;
  bestCombo: number;
  totalFlaps: number;
  bestScore: number;
}

export const SKINS: Skin[] = [
  { id: "bud", name: "Buddy", desc: "The classic floating bud.", cost: 0, body: "#5fbf5f", accent: "#3d8b3d", eye: "#1a1a1a", emoji: "🌿" },
  { id: "nug", name: "Lil Nug", desc: "A frosty little nugget.", cost: 120, body: "#8fd98f", accent: "#5aa85a", eye: "#162216", emoji: "🍀" },
  { id: "joint", name: "Sir Spliff", desc: "A dapper rolled gentleman.", cost: 250, body: "#f4ead0", accent: "#c9a063", eye: "#2a2a2a", emoji: "🚬" },
  { id: "purple", name: "Purple Haze", desc: "Smooth and mellow violet.", cost: 400, body: "#a878e0", accent: "#7048a8", eye: "#1a1030", emoji: "🍇" },
  { id: "gummy", name: "Gummy Bear", desc: "Edible and adorable.", cost: 600, body: "#ff7eb0", accent: "#e0407d", eye: "#330018", emoji: "🐻" },
  { id: "cosmic", name: "Cosmic Kush", desc: "Out-of-this-world strain.", cost: 1000, body: "#3ad6e0", accent: "#9b5fff", eye: "#001a22", unlockLevel: 8, emoji: "🌌" },
  { id: "golden", name: "Golden OG", desc: "24-karat dankness.", cost: 2000, body: "#ffd24a", accent: "#c98a16", eye: "#2a1c00", unlockLevel: 15, emoji: "👑" },
];

export const TRAILS: Trail[] = [
  { id: "none", name: "No Trail", desc: "Clean and simple.", cost: 0, color: "#ffffff", glow: "#ffffff", kind: "none" },
  { id: "puff", name: "Smoke Puff", desc: "Classic mellow clouds.", cost: 80, color: "#dfe7df", glow: "#bfeabf", kind: "puff" },
  { id: "spark", name: "Sparkles", desc: "Crystal trichome sparkle.", cost: 200, color: "#fff4b0", glow: "#ffe066", kind: "spark" },
  { id: "leaf", name: "Leaf Storm", desc: "Trailing tiny leaves.", cost: 350, color: "#74d774", glow: "#3fae3f", kind: "leaf" },
  { id: "rainbow", name: "Rainbow Road", desc: "Taste the rainbow, man.", cost: 800, color: "#ff6ec7", glow: "#6ec7ff", kind: "rainbow" },
];

export const WORLDS: World[] = [
  { id: "dispensary", name: "Dispensary District", minScore: 0, sky: ["#7ed0ff", "#bdeeff"], pipe: "#4caf50", pipeDark: "#388e3c", ground: "#caa472", accent: "#2e7d32" },
  { id: "grow", name: "Grow Room", minScore: 12, sky: ["#2a1a4a", "#7a3fb0"], pipe: "#9b59b6", pipeDark: "#6c3483", ground: "#3a2a5a", accent: "#d29bff" },
  { id: "smoke", name: "Smoke Clouds", minScore: 28, sky: ["#5a6b7a", "#aab9c6"], pipe: "#7f8c8d", pipeDark: "#566061", ground: "#6b7682", accent: "#dfe9f0" },
  { id: "festival", name: "Festival Zone", minScore: 48, sky: ["#ff7e5f", "#feb47b"], pipe: "#e74c3c", pipeDark: "#b03a2e", ground: "#c0392b", accent: "#ffe066" },
  { id: "cosmos", name: "Cosmic Galaxy", minScore: 75, sky: ["#0b0b2a", "#3a1a6a"], pipe: "#5f4bb6", pipeDark: "#3a2a7a", ground: "#1a1040", accent: "#9b5fff" },
];

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first", name: "First Toke", desc: "Score your first point.", reward: 20, goal: 1, stat: "bestScore" },
  { id: "score10", name: "Getting Lifted", desc: "Reach a score of 10.", reward: 50, goal: 10, stat: "bestScore" },
  { id: "score25", name: "Cloud Surfer", desc: "Reach a score of 25.", reward: 120, goal: 25, stat: "bestScore" },
  { id: "score50", name: "Sky High", desc: "Reach a score of 50.", reward: 300, goal: 50, stat: "bestScore" },
  { id: "games10", name: "Regular Customer", desc: "Play 10 games.", reward: 40, goal: 10, stat: "totalGames" },
  { id: "games50", name: "Frequent Flyer", desc: "Play 50 games.", reward: 150, goal: 50, stat: "totalGames" },
  { id: "coins100", name: "Coin Collector", desc: "Collect 100 kush coins total.", reward: 80, goal: 100, stat: "totalCoins" },
  { id: "coins1000", name: "Dank Banker", desc: "Collect 1000 kush coins total.", reward: 400, goal: 1000, stat: "totalCoins" },
  { id: "near50", name: "Daredevil", desc: "Pull off 50 near-misses.", reward: 200, goal: 50, stat: "totalNearMiss" },
  { id: "combo10", name: "Combo King", desc: "Reach a x10 combo.", reward: 250, goal: 10, stat: "bestCombo" },
  { id: "flaps1000", name: "Wing It", desc: "Flap 1000 times.", reward: 100, goal: 1000, stat: "totalFlaps" },
];

const MISSION_POOL: Omit<Mission, "id">[] = [
  { text: "Score 8 points in a single run", goal: 8, reward: 40, metric: "runScore" },
  { text: "Score 15 points in a single run", goal: 15, reward: 70, metric: "runScore" },
  { text: "Collect 5 coins in one run", goal: 5, reward: 35, metric: "runCoins" },
  { text: "Pull off 3 near-misses in one run", goal: 3, reward: 45, metric: "runNearMiss" },
  { text: "Play 5 games today", goal: 5, reward: 50, metric: "plays" },
  { text: "Collect 30 coins total today", goal: 30, reward: 60, metric: "totalCoins" },
  { text: "Score 20 points in a single run", goal: 20, reward: 90, metric: "runScore" },
  { text: "Pull off 6 near-misses in one run", goal: 6, reward: 80, metric: "runNearMiss" },
];

// Deterministic daily missions based on day number
export function getDailyMissions(daySeed: number): Mission[] {
  const out: Mission[] = [];
  const used = new Set<number>();
  let s = daySeed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  while (out.length < 3) {
    const idx = Math.floor(rnd() * MISSION_POOL.length);
    if (used.has(idx)) continue;
    used.add(idx);
    out.push({ ...MISSION_POOL[idx], id: `m${daySeed}_${idx}` });
  }
  return out;
}

// XP / leveling
export function xpForLevel(level: number): number {
  return Math.floor(100 + (level - 1) * 60 + Math.pow(level, 1.6) * 12);
}

export function levelFromXp(totalXp: number): { level: number; into: number; need: number } {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  return { level, into: remaining, need: xpForLevel(level) };
}

export function worldForScore(score: number): World {
  let w = WORLDS[0];
  for (const world of WORLDS) if (score >= world.minScore) w = world;
  return w;
}

// Login reward streak table (coins)
export const LOGIN_REWARDS = [25, 40, 60, 80, 120, 160, 250];

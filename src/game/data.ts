// ===== Game content & progression data =====

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";

export const RARITY: Record<Rarity, { color: string; glow: string; bg: string; border: string; label: string; dropRate: number; dustValue: number }> = {
  common:    { color: "#9ca3af", glow: "#9ca3af40", bg: "rgba(156,163,175,0.12)", border: "rgba(156,163,175,0.3)", label: "Common",    dropRate: 0.40, dustValue: 3 },
  uncommon:  { color: "#4ade80", glow: "#4ade8060", bg: "rgba(74,222,128,0.10)", border: "rgba(74,222,128,0.3)", label: "Uncommon",  dropRate: 0.25, dustValue: 8 },
  rare:      { color: "#60a5fa", glow: "#60a5fa60", bg: "rgba(96,165,250,0.10)", border: "rgba(96,165,250,0.3)", label: "Rare",      dropRate: 0.18, dustValue: 20 },
  epic:      { color: "#a78bfa", glow: "#a78bfa70", bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.3)", label: "Epic",      dropRate: 0.12, dustValue: 50 },
  legendary: { color: "#fbbf24", glow: "#fbbf2480", bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.3)", label: "Legendary", dropRate: 0.04, dustValue: 150 },
  mythic:    { color: "#f472b6", glow: "#f472b690", bg: "rgba(244,114,182,0.10)", border: "rgba(244,114,182,0.3)", label: "Mythic",    dropRate: 0.01, dustValue: 400 },
};

export interface Skin {
  id: string; name: string; desc: string; cost: number; body: string; accent: string; eye: string;
  unlockLevel?: number; emoji: string; rarity: Rarity;
}

export interface Trail {
  id: string; name: string; desc: string; cost: number; color: string; glow: string;
  kind: "puff" | "spark" | "leaf" | "rainbow" | "star" | "flame" | "crystal" | "ghost" | "aurora" | "none";
  rarity: Rarity;
}

export interface World {
  id: string; name: string; minScore: number; sky: [string, string]; pipe: string;
  pipeDark: string; ground: string; accent: string;
}

export interface Title {
  id: string; name: string; desc: string; rarity: Rarity;
}

export interface Badge {
  id: string; name: string; desc: string; rarity: Rarity; icon: string;
}

export interface Effect {
  id: string; name: string; desc: string; rarity: Rarity;
  kind: "spawn" | "ambient" | "death"; color: string; secondary?: string;
}

export interface PowerUp {
  id: string; name: string; desc: string; cost: number; icon: string;
  effect: "coinMultiplier" | "slowMotion" | "magnet" | "shield" | "doubleJump";
  duration: number;
}

export interface LootCrate {
  id: string; name: string; desc: string; cost: number; icon: string;
  minRolls: number; maxRolls: number;
  rarities: Rarity[];
  guaranteed?: Rarity;
}

export type LootDrop = Skin | Trail | Title | Badge | Effect;

export interface Achievement {
  id: string; name: string; desc: string; reward: number;
  stat: keyof PlayerStats | "score" | "ownedSkins" | "ownedTrails" | "ownedEffects" | "ownedBadges" | "ownedTitles";
  goal: number;
}

export interface Mission {
  id: string; text: string; goal: number; reward: number; rewardType?: "coins" | "crate";
  metric: "runScore" | "runCoins" | "runNearMiss" | "plays" | "totalCoins";
}

export interface PlayerStats {
  totalGames: number; totalScore: number; totalCoins: number; totalNearMiss: number;
  totalPerfectPasses: number; bestCombo: number; totalFlaps: number; bestScore: number;
}

export const SKINS: Skin[] = [
  { id: "bud", name: "Buddy", desc: "The classic floating bud.", cost: 0, body: "#5fbf5f", accent: "#3d8b3d", eye: "#1a1a1a", emoji: "🌿", rarity: "common" },
  { id: "nug", name: "Lil Nug", desc: "A frosty little nugget.", cost: 120, body: "#8fd98f", accent: "#5aa85a", eye: "#162216", emoji: "🍀", rarity: "common" },
  { id: "joint", name: "Sir Spliff", desc: "A dapper rolled gentleman.", cost: 250, body: "#f4ead0", accent: "#c9a063", eye: "#2a2a2a", emoji: "🚬", rarity: "uncommon" },
  { id: "purple", name: "Purple Haze", desc: "Smooth and mellow violet.", cost: 400, body: "#a878e0", accent: "#7048a8", eye: "#1a1030", emoji: "🍇", rarity: "uncommon" },
  { id: "gummy", name: "Gummy Bear", desc: "Edible and adorable.", cost: 600, body: "#ff7eb0", accent: "#e0407d", eye: "#330018", emoji: "🐻", rarity: "rare" },
  { id: "cosmic", name: "Cosmic Kush", desc: "Out-of-this-world strain.", cost: 1000, body: "#3ad6e0", accent: "#9b5fff", eye: "#001a22", unlockLevel: 8, emoji: "🌌", rarity: "rare" },
  { id: "golden", name: "Golden OG", desc: "24-karat dankness.", cost: 2000, body: "#ffd24a", accent: "#c98a16", eye: "#2a1c00", unlockLevel: 15, emoji: "👑", rarity: "epic" },
  { id: "ember", name: "Ember Phoenix", desc: "Rising from the ash.", cost: 0, body: "#ff6b35", accent: "#d63031", eye: "#1a0500", emoji: "🔥", rarity: "rare" },
  { id: "frost", name: "Frost Spirit", desc: "Chilled to perfection.", cost: 0, body: "#74d4fa", accent: "#4a90d9", eye: "#002244", emoji: "❄️", rarity: "rare" },
  { id: "shadow", name: "Shadow Blur", desc: "A mysterious silhouette.", cost: 0, body: "#2d3436", accent: "#636e72", eye: "#ff6b6b", emoji: "🌑", rarity: "epic" },
  { id: "bloom", name: "Cherry Bloom", desc: "Sakura in the wind.", cost: 0, body: "#ffb7c5", accent: "#ff8a9e", eye: "#4a0020", emoji: "🌸", rarity: "uncommon" },
  { id: "toad", name: "Shroom Toad", desc: "A fun-guy to be around.", cost: 0, body: "#e17055", accent: "#00b894", eye: "#2d1b00", emoji: "🍄", rarity: "rare" },
  { id: "wizard", name: "Kush Wizard", desc: "Magic in every puff.", cost: 0, body: "#6c5ce7", accent: "#a29bfe", eye: "#0a0030", emoji: "🔮", rarity: "epic" },
  { id: "mecha", name: "Mecha Bird", desc: "Beep boop, fly high.", cost: 0, body: "#dfe6e9", accent: "#0984e3", eye: "#fdcb6e", emoji: "🤖", rarity: "rare" },
  { id: "sunset", name: "Sunset Glow", desc: "Golden hour forever.", cost: 0, body: "#fdcb6e", accent: "#e17055", eye: "#2d1000", emoji: "🌅", rarity: "uncommon" },
  { id: "void", name: "Void Walker", desc: "From the endless dark.", cost: 0, body: "#0a0a0a", accent: "#2d0050", eye: "#bb86fc", emoji: "🕳️", rarity: "legendary" },
  { id: "dragon", name: "Drake", desc: "Ancient fire breather.", cost: 0, body: "#e74c3c", accent: "#c0392b", eye: "#f1c40f", emoji: "🐉", rarity: "legendary" },
  { id: "angel", name: "Seraphim", desc: "Wings of pure light.", cost: 0, body: "#ffffff", accent: "#ffeaa7", eye: "#74b9ff", emoji: "👼", rarity: "legendary" },
  { id: "neko", name: "Neko-Chan", desc: "Super kawaii mode.", cost: 0, body: "#fd79a8", accent: "#e84393", eye: "#00cec9", emoji: "🐱", rarity: "mythic" },
  { id: "cosmo", name: "Cosmo King", desc: "Ruler of the galaxy.", cost: 0, body: "#2d1b69", accent: "#6c5ce7", eye: "#fdcb6e", emoji: "👾", rarity: "mythic" },
  { id: "phoenix", name: "Solaris", desc: "Eternal sun spirit.", cost: 0, body: "#ff9f43", accent: "#ee5253", eye: "#222f3e", emoji: "☀️", rarity: "mythic" },
];

export const TRAILS: Trail[] = [
  { id: "none", name: "No Trail", desc: "Clean and simple.", cost: 0, color: "#ffffff", glow: "#ffffff", kind: "none", rarity: "common" },
  { id: "puff", name: "Smoke Puff", desc: "Classic mellow clouds.", cost: 80, color: "#dfe7df", glow: "#bfeabf", kind: "puff", rarity: "common" },
  { id: "spark", name: "Sparkles", desc: "Crystal trichome sparkle.", cost: 200, color: "#fff4b0", glow: "#ffe066", kind: "spark", rarity: "uncommon" },
  { id: "leaf", name: "Leaf Storm", desc: "Trailing tiny leaves.", cost: 350, color: "#74d774", glow: "#3fae3f", kind: "leaf", rarity: "uncommon" },
  { id: "rainbow", name: "Rainbow Road", desc: "Taste the rainbow.", cost: 800, color: "#ff6ec7", glow: "#6ec7ff", kind: "rainbow", rarity: "rare" },
  { id: "star", name: "Stardust", desc: "Wishes trailing behind.", cost: 0, color: "#ffeaa7", glow: "#fdcb6e", kind: "star", rarity: "rare" },
  { id: "flame", name: "Flame Trail", desc: "Burning bright.", cost: 0, color: "#e74c3c", glow: "#ff6b35", kind: "flame", rarity: "rare" },
  { id: "crystal", name: "Crystal Ice", desc: "Frozen in time.", cost: 0, color: "#74d4fa", glow: "#4a90d9", kind: "crystal", rarity: "epic" },
  { id: "ghost", name: "Ghostly Wisp", desc: "Ethereal vapor trail.", cost: 0, color: "#a29bfe", glow: "#6c5ce7", kind: "ghost", rarity: "epic" },
  { id: "aurora", name: "Northern Lights", desc: "Borealis beauty.", cost: 0, color: "#00cec9", glow: "#6c5ce7", kind: "aurora", rarity: "legendary" },
  { id: "magma", name: "Magma Flow", desc: "Molten fury.", cost: 0, color: "#e17055", glow: "#d63031", kind: "flame", rarity: "rare" },
  { id: "bubble", name: "Bubble Pop", desc: "Light as air.", cost: 0, color: "#81ecec", glow: "#00cec9", kind: "spark", rarity: "uncommon" },
  { id: "neon", name: "Neon Pulse", desc: "Synthwave dreams.", cost: 0, color: "#fd79a8", glow: "#e84393", kind: "rainbow", rarity: "epic" },
  { id: "lightning", name: "Storm Charge", desc: "Electric avenue.", cost: 0, color: "#f9ca24", glow: "#f0932b", kind: "star", rarity: "legendary" },
  { id: "cosmicdust", name: "Cosmic Dust", desc: "Stardust from the beyond.", cost: 0, color: "#dfe6e9", glow: "#b2bec3", kind: "ghost", rarity: "mythic" },
  { id: "solar", name: "Solar Flare", desc: "Blazing sun trail.", cost: 0, color: "#ff9f43", glow: "#feca57", kind: "flame", rarity: "mythic" },
];

export const TITLES: Title[] = [
  { id: "t_novice", name: "Novice Toker", desc: "Just starting the journey.", rarity: "common" },
  { id: "t_cloud", name: "Cloud Chaser", desc: "Always reaching higher.", rarity: "common" },
  { id: "t_streak", name: "Streak Master", desc: "Never misses a day.", rarity: "uncommon" },
  { id: "t_coin", name: "Dank Banker", desc: "Coins stack high.", rarity: "uncommon" },
  { id: "t_combo", name: "Combo King", desc: "Chain master.", rarity: "rare" },
  { id: "t_nearmiss", name: "Edge Lord", desc: "Living on the edge.", rarity: "rare" },
  { id: "t_grinder", name: "The Grinder", desc: "Relentless dedication.", rarity: "rare" },
  { id: "t_eternal", name: "Eternal Flame", desc: "Legendary persistence.", rarity: "epic" },
  { id: "t_mvp", name: "MVP", desc: "Top of the leaderboard.", rarity: "epic" },
  { id: "t_hoarder", name: "Hoarder Supreme", desc: "Collector of all things.", rarity: "epic" },
  { id: "t_whale", name: "Crypto Whale", desc: "Unlimited coins.", rarity: "legendary" },
  { id: "t_myth", name: "Living Myth", desc: "A true legend.", rarity: "legendary" },
  { id: "t_champ", name: "Champion", desc: "Undisputed best.", rarity: "legendary" },
  { id: "t_god", name: "Kush God", desc: "Beyond mortal limits.", rarity: "mythic" },
  { id: "t_one", name: "The One", desc: "Chosen by the cloud.", rarity: "mythic" },
];

export const BADGES: Badge[] = [
  { id: "b_first", name: "First Flight", desc: "Completed your first game.", icon: "🌟", rarity: "common" },
  { id: "b_10games", name: "Regular", desc: "Played 10 games.", icon: "🎮", rarity: "common" },
  { id: "b_50games", name: "Dedicated", desc: "Played 50 games.", icon: "🎯", rarity: "uncommon" },
  { id: "b_100games", name: "Veteran", desc: "Played 100 games.", icon: "💪", rarity: "uncommon" },
  { id: "b_score50", name: "Sky High", desc: "Scored 50 points.", icon: "☁️", rarity: "rare" },
  { id: "b_score100", name: "Legendary", desc: "Scored 100 points.", icon: "🏆", rarity: "rare" },
  { id: "b_score200", name: "Godlike", desc: "Scored 200 points.", icon: "👑", rarity: "epic" },
  { id: "b_collector", name: "Collector", desc: "Own 10+ skins.", icon: "🛍️", rarity: "epic" },
  { id: "b_combo20", name: "Combo God", desc: "x20 combo achieved.", icon: "🔥", rarity: "epic" },
  { id: "b_leet", name: "1337", desc: "Score exactly 1337 total.", icon: "💻", rarity: "legendary" },
  { id: "b_perfect", name: "Perfect Run", desc: "Complete a run with 0 misses.", icon: "✨", rarity: "legendary" },
  { id: "b_mythic", name: "Mythic Seeker", desc: "Unlock a mythic item.", icon: "🌈", rarity: "mythic" },
];

export const EFFECTS: Effect[] = [
  { id: "e_none", name: "No Effect", desc: "Clean gameplay.", rarity: "common", kind: "ambient", color: "#ffffff" },
  { id: "e_spores", name: "Spores", desc: "Floating spores around the bird.", rarity: "common", kind: "ambient", color: "#bfeabf", secondary: "#74d774" },
  { id: "e_embers", name: "Embers", desc: "Tiny embers float upward.", rarity: "uncommon", kind: "ambient", color: "#ff6b35", secondary: "#e74c3c" },
  { id: "e_butterfly", name: "Butterflies", desc: "Butterflies follow you.", rarity: "uncommon", kind: "spawn", color: "#fd79a8", secondary: "#ffeaa7" },
  { id: "e_glow", name: "Glow Aura", desc: "Soft glow around the bird.", rarity: "rare", kind: "ambient", color: "#60a5fa", secondary: "#a78bfa" },
  { id: "e_stars", name: "Star Shower", desc: "Stars rain down.", rarity: "rare", kind: "spawn", color: "#fbbf24", secondary: "#ffeaa7" },
  { id: "e_petals", name: "Cherry Petals", desc: "Sakura petals in the wind.", rarity: "epic", kind: "ambient", color: "#ffb7c5", secondary: "#ff8a9e" },
  { id: "e_shadow", name: "Dark Aura", desc: "Sinister shadow effect.", rarity: "epic", kind: "ambient", color: "#2d3436", secondary: "#636e72" },
  { id: "e_galaxy", name: "Galaxy Swirl", desc: "A cosmos revolves around you.", rarity: "legendary", kind: "ambient", color: "#6c5ce7", secondary: "#2d1b69" },
  { id: "e_rainbow", name: "Prism Aura", desc: "All colors of the spectrum.", rarity: "mythic", kind: "ambient", color: "#ff6ec7", secondary: "#00cec9" },
];

export const POWERUPS: PowerUp[] = [
  { id: "pu_coin", name: "Coin Magnet", desc: "2x coins for 20s", cost: 75, icon: "🧲", effect: "coinMultiplier", duration: 20 },
  { id: "pu_slow", name: "Slow Motion", desc: "Slows game speed for 15s", cost: 150, icon: "⏱️", effect: "slowMotion", duration: 15 },
  { id: "pu_magnet", name: "Coin Vacuum", desc: "Auto-collect coins in range", cost: 100, icon: "🔄", effect: "magnet", duration: 20 },
  { id: "pu_shield", name: "Force Shield", desc: "Survive one crash", cost: 200, icon: "🛡️", effect: "shield", duration: 0 },
  { id: "pu_double", name: "Double Jump", desc: "Double jump for 15s", cost: 120, icon: "⬆️", effect: "doubleJump", duration: 15 },
  { id: "pu_coin2", name: "Coin Frenzy", desc: "3x coins for 15s", cost: 220, icon: "💰", effect: "coinMultiplier", duration: 15 },
  { id: "pu_slow2", name: "Time Warp", desc: "Extreme slow motion", cost: 300, icon: "🐢", effect: "slowMotion", duration: 25 },
  { id: "pu_mega", name: "Mega Shield", desc: "3-hit shield", cost: 400, icon: "⛩️", effect: "shield", duration: 0 },
];

export const LOOT_CRATES: LootCrate[] = [
  { id: "crate_basic", name: "Basic Crate", desc: "A simple crate with common goods.", cost: 100, icon: "📦", minRolls: 1, maxRolls: 1, rarities: ["common", "uncommon"] },
  { id: "crate_premium", name: "Premium Crate", desc: "Better stuff inside!", cost: 300, icon: "🎁", minRolls: 1, maxRolls: 2, rarities: ["uncommon", "rare", "epic"], guaranteed: "uncommon" },
  { id: "crate_mega", name: "Mega Crate", desc: "High-tier loot guaranteed.", cost: 600, icon: "💎", minRolls: 1, maxRolls: 3, rarities: ["rare", "epic", "legendary", "mythic"], guaranteed: "rare" },
  { id: "crate_mythic", name: "Mythic Crate", desc: "The ultimate crate. Legends await.", cost: 1500, icon: "🌟", minRolls: 2, maxRolls: 4, rarities: ["epic", "legendary", "mythic"], guaranteed: "epic" },
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
  { id: "score100", name: "Legendary Toker", desc: "Reach a score of 100.", reward: 800, goal: 100, stat: "bestScore" },
  { id: "score200", name: "Kush Cloud God", desc: "Reach a score of 200.", reward: 2000, goal: 200, stat: "bestScore" },
  { id: "games10", name: "Regular Customer", desc: "Play 10 games.", reward: 40, goal: 10, stat: "totalGames" },
  { id: "games50", name: "Frequent Flyer", desc: "Play 50 games.", reward: 150, goal: 50, stat: "totalGames" },
  { id: "games100", name: "Dedicated Stoner", desc: "Play 100 games.", reward: 500, goal: 100, stat: "totalGames" },
  { id: "coins100", name: "Coin Collector", desc: "Collect 100 kush coins.", reward: 80, goal: 100, stat: "totalCoins" },
  { id: "coins1000", name: "Dank Banker", desc: "Collect 1000 kush coins.", reward: 400, goal: 1000, stat: "totalCoins" },
  { id: "coins5000", name: "Crypto Kush Whale", desc: "Collect 5000 kush coins.", reward: 1500, goal: 5000, stat: "totalCoins" },
  { id: "near50", name: "Daredevil", desc: "Pull off 50 near-misses.", reward: 200, goal: 50, stat: "totalNearMiss" },
  { id: "near200", name: "Edge Lord", desc: "Pull off 200 near-misses.", reward: 600, goal: 200, stat: "totalNearMiss" },
  { id: "combo10", name: "Combo King", desc: "Reach a x10 combo.", reward: 250, goal: 10, stat: "bestCombo" },
  { id: "combo20", name: "Combo God", desc: "Reach a x20 combo.", reward: 800, goal: 20, stat: "bestCombo" },
  { id: "flaps1000", name: "Wing It", desc: "Flap 1000 times.", reward: 100, goal: 1000, stat: "totalFlaps" },
  { id: "flaps5000", name: "Hummingbird Mode", desc: "Flap 5000 times.", reward: 400, goal: 5000, stat: "totalFlaps" },
  { id: "collect5", name: "Shopper", desc: "Own 5 skins.", reward: 200, goal: 5, stat: "ownedSkins" },
  { id: "collect10", name: "Shopaholic", desc: "Own 10 skins.", reward: 500, goal: 10, stat: "ownedSkins" },
  { id: "trail5", name: "Trailblazer", desc: "Own 5 trails.", reward: 250, goal: 5, stat: "ownedTrails" },
  { id: "badge5", name: "Badge Collector", desc: "Own 5 badges.", reward: 300, goal: 5, stat: "ownedBadges" },
  { id: "effect5", name: "Visual Master", desc: "Own 5 effects.", reward: 350, goal: 5, stat: "ownedEffects" },
  { id: "title5", name: "Titled Elite", desc: "Own 5 titles.", reward: 300, goal: 5, stat: "ownedTitles" },
];

const MISSION_POOL: Omit<Mission, "id">[] = [
  { text: "Score 8 points in a run", goal: 8, reward: 40, metric: "runScore" },
  { text: "Score 15 points in a run", goal: 15, reward: 70, metric: "runScore" },
  { text: "Score 25 points in a run", goal: 25, reward: 120, metric: "runScore" },
  { text: "Collect 5 coins in one run", goal: 5, reward: 35, metric: "runCoins" },
  { text: "Pull off 3 near-misses", goal: 3, reward: 45, metric: "runNearMiss" },
  { text: "Pull off 6 near-misses", goal: 6, reward: 80, metric: "runNearMiss" },
  { text: "Play 3 games today", goal: 3, reward: 30, metric: "plays" },
  { text: "Play 5 games today", goal: 5, reward: 50, metric: "plays" },
  { text: "Collect 20 coins today", goal: 20, reward: 45, metric: "totalCoins" },
  { text: "Collect 40 coins today", goal: 40, reward: 80, metric: "totalCoins" },
  { text: "Score 20 points in a run", goal: 20, reward: 100, metric: "runScore" },
  { text: "Open a loot crate today", goal: 1, reward: 60, rewardType: "crate", metric: "plays" },
];

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

export const LOGIN_REWARDS = [25, 40, 60, 80, 120, 160, 250];

export const WEEKLY_EVENTS = [
  { name: "Frosty Friday Fest", desc: "Coins from runs are worth +50%!", icon: "❄️", coinBoost: 1.5, xpBoost: 1 },
  { name: "Double XP Daze", desc: "Earn bonus XP on every flap!", icon: "✨", coinBoost: 1, xpBoost: 1.3 },
  { name: "Combo Carnival", desc: "Near-misses give extra combo!", icon: "🎪", coinBoost: 1, xpBoost: 1 },
  { name: "Loot Fever", desc: "Crates drop better loot!", icon: "🎲", coinBoost: 1, xpBoost: 1 },
  { name: "Coin Rush", desc: "Triple coins from all sources!", icon: "🪙", coinBoost: 3, xpBoost: 1 },
];

export function currentWeekIndex(): number {
  return Math.floor(Date.now() / (86400000 * 7));
}

export type EventMetric =
  | "score" | "coins" | "nearMiss" | "combo"
  | "gamesPlayed" | "cratesOpened" | "totalScore"
  | "totalCoins" | "prestigeAscensions";

export interface EventObjective {
  id: string;
  text: string;
  goal: number;
  metric: EventMetric;
  reward: number;
}

export interface EventReward {
  tier: number;
  pointsRequired: number;
  type: "coins" | "dust" | "crate" | "title" | "badge" | "effect";
  id?: string;
  amount?: number;
  icon: string;
}

export interface EventDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  type: "daily" | "weekly" | "seasonal";
  startDate: number;
  endDate: number;
  objectives: EventObjective[];
  rewardTrack: EventReward[];
  coinBoost?: number;
  xpBoost?: number;
  analyticsId: string;
}

export const EVENT_DEFS: EventDef[] = [
  {
    id: "e_spring_fest_2025",
    name: "Spring Festival",
    desc: "Celebrate spring with bonus rewards!",
    icon: "🌸",
    type: "seasonal",
    startDate: 1745107200000,
    endDate: 1747872000000,
    objectives: [
      { id: "sf_score", text: "Reach a score of 30", goal: 30, metric: "score", reward: 50 },
      { id: "sf_plays", text: "Play 10 games", goal: 10, metric: "gamesPlayed", reward: 30 },
      { id: "sf_coins", text: "Collect 200 coins", goal: 200, metric: "totalCoins", reward: 40 },
      { id: "sf_crates", text: "Open 3 loot crates", goal: 3, metric: "cratesOpened", reward: 60 },
      { id: "sf_combo", text: "Reach x8 combo", goal: 8, metric: "combo", reward: 80 },
    ],
    rewardTrack: [
      { tier: 1, pointsRequired: 50, type: "coins", amount: 100, icon: "🪙" },
      { tier: 2, pointsRequired: 120, type: "dust", amount: 30, icon: "💎" },
      { tier: 3, pointsRequired: 200, type: "crate", icon: "🎁" },
      { tier: 4, pointsRequired: 300, type: "badge", id: "b_spring", icon: "🏅" },
    ],
    analyticsId: "event_spring_2025",
  },
  {
    id: "e_weekly_coin_rush",
    name: "Weekly Coin Rush",
    desc: "Extra coins from every source!",
    icon: "🪙",
    type: "weekly",
    startDate: 1745798400000,
    endDate: 1746403200000,
    objectives: [
      { id: "wcr_plays", text: "Play 5 games", goal: 5, metric: "gamesPlayed", reward: 20 },
      { id: "wcr_score", text: "Reach a score of 15", goal: 15, metric: "score", reward: 30 },
      { id: "wcr_coins", text: "Collect 100 coins", goal: 100, metric: "totalCoins", reward: 40 },
    ],
    rewardTrack: [
      { tier: 1, pointsRequired: 30, type: "coins", amount: 80, icon: "🪙" },
      { tier: 2, pointsRequired: 70, type: "dust", amount: 20, icon: "💎" },
      { tier: 3, pointsRequired: 120, type: "coins", amount: 200, icon: "🪙" },
    ],
    analyticsId: "event_weekly_coin_rush",
  },
];

export function getActiveEvents(): EventDef[] {
  const now = Date.now();
  return EVENT_DEFS.filter(e => now >= e.startDate && now < e.endDate);
}

export function isEventActive(event: EventDef): boolean {
  const now = Date.now();
  return now >= event.startDate && now < event.endDate;
}

// Loot box opening logic
export function rollLootCrate(crate: LootCrate, ownedIds: Set<string> = new Set()): { drops: LootDrop[]; dust: number } {
  const rolls = crate.minRolls + Math.floor(Math.random() * (crate.maxRolls - crate.minRolls + 1));
  const drops: LootDrop[] = [];
  let dust = 0;
  const allItems: LootDrop[] = [...SKINS.filter(s => s.id !== "bud"), ...TRAILS.filter(t => t.id !== "none"), ...TITLES, ...BADGES, ...EFFECTS.filter(e => e.id !== "e_none")];

  for (let i = 0; i < rolls; i++) {
    const rarity = rollRarity(crate);
    let eligible = allItems.filter(item => item.rarity === rarity && !ownedIds.has(item.id));
    if (eligible.length === 0) eligible = allItems.filter(item => item.rarity === rarity);
    if (eligible.length > 0) {
      drops.push(eligible[Math.floor(Math.random() * eligible.length)]);
    } else {
      dust += RARITY[rarity].dustValue * 2;
    }
  }

  const dustEligible = allItems.filter(item => item.rarity === "common" && !ownedIds.has(item.id));
  if (drops.length === 0 && dustEligible.length === 0) {
    const fallback = allItems.filter(item => item.rarity === "common");
    if (fallback.length > 0) drops.push(fallback[Math.floor(Math.random() * fallback.length)]);
  } else if (drops.length === 0 && dustEligible.length > 0) {
    drops.push(dustEligible[Math.floor(Math.random() * dustEligible.length)]);
  }

  return { drops, dust };
}

function rollRarity(crate: LootCrate): Rarity {
  if (crate.guaranteed && Math.random() < 0.7) {
    const idx = crate.rarities.indexOf(crate.guaranteed);
    if (idx >= 0) return crate.rarities[Math.min(idx + Math.floor(Math.random() * Math.max(1, crate.rarities.length - idx)), crate.rarities.length - 1)] as Rarity;
  }
  const r = Math.random();
  let cumulative = 0;
  const weighted = crate.rarities.map(ra => ({ rarity: ra, weight: RARITY[ra].dropRate }));
  const total = weighted.reduce((s, w) => s + w.weight, 0);
  for (const w of weighted) {
    cumulative += w.weight / total;
    if (r <= cumulative) return w.rarity;
  }
  return crate.rarities[crate.rarities.length - 1] as Rarity;
}

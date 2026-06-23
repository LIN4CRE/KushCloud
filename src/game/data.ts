export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";

export const RARITY: Record<Rarity, {
  color: string; glow: string; bg: string; border: string; label: string;
}> = {
  common:    { color: "text-gray-200",      glow: "shadow-gray-400/30",    bg: "bg-gray-800/60",    border: "border-gray-600",     label: "Common" },
  uncommon:  { color: "text-green-300",     glow: "shadow-green-400/30",  bg: "bg-green-900/40",   border: "border-green-600",    label: "Uncommon" },
  rare:      { color: "text-blue-300",      glow: "shadow-blue-400/30",   bg: "bg-blue-900/40",    border: "border-blue-600",     label: "Rare" },
  epic:      { color: "text-purple-300",    glow: "shadow-purple-400/30", bg: "bg-purple-900/40",  border: "border-purple-600",   label: "Epic" },
  legendary: { color: "text-amber-300",     glow: "shadow-amber-400/30",  bg: "bg-amber-900/40",   border: "border-amber-600",    label: "Legendary" },
  mythic:    { color: "text-rose-300",      glow: "shadow-rose-400/30",   bg: "bg-rose-900/40",    border: "border-rose-600",     label: "Mythic" },
};

export interface Skin {
  id: string; name: string; rarity: Rarity; cost: number;
  image: string; bodyColor: string; wingColor: string; crestColor: string;
}

export const SKINS: Skin[] = [
  { id: "bud",       name: "Bud",       rarity: "common",    cost: 0,    image: "🪻", bodyColor: "#a3e635", wingColor: "#84cc16", crestColor: "#65a30d" },
  { id: "ember",     name: "Ember",     rarity: "uncommon",  cost: 500,  image: "🔥", bodyColor: "#f97316", wingColor: "#ea580c", crestColor: "#c2410c" },
  { id: "frost",     name: "Frost",     rarity: "uncommon",  cost: 500,  image: "❄️", bodyColor: "#67e8f9", wingColor: "#22d3ee", crestColor: "#0891b2" },
  { id: "shadow",    name: "Shadow",    rarity: "rare",      cost: 1500, image: "🌑", bodyColor: "#6b7280", wingColor: "#4b5563", crestColor: "#374151" },
  { id: "cosmic",    name: "Cosmic",    rarity: "epic",      cost: 3000, image: "🌌", bodyColor: "#a855f7", wingColor: "#7e22ce", crestColor: "#581c87" },
  { id: "golden",    name: "Golden",    rarity: "legendary", cost: 5000, image: "👑", bodyColor: "#fbbf24", wingColor: "#d97706", crestColor: "#b45309" },
  { id: "nebula",    name: "Nebula",    rarity: "mythic",    cost: 10000,image: "🪐", bodyColor: "#ec4899", wingColor: "#be185d", crestColor: "#9d174d" },
  { id: "midnight",  name: "Midnight",  rarity: "rare",      cost: 1500, image: "🌙", bodyColor: "#1e293b", wingColor: "#334155", crestColor: "#475569" },
  { id: "sunset",    name: "Sunset",    rarity: "epic",      cost: 3000, image: "🌅", bodyColor: "#f43f5e", wingColor: "#e11d48", crestColor: "#be123c" },
  { id: "toxic",     name: "Toxic",     rarity: "uncommon",  cost: 500,  image: "☢️", bodyColor: "#84cc16", wingColor: "#65a30d", crestColor: "#4d7c0f" },
  { id: "ghost",     name: "Ghost",     rarity: "rare",      cost: 1500, image: "👻", bodyColor: "#cbd5e1", wingColor: "#94a3b8", crestColor: "#64748b" },
  { id: "lava",      name: "Lava",      rarity: "epic",      cost: 3000, image: "🌋", bodyColor: "#dc2626", wingColor: "#b91c1c", crestColor: "#991b1b" },
  { id: "aurora",    name: "Aurora",    rarity: "legendary", cost: 5000, image: "🌈", bodyColor: "#06b6d4", wingColor: "#0891b2", crestColor: "#0e7490" },
  { id: "void",      name: "Void",      rarity: "mythic",    cost: 10000,image: "🕳️", bodyColor: "#000000", wingColor: "#111827", crestColor: "#1f2937" },
  { id: "pastel",    name: "Pastel",    rarity: "common",    cost: 100,  image: "🌸", bodyColor: "#f9a8d4", wingColor: "#f472b6", crestColor: "#ec4899" },
  { id: "ocean",     name: "Ocean",     rarity: "uncommon",  cost: 500,  image: "🌊", bodyColor: "#3b82f6", wingColor: "#2563eb", crestColor: "#1d4ed8" },
  { id: "royal",     name: "Royal",     rarity: "epic",      cost: 3000, image: "💎", bodyColor: "#8b5cf6", wingColor: "#7c3aed", crestColor: "#6d28d9" },
  { id: "inferno",   name: "Inferno",   rarity: "legendary", cost: 5000, image: "💥", bodyColor: "#ef4444", wingColor: "#dc2626", crestColor: "#b91c1c" },
  { id: "crystal",   name: "Crystal",   rarity: "rare",      cost: 1500, image: "💠", bodyColor: "#99f6e4", wingColor: "#2dd4bf", crestColor: "#14b8a6" },
  { id: "candy",     name: "Candy",     rarity: "common",    cost: 100,  image: "🍬", bodyColor: "#fb923c", wingColor: "#f97316", crestColor: "#ea580c" },
  { id: "moonlight", name: "Moonlight", rarity: "epic",      cost: 3000, image: "🌙", bodyColor: "#e2e8f0", wingColor: "#cbd5e1", crestColor: "#94a3b8" },
  { id: "blaze",     name: "Blaze",     rarity: "rare",      cost: 1500, image: "⚡", bodyColor: "#facc15", wingColor: "#eab308", crestColor: "#ca8a04" },
  { id: "fairy",     name: "Fairy",     rarity: "uncommon",  cost: 500,  image: "🧚", bodyColor: "#f0abfc", wingColor: "#d946ef", crestColor: "#c026d3" },
  { id: "dragon",    name: "Dragon",    rarity: "legendary", cost: 5000, image: "🐉", bodyColor: "#f97316", wingColor: "#ea580c", crestColor: "#9a3412" },
];

export interface Trail {
  id: string; name: string; rarity: Rarity; cost: number;
  particles: string; color: string; size: number; lifetime: number;
}

export const TRAILS: Trail[] = [
  { id: "none",     name: "None",      rarity: "common",    cost: 0,    particles: "none",     color: "",          size: 0,  lifetime: 0 },
  { id: "puff",     name: "Puff",      rarity: "common",    cost: 100,  particles: "circle",   color: "#a3e635",   size: 3,  lifetime: 400 },
  { id: "spark",    name: "Spark",     rarity: "uncommon",  cost: 500,  particles: "star",     color: "#fbbf24",   size: 4,  lifetime: 500 },
  { id: "leaf",     name: "Leaf",      rarity: "common",    cost: 100,  particles: "leaf",     color: "#84cc16",   size: 5,  lifetime: 600 },
  { id: "rainbow",  name: "Rainbow",   rarity: "rare",      cost: 1500, particles: "circle",   color: "#ec4899",   size: 4,  lifetime: 700 },
  { id: "frost",    name: "Frost",     rarity: "uncommon",  cost: 500,  particles: "diamond",  color: "#67e8f9",   size: 3,  lifetime: 600 },
  { id: "flame",    name: "Flame",     rarity: "rare",      cost: 1500, particles: "circle",   color: "#ef4444",   size: 5,  lifetime: 500 },
  { id: "cosmic",   name: "Cosmic",    rarity: "epic",      cost: 3000, particles: "star",     color: "#a855f7",   size: 6,  lifetime: 800 },
  { id: "shadow",   name: "Shadow",    rarity: "uncommon",  cost: 500,  particles: "circle",   color: "#6b7280",   size: 4,  lifetime: 400 },
  { id: "gold",     name: "Gold",      rarity: "epic",      cost: 3000, particles: "circle",   color: "#fbbf24",   size: 5,  lifetime: 700 },
  { id: "glow",     name: "Glow",      rarity: "rare",      cost: 1500, particles: "circle",   color: "#22d3ee",   size: 6,  lifetime: 600 },
  { id: "embers",   name: "Embers",    rarity: "epic",      cost: 3000, particles: "circle",   color: "#f97316",   size: 4,  lifetime: 900 },
  { id: "nebula",   name: "Nebula",    rarity: "legendary", cost: 5000, particles: "star",     color: "#ec4899",   size: 7,  lifetime: 1000 },
  { id: "holy",     name: "Holy",      rarity: "legendary", cost: 5000, particles: "diamond",  color: "#fef08a",   size: 6,  lifetime: 900 },
  { id: "void",     name: "Void",      rarity: "mythic",    cost: 10000,particles: "circle",   color: "#000000",   size: 8,  lifetime: 1200 },
];

export interface World {
  id: string; name: string; minScore: number;
  sky: [string, string]; pipe: string; pipeDark: string; ground: string; accent: string;
}

export const WORLDS: World[] = [
  { id: "dispensary", name: "Meadow",    minScore: 0,   sky: ["#38bdf8","#bbf7d0"], pipe: "#22c55e", pipeDark: "#15803d", ground: "#15803d", accent: "#86efac" },
  { id: "sunset",     name: "Sunset",    minScore: 25,  sky: ["#fb923c","#f9a8d4"], pipe: "#f97316", pipeDark: "#c2410c", ground: "#92400e", accent: "#fdba74" },
  { id: "night",      name: "Night",     minScore: 50,  sky: ["#1e293b","#312e81"], pipe: "#6366f1", pipeDark: "#4338ca", ground: "#1e293b", accent: "#818cf8" },
  { id: "arctic",     name: "Arctic",    minScore: 80,  sky: ["#67e8f9","#e0f2fe"], pipe: "#06b6d4", pipeDark: "#0891b2", ground: "#0f766e", accent: "#22d3ee" },
  { id: "volcanic",   name: "Volcanic",  minScore: 120, sky: ["#dc2626","#f97316"], pipe: "#dc2626", pipeDark: "#991b1b", ground: "#450a0a", accent: "#fca5a5" },
  { id: "cosmos",     name: "Cosmic",    minScore: 180, sky: ["#2e1065","#6b21a8"], pipe: "#a855f7", pipeDark: "#7e22ce", ground: "#2e1065", accent: "#c084fc" },
  { id: "heaven",     name: "Celestial", minScore: 250, sky: ["#fef08a","#fef9c3"], pipe: "#facc15", pipeDark: "#ca8a04", ground: "#854d0e", accent: "#fde047" },
  { id: "neon",       name: "Neon",      minScore: 350, sky: ["#86198f","#be185d"], pipe: "#d946ef", pipeDark: "#a21caf", ground: "#4a044e", accent: "#f0abfc" },
];

export function worldForScore(score: number): World {
  return [...WORLDS].reverse().find((w) => score >= w.minScore) || WORLDS[0];
}

export interface PowerUp {
  id: string; name: string; cost: number; duration: number;
  description: string; gradient: string; icon: string;
  effect: "coinMultiplier" | "slowMotion" | "magnet" | "shield" | "doubleJump";
}

export const POWERUPS: PowerUp[] = [
  { id: "slow",      name: "Slow Motion", cost: 300,  duration: 8,    description: "Slows the world for tighter dodges", gradient: "from-cyan-500 to-blue-600",    icon: "⏱️", effect: "slowMotion" },
  { id: "invincible",name: "Shield",      cost: 500,  duration: 4,    description: "Blocks one collision",              gradient: "from-amber-400 to-orange-600", icon: "🛡️", effect: "shield" },
  { id: "magnet",    name: "Magnet",      cost: 400,  duration: 8,    description: "Pulls nearby coins into you",        gradient: "from-pink-400 to-rose-600",    icon: "🧲", effect: "magnet" },
  { id: "double",    name: "2x Score",    cost: 600,  duration: 8,    description: "Doubles score and coin pickups",     gradient: "from-violet-500 to-purple-700", icon: "✖️",  effect: "coinMultiplier" },
  { id: "ghost",     name: "Ghost Hop",   cost: 800,  duration: 6,    description: "Grants a reusable mid-air double jump", gradient: "from-slate-400 to-slate-600",  icon: "👻", effect: "doubleJump" },
];

export interface PlayerStats {
  totalGames: number;
  totalScore: number;
  totalCoins: number;
  totalNearMiss: number;
  totalPerfectPasses: number;
  bestCombo: number;
  totalFlaps: number;
  bestScore: number;
}

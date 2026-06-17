import { useEffect, useState } from "react";
import { SKINS, TRAILS, TITLES, BADGES, EFFECTS, RARITY, rollLootCrate, lootFeverBonusRolls, type LootCrate, type LootDrop, type Skin, type Badge } from "../game/data";
import type { SaveData } from "../game/storage";
import { Button } from "../ui";
import { audio } from "../game/audio";

export function CrateReveal({ crate, save, onClaim, onClose }: {
  crate: LootCrate;
  save: SaveData;
  onClaim: (itemIds: string[], dust: number) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"shake" | "reveal" | "done">("shake");
  const [drops, setDrops] = useState<Array<{ drop: LootDrop; type: string; icon: string }>>([]);
  const [dust, setDust] = useState(0);

  useEffect(() => {
    const owned = new Set([...save.ownedSkins, ...save.ownedTrails, ...save.ownedTitles, ...save.ownedBadges, ...save.ownedEffects]);
    const result = rollLootCrate(crate, owned, { bonusRolls: lootFeverBonusRolls() });
    if (result.drops.length === 0) {
      onClaim([], 0);
      return;
    }
    const mapped = result.drops.map(drop => {
      let type = "Skin", icon = "🐦";
      if (TRAILS.find(t => t.id === drop.id)) { type = "Trail"; icon = "✨"; }
      else if (TITLES.find(t => t.id === drop.id)) { type = "Title"; icon = "📛"; }
      else if (BADGES.find(t => t.id === drop.id)) { type = "Badge"; icon = (drop as Badge).icon || "🏅"; }
      else if (EFFECTS.find(t => t.id === drop.id)) { type = "Effect"; icon = "🌈"; }
      else if (SKINS.find(t => t.id === drop.id)) { icon = (drop as Skin).emoji || "🐦"; }
      return { drop, type, icon };
    });
    setDrops(mapped);
    setDust(result.dust);
  }, [crate, onClaim, save.ownedBadges, save.ownedEffects, save.ownedSkins, save.ownedTitles, save.ownedTrails]);

  useEffect(() => {
    if (phase !== "shake") return;
    const t1 = setTimeout(() => audio.crateOpen(), 100);
    const t2 = setTimeout(() => {
      audio.rareDrop();
      setPhase("reveal");
    }, 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  if (phase === "shake") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="text-7xl animate-[crate-shake_0.4s_ease-in-out_infinite]">{crate.icon}</div>
        <div className="text-white/60 text-sm font-semibold animate-pulse">Opening {crate.name}...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <h2 className="text-xl font-black text-white">🎉 You Got!</h2>
      <div className="grid gap-3 w-full" style={{ gridTemplateColumns: drops.length > 1 ? "1fr 1fr" : "1fr" }}>
        {drops.map((d, i) => {
          const rarity = d.drop.rarity as string;
          const r = (RARITY as Record<string, { bg: string; border: string; glow: string; label: string; color: string }>)[rarity];
          return (
            <div
              key={i}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl animate-[reveal_0.5s_ease-out_forwards]"
              style={{
                background: r.bg,
                border: `1px solid ${r.border}`,
                boxShadow: `0 0 20px ${r.glow}`,
                animationDelay: `${i * 200}ms`,
                opacity: 0,
              }}
            >
              <div className={`text-3xl rarity-glow-${rarity}`}>{d.icon}</div>
              <div className="text-sm font-black text-white text-center">{d.drop.name}</div>
              <span
                className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full"
                style={{ background: r.bg, border: `1px solid ${r.border}`, color: r.color }}
              >
                {r.label}
              </span>
              <div className="text-[9px] font-medium text-white/40">{d.type}</div>
            </div>
          );
        })}
      </div>
      {dust > 0 && <div className="text-sm text-white/60">+{dust} 💎 Dust</div>}
      <Button
        variant="gold"
        className="w-full mt-2"
        onClick={() => { audio.reward(); onClaim(drops.map(d => d.drop.id), dust); onClose(); }}
      >
        Claim & Continue
      </Button>
    </div>
  );
}

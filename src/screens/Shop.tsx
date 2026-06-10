import { useState } from "react";
import { SaveData } from "../game/storage";
import {
  SKINS, TRAILS, TITLES, BADGES, EFFECTS, POWERUPS, LOOT_CRATES,
  levelFromXp, RARITY, type Rarity, type LootCrate,
} from "../game/data";
import { ScreenShell, Button, CoinPill, cx, RarityBadge, RarityGlow, Tabs } from "../ui";
import { audio } from "../game/audio";

interface Props {
  save: SaveData;
  onBack: () => void;
  onBuySkin: (id: string) => void;
  onBuyTrail: (id: string) => void;
  onBuyCrate: (crate: LootCrate) => void;
  onEquipSkin: (id: string) => void;
  onEquipTrail: (id: string) => void;
  onEquipTitle: (id: string | null) => void;
  onEquipBadge: (id: string | null) => void;
  onEquipEffect: (id: string) => void;
  onBuyPowerUp: (id: string) => void;
}

type Tab = "skins" | "trails" | "titles" | "badges" | "effects" | "crates" | "powerups";

export default function Shop({ save, onBack, onBuySkin, onBuyTrail, onBuyCrate, onEquipSkin, onEquipTrail, onEquipTitle, onEquipBadge, onEquipEffect, onBuyPowerUp }: Props) {
  const [tab, setTab] = useState<Tab>("skins");
  const lvl = levelFromXp(save.xp).level;
  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "skins", label: "Skins", icon: "🐦" },
    { key: "trails", label: "Trails", icon: "✨" },
    { key: "titles", label: "Titles", icon: "📛" },
    { key: "badges", label: "Badges", icon: "🏅" },
    { key: "effects", label: "Effects", icon: "🌈" },
    { key: "crates", label: "Crates", icon: "🎁" },
    { key: "powerups", label: "Power-ups", icon: "⚡" },
  ];

  const renderItemCard = (
    item: { id: string; name: string; desc: string; cost?: number; rarity: Rarity },
    owned: boolean,
    equipped: boolean,
    locked: boolean,
    onBuy: () => void,
    onEquip: () => void,
    preview?: ReactNode,
  ) => (
    <RarityGlow rarity={item.rarity} key={item.id}>
      <div className={cx("flex flex-col p-3", equipped && "border border-emerald-400/30 rounded-2xl bg-emerald-500/5")}>
        {preview}
        <div className="mt-2 text-center">
          <div className="text-sm font-black text-white">{item.name}</div>
          <RarityBadge rarity={item.rarity} />
        </div>
        <div className="my-1.5 text-center text-[10px] font-medium text-white/40 leading-tight">{item.desc}</div>
        {locked ? (
          <div className="mt-auto rounded-xl bg-black/30 py-1.5 text-center text-xs font-semibold text-white/40">
            🔒 Level {(item as any).unlockLevel}
          </div>
        ) : equipped ? (
          <div className="mt-auto rounded-xl bg-emerald-500/20 border border-emerald-400/30 py-1.5 text-center text-xs font-black text-emerald-300">
            ✓ Equipped
          </div>
        ) : owned ? (
          <Button size="sm" variant="dark" className="mt-auto w-full" onClick={onEquip}>
            Equip
          </Button>
        ) : (
          <Button
            size="sm"
            variant={save.coins >= (item.cost ?? 999999) ? "gold" : "dark"}
            disabled={save.coins < (item.cost ?? 999999)}
            className="mt-auto w-full"
            onClick={onBuy}
          >
            🪙 {item.cost}
          </Button>
        )}
      </div>
    </RarityGlow>
  );

  return (
    <ScreenShell title="Shop" onBack={onBack} right={<CoinPill coins={save.coins} />} subtitle="Cosmetics never affect gameplay">
      <Tabs tabs={tabs} active={tab} onChange={(k) => setTab(k as Tab)} />

      <div className="mt-3">
        {tab === "skins" && (
          <div className="grid grid-cols-2 gap-3">
            {SKINS.map((s) => renderItemCard(
              s,
              save.ownedSkins.includes(s.id),
              save.equippedSkin === s.id,
              !!s.unlockLevel && lvl < s.unlockLevel,
              () => onBuySkin(s.id),
              () => onEquipSkin(s.id),
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl shadow-lg"
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${s.body}, ${s.accent})`,
                  boxShadow: `0 0 20px ${s.accent}50`,
                  opacity: (!!s.unlockLevel && lvl < s.unlockLevel) ? 0.45 : 1,
                }}
              >
                {s.emoji}
              </div>,
            ))}
          </div>
        )}

        {tab === "trails" && (
          <div className="grid grid-cols-2 gap-3">
            {TRAILS.map((t) => renderItemCard(
              t,
              save.ownedTrails.includes(t.id),
              save.equippedTrail === t.id,
              false,
              () => onBuyTrail(t.id),
              () => onEquipTrail(t.id),
              <div className="mx-auto flex h-12 w-24 items-center justify-center gap-1 rounded-xl bg-black/25">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="rounded-full"
                    style={{
                      width: 10 - i * 2,
                      height: 10 - i * 2,
                      background: t.kind === "rainbow" || t.kind === "aurora" ? `hsl(${i * 80},90%,65%)` : t.glow,
                      opacity: 0.9 - i * 0.2,
                    }}
                  />
                ))}
              </div>,
            ))}
          </div>
        )}

        {tab === "titles" && (
          <div className="grid grid-cols-2 gap-3">
            {TITLES.map((t) => renderItemCard(
              { ...t, cost: 0 },
              save.ownedTitles.includes(t.id),
              save.equippedTitle === t.id,
              false,
              () => { audio.error(); },
              () => onEquipTitle(save.equippedTitle === t.id ? null : t.id),
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-black/25 text-lg">
                📛
              </div>,
            ))}
          </div>
        )}

        {tab === "badges" && (
          <div className="grid grid-cols-2 gap-3">
            {BADGES.map((b) => renderItemCard(
              { ...b, cost: 0 },
              save.ownedBadges.includes(b.id),
              save.equippedBadge === b.id,
              false,
              () => { audio.error(); },
              () => onEquipBadge(save.equippedBadge === b.id ? null : b.id),
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-black/25 text-2xl">
                {b.icon}
              </div>,
            ))}
          </div>
        )}

        {tab === "effects" && (
          <div className="grid grid-cols-2 gap-3">
            {EFFECTS.map((e) => {
              const owned = save.ownedEffects.includes(e.id);
              const equipped = save.equippedEffect === e.id;
              return (
                <RarityGlow rarity={e.rarity} key={e.id}>
                  <div className={cx("flex flex-col p-3", equipped && "border border-emerald-400/30 rounded-2xl bg-emerald-500/5")}>
                    <div
                      className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-lg"
                      style={{ background: `radial-gradient(circle, ${e.color}30, transparent)`, boxShadow: equipped ? `0 0 16px ${e.color}` : undefined }}
                    >
                      {e.id === "e_none" ? "🚫" : "✨"}
                    </div>
                    <div className="mt-2 text-center">
                      <div className="text-sm font-black text-white">{e.name}</div>
                      <RarityBadge rarity={e.rarity} />
                    </div>
                    <div className="my-1.5 text-center text-[10px] font-medium text-white/40 leading-tight">{e.desc}</div>
                    {equipped ? (
                      <div className="mt-auto rounded-xl bg-emerald-500/20 border border-emerald-400/30 py-1.5 text-center text-xs font-black text-emerald-300">✓ Equipped</div>
                    ) : owned ? (
                      <Button size="sm" variant="dark" className="mt-auto w-full" onClick={() => onEquipEffect(e.id)}>Equip</Button>
                    ) : (
                      <div className="mt-auto rounded-xl bg-black/30 py-1.5 text-center text-xs font-semibold text-white/40">
                        🔒 Found in crates
                      </div>
                    )}
                  </div>
                </RarityGlow>
              );
            })}
          </div>
        )}

        {tab === "crates" && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-white/35">Crates contain random cosmetics — skins, trails, titles, badges, and effects. Higher-tier crates = better loot!</p>
            {LOOT_CRATES.map((c) => {
              const affordable = save.coins >= c.cost;
              return (
                <div
                  key={c.id}
                  className="relative overflow-hidden rounded-3xl border border-white/[0.1] bg-gradient-to-br from-violet-900/30 via-slate-900 to-indigo-900/30 p-4"
                >
                  <ConfettiBurst active={false} />
                  <div className="flex items-center gap-4">
                    <div
                      className={cx(
                        "flex h-20 w-20 items-center justify-center rounded-2xl text-4xl bg-black/30 border border-white/[0.08]",
                        affordable ? "cursor-pointer hover:scale-105 transition-transform" : "",
                      )}
                      onClick={() => { if (affordable) { audio.crateOpen(); onBuyCrate(c); } }}
                    >
                      {c.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-white text-base">{c.name}</div>
                      <div className="text-[10px] font-medium text-white/40 mt-0.5">{c.desc}</div>
                      <div className="flex gap-1 mt-2">
                        {c.rarities.map((r) => (
                          <span key={r} className="w-2 h-2 rounded-full" style={{ background: RARITY[r].color }} />
                        ))}
                        {c.guaranteed && (
                          <span className="text-[8px] font-black uppercase ml-1" style={{ color: RARITY[c.guaranteed].color }}>
                            ★ {RARITY[c.guaranteed].label}+
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant={affordable ? "premium" : "dark"}
                      disabled={!affordable}
                      size="sm"
                      onClick={() => { audio.crateOpen(); onBuyCrate(c); }}
                    >
                      🪙 {c.cost}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "powerups" && (
          <div className="grid grid-cols-2 gap-3">
            {POWERUPS.map((p) => {
              const owned = save.ownedPowerUps.includes(p.id);
              const affordable = save.coins >= p.cost;
              return (
                <div key={p.id} className="rounded-2xl bg-white/[0.06] border border-white/[0.08] p-3 flex flex-col">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 text-2xl">
                    {p.icon}
                  </div>
                  <div className="mt-2 text-center text-sm font-black text-white">{p.name}</div>
                  <div className="my-1 text-center text-[10px] font-medium text-white/40">{p.desc}</div>
                  <div className="text-center text-[9px] font-semibold text-white/30 mb-2">⏱ {p.duration > 0 ? `${p.duration}s` : "Instant"}</div>
                  {owned ? (
                    <div className="mt-auto rounded-xl bg-emerald-500/20 border border-emerald-400/30 py-1.5 text-center text-xs font-black text-emerald-300">✓ Stocked</div>
                  ) : (
                    <Button
                      size="sm"
                      variant={affordable ? "gold" : "dark"}
                      disabled={!affordable}
                      className="mt-auto w-full"
                      onClick={() => onBuyPowerUp(p.id)}
                    >
                      🪙 {p.cost}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </ScreenShell>
  );
}

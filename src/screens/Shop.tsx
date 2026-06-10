import { useState } from "react";
import { SaveData } from "../game/storage";
import { SKINS, TRAILS, levelFromXp } from "../game/data";
import { ScreenShell, Button, CoinPill, cx } from "../ui";

interface Props {
  save: SaveData;
  onBack: () => void;
  onBuySkin: (id: string) => void;
  onBuyTrail: (id: string) => void;
  onEquipSkin: (id: string) => void;
  onEquipTrail: (id: string) => void;
}

export default function Shop({ save, onBack, onBuySkin, onBuyTrail, onEquipSkin, onEquipTrail }: Props) {
  const [tab, setTab] = useState<"skins" | "trails">("skins");
  const lvl = levelFromXp(save.xp).level;

  return (
    <ScreenShell title="Shop" onBack={onBack} right={<CoinPill coins={save.coins} />}>
      <p className="mb-3 text-xs font-medium text-white/35">Cosmetics only — looks never affect gameplay. 😎</p>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl bg-black/25 p-1">
        {(["skins", "trails"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cx(
              "flex-1 rounded-lg py-2 text-sm font-bold capitalize transition-all duration-200",
              tab === t
                ? "bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.4)]"
                : "text-white/50 hover:text-white/70",
            )}
          >
            {t === "skins" ? "🐦 Skins" : "✨ Trails"}
          </button>
        ))}
      </div>

      {tab === "skins" && (
        <div className="grid grid-cols-2 gap-3">
          {SKINS.map((s) => {
            const owned = save.ownedSkins.includes(s.id);
            const equipped = save.equippedSkin === s.id;
            const locked = !!s.unlockLevel && lvl < s.unlockLevel;
            const affordable = save.coins >= s.cost;
            return (
              <div
                key={s.id}
                className={cx(
                  "flex flex-col rounded-2xl border p-3 transition-all",
                  equipped
                    ? "bg-emerald-500/10 border-emerald-400/30"
                    : "bg-white/[0.06] border-white/[0.08] hover:border-white/[0.14]",
                )}
              >
                <div
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl shadow-lg"
                  style={{
                    background: `radial-gradient(circle at 35% 30%, ${s.body}, ${s.accent})`,
                    boxShadow: equipped ? `0 0 16px ${s.accent}60` : undefined,
                    opacity: locked ? 0.45 : 1,
                  }}
                >
                  {s.emoji}
                </div>
                <div className="mt-2.5 text-center text-sm font-black text-white">{s.name}</div>
                <div className="mb-3 text-center text-[10px] font-medium text-white/40 leading-tight">{s.desc}</div>
                {locked ? (
                  <div className="mt-auto rounded-xl bg-black/25 py-1.5 text-center text-xs font-semibold text-white/40 border border-white/[0.06]">
                    🔒 Level {s.unlockLevel}
                  </div>
                ) : equipped ? (
                  <div className="mt-auto rounded-xl bg-emerald-500/20 border border-emerald-400/30 py-1.5 text-center text-xs font-black text-emerald-300">
                    ✓ Equipped
                  </div>
                ) : owned ? (
                  <Button size="sm" variant="dark" className="mt-auto w-full" onClick={() => onEquipSkin(s.id)}>
                    Equip
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant={affordable ? "gold" : "dark"}
                    disabled={!affordable}
                    className="mt-auto w-full"
                    onClick={() => onBuySkin(s.id)}
                  >
                    🪙 {s.cost}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "trails" && (
        <div className="grid grid-cols-2 gap-3">
          {TRAILS.map((t) => {
            const owned = save.ownedTrails.includes(t.id);
            const equipped = save.equippedTrail === t.id;
            const affordable = save.coins >= t.cost;
            return (
              <div
                key={t.id}
                className={cx(
                  "flex flex-col rounded-2xl border p-3 transition-all",
                  equipped
                    ? "bg-emerald-500/10 border-emerald-400/30"
                    : "bg-white/[0.06] border-white/[0.08] hover:border-white/[0.14]",
                )}
              >
                {/* Trail preview */}
                <div className="mx-auto flex h-14 w-20 items-center justify-center gap-1 rounded-xl bg-black/25">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="rounded-full"
                      style={{
                        width: 10 - i * 1.5,
                        height: 10 - i * 1.5,
                        background: t.kind === "rainbow" ? `hsl(${i * 80},90%,65%)` : t.glow,
                        opacity: 0.9 - i * 0.2,
                      }}
                    />
                  ))}
                </div>
                <div className="mt-2.5 text-center text-sm font-black text-white">{t.name}</div>
                <div className="mb-3 text-center text-[10px] font-medium text-white/40 leading-tight">{t.desc}</div>
                {equipped ? (
                  <div className="mt-auto rounded-xl bg-emerald-500/20 border border-emerald-400/30 py-1.5 text-center text-xs font-black text-emerald-300">
                    ✓ Equipped
                  </div>
                ) : owned ? (
                  <Button size="sm" variant="dark" className="mt-auto w-full" onClick={() => onEquipTrail(t.id)}>
                    Equip
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant={affordable ? "gold" : "dark"}
                    disabled={!affordable}
                    className="mt-auto w-full"
                    onClick={() => onBuyTrail(t.id)}
                  >
                    🪙 {t.cost}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </ScreenShell>
  );
}

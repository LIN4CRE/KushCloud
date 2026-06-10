import { SaveData } from "../game/storage";
import { SKINS, TRAILS, TITLES, BADGES, EFFECTS, levelFromXp } from "../game/data";
import { ScreenShell, Stat, ProgressBar, RarityBadge } from "../ui";

interface Props {
  save: SaveData;
  onBack: () => void;
  onRename: (name: string) => void;
}

export default function Profile({ save, onBack, onRename }: Props) {
  const lvl = levelFromXp(save.xp);
  const skin = SKINS.find((s) => s.id === save.equippedSkin) || SKINS[0];
  const trail = TRAILS.find((t) => t.id === save.equippedTrail) || TRAILS[0];
  const title = TITLES.find((t) => t.id === save.equippedTitle);
  const badge = BADGES.find((b) => b.id === save.equippedBadge);
  const effect = EFFECTS.find((e) => e.id === save.equippedEffect) || EFFECTS[0];
  const hist = save.scoreHistory.slice(-20);
  const maxH = Math.max(1, ...hist);
  const total = save.ownedSkins.length + save.ownedTrails.length + save.ownedTitles.length + save.ownedBadges.length + save.ownedEffects.length;
  const allSkins = SKINS.length + TRAILS.length + TITLES.length + BADGES.length + EFFECTS.length;

  return (
    <ScreenShell title="Profile" onBack={onBack}>
      {/* Header card */}
      <div className="flex items-center gap-4 rounded-3xl bg-white/[0.07] border border-white/[0.09] p-4">
        <div
          className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl text-4xl shrink-0 shadow-lg"
          style={{
            background: `radial-gradient(circle at 35% 30%, ${skin.body}, ${skin.accent})`,
            boxShadow: `0 0 20px ${skin.accent}50`,
          }}
        >
          {skin.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {title && <span className="text-xs font-black text-white/60">{title.name}</span>}
          </div>
          <input
            value={save.playerName}
            maxLength={16}
            onChange={(e) => onRename(e.target.value)}
            className="w-full bg-transparent text-lg font-black text-white outline-none border-b border-transparent focus:border-white/25 transition-colors placeholder:text-white/30"
            placeholder="Your name…"
          />
          <div className="mt-0.5 text-xs font-black text-emerald-400">Level {lvl.level}</div>
          <div className="mt-1.5"><ProgressBar value={lvl.into} max={lvl.need} /></div>
          <div className="mt-1 text-[10px] font-semibold text-white/35 tabular-nums">{lvl.into} / {lvl.need} XP</div>
        </div>
      </div>

      {/* Equipped showcase */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {trail.id !== "none" && (
          <div className="rounded-2xl bg-white/[0.06] border border-white/[0.08] p-2.5 text-center">
            <div className="text-lg mb-0.5">✨</div>
            <div className="text-[10px] font-semibold text-white/70 truncate">{trail.name}</div>
            <RarityBadge rarity={trail.rarity} />
          </div>
        )}
        {badge && (
          <div className="rounded-2xl bg-white/[0.06] border border-white/[0.08] p-2.5 text-center">
            <div className="text-lg mb-0.5">{badge.icon}</div>
            <div className="text-[10px] font-semibold text-white/70 truncate">{badge.name}</div>
            <RarityBadge rarity={badge.rarity} />
          </div>
        )}
        {effect.id !== "e_none" && (
          <div className="rounded-2xl bg-white/[0.06] border border-white/[0.08] p-2.5 text-center">
            <div className="text-lg mb-0.5">🌈</div>
            <div className="text-[10px] font-semibold text-white/70 truncate">{effect.name}</div>
            <RarityBadge rarity={effect.rarity} />
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat icon="🏆" label="Best Score" value={save.stats.bestScore} />
        <Stat icon="🎮" label="Games" value={save.stats.totalGames} />
        <Stat icon="🪙" label="Total Coins" value={save.stats.totalCoins.toLocaleString()} />
        <Stat icon="📊" label="Total Score" value={save.stats.totalScore.toLocaleString()} />
        <Stat icon="🎯" label="Near Misses" value={save.stats.totalNearMiss} />
        <Stat icon="🔥" label="Best Combo" value={`x${save.stats.bestCombo}`} />
        <Stat icon="🪽" label="Flaps" value={save.stats.totalFlaps.toLocaleString()} />
        <Stat icon="🎁" label="Crates Opened" value={save.cratesOpened} />
        <Stat icon="💎" label="Dust" value={save.dust} />
      </div>

      {/* Collection progress */}
      <div className="mt-5">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-white/35 mb-2.5">Collection</h2>
        <div className="rounded-2xl bg-white/[0.06] border border-white/[0.08] p-3">
          <div className="flex justify-between text-sm font-semibold text-white mb-1.5">
            <span>Progress</span>
            <span className="text-white/60">{total}/{allSkins}</span>
          </div>
          <ProgressBar value={total} max={allSkins} />
          <div className="grid grid-cols-5 gap-1.5 mt-3">
            <MiniCollection label="Skins" owned={save.ownedSkins.length} total={SKINS.length} />
            <MiniCollection label="Trails" owned={save.ownedTrails.length} total={TRAILS.length} />
            <MiniCollection label="Titles" owned={save.ownedTitles.length} total={TITLES.length} />
            <MiniCollection label="Badges" owned={save.ownedBadges.length} total={BADGES.length} />
            <MiniCollection label="Effects" owned={save.ownedEffects.length} total={EFFECTS.length} />
          </div>
        </div>
      </div>

      {/* Recent runs */}
      <div className="mt-5">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-white/35 mb-2.5">Recent Runs</h2>
        <div className="rounded-2xl bg-white/[0.06] border border-white/[0.08] p-4">
          {hist.length === 0 ? (
            <p className="text-center text-sm font-semibold text-white/30 py-4">No runs yet — go fly! 🌿</p>
          ) : (
            <>
              <div className="flex h-28 items-end justify-between gap-0.5">
                {hist.map((s, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center justify-end">
                    <div
                      className="w-full rounded-sm bg-gradient-to-t from-emerald-500 to-lime-400 shadow-[0_0_4px_rgba(74,222,128,0.3)]"
                      style={{ height: `${Math.max(2, (s / maxH) * 100)}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2.5 flex justify-between text-[10px] font-semibold text-white/30">
                <span>{hist.length} runs shown</span>
                <span>avg {Math.round(hist.reduce((a, b) => a + b, 0) / hist.length)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white/[0.04] border border-white/[0.07] p-3 text-center">
        <p className="text-[10px] font-semibold text-white/25">☁️ Progress auto-saved locally.</p>
      </div>
    </ScreenShell>
  );
}

function MiniCollection({ label, owned, total }: { label: string; owned: number; total: number }) {
  const pct = total > 0 ? Math.round((owned / total) * 100) : 0;
  return (
    <div className="text-center">
      <div className="text-sm font-black text-white">{pct}%</div>
      <div className="text-[9px] font-semibold text-white/40">{label}</div>
      <div className="h-1 mt-1 rounded-full bg-black/30 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-400"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-[8px] font-medium text-white/25 tabular-nums">{owned}/{total}</div>
    </div>
  );
}

import { SaveData } from "../game/storage";
import { SKINS, levelFromXp } from "../game/data";
import { ScreenShell, Stat, ProgressBar } from "../ui";

interface Props {
  save: SaveData;
  onBack: () => void;
  onRename: (name: string) => void;
}

export default function Profile({ save, onBack, onRename }: Props) {
  const lvl = levelFromXp(save.xp);
  const skin = SKINS.find((s) => s.id === save.equippedSkin) || SKINS[0];
  const hist = save.scoreHistory.slice(-20);
  const maxH = Math.max(1, ...hist);

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
          <input
            value={save.playerName}
            maxLength={16}
            onChange={(e) => onRename(e.target.value)}
            className="w-full bg-transparent text-lg font-black text-white outline-none border-b border-transparent focus:border-white/25 transition-colors placeholder:text-white/30"
            placeholder="Your name…"
          />
          <div className="mt-1 text-xs font-black text-emerald-400">Level {lvl.level}</div>
          <div className="mt-1.5">
            <ProgressBar value={lvl.into} max={lvl.need} />
          </div>
          <div className="mt-1 text-[10px] font-semibold text-white/35 tabular-nums">
            {lvl.into} / {lvl.need} XP to next level
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat icon="🏆" label="Best Score" value={save.stats.bestScore} />
        <Stat icon="🎮" label="Games" value={save.stats.totalGames} />
        <Stat icon="🪙" label="Coins" value={save.stats.totalCoins.toLocaleString()} />
        <Stat icon="🎯" label="Near Misses" value={save.stats.totalNearMiss} />
        <Stat icon="🔥" label="Best Combo" value={`x${save.stats.bestCombo}`} />
        <Stat icon="🪽" label="Flaps" value={save.stats.totalFlaps.toLocaleString()} />
      </div>

      {/* Recent runs chart */}
      <div className="mt-5">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-white/35 mb-2.5">Recent Runs</h2>
        <div className="rounded-2xl bg-white/[0.06] border border-white/[0.08] p-4">
          {hist.length === 0 ? (
            <p className="text-center text-sm font-semibold text-white/30 py-4">No runs yet — go fly! 🌿</p>
          ) : (
            <div className="flex h-28 items-end justify-between gap-0.5">
              {hist.map((s, i) => {
                const h = Math.max(2, (s / maxH) * 100);
                return (
                  <div key={i} className="flex flex-1 flex-col items-center justify-end">
                    <div
                      className="w-full rounded-sm bg-gradient-to-t from-emerald-500 to-lime-400 shadow-[0_0_4px_rgba(74,222,128,0.3)]"
                      style={{ height: `${h}%` }}
                    />
                  </div>
                );
              })}
            </div>
          )}
          {hist.length > 0 && (
            <div className="mt-2.5 flex justify-between text-[10px] font-semibold text-white/30">
              <span>{hist.length} runs shown</span>
              <span>avg {Math.round(hist.reduce((a, b) => a + b, 0) / hist.length)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white/[0.04] border border-white/[0.07] p-3 text-center">
        <p className="text-[10px] font-semibold text-white/25">☁️ Progress auto-saved locally.</p>
      </div>
    </ScreenShell>
  );
}

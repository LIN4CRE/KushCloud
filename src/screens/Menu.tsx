import { SaveData } from "../game/storage";
import { SKINS, TRAILS, TITLES, levelFromXp } from "../game/data";
import { Button, ProgressBar, CoinPill, cx } from "../ui";
import { Screen } from "../App";
import { audio } from "../game/audio";

interface Props {
  save: SaveData;
  onPlay: () => void;
  onNav: (s: Screen) => void;
  missionsDone: number;
  missionsTotal: number;
  loginAvailable: boolean;
}

function MiniBird({ skinId, trailId }: { skinId: string; trailId: string }) {
  const skin = SKINS.find((s) => s.id === skinId) || SKINS[0];
  const trail = TRAILS.find((t) => t.id === trailId) || TRAILS[0];
  return (
    <div className="relative flex items-center justify-center">
      {trail.kind !== "none" && (
        <div className="absolute right-[52%] flex gap-1.5 items-center">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="rounded-full"
              style={{
                width: 9 - i * 1.5,
                height: 9 - i * 1.5,
                background: trail.kind === "rainbow" || trail.kind === "aurora" ? `hsl(${i * 80},90%,65%)` : trail.glow,
                opacity: 0.8 - i * 0.18,
              }}
            />
          ))}
        </div>
      )}
      <div
        className="relative flex h-24 w-24 items-center justify-center rounded-full shadow-2xl animate-[float_2.5s_ease-in-out_infinite]"
        style={{
          background: `radial-gradient(circle at 35% 30%, ${skin.body}, ${skin.accent})`,
          boxShadow: `0 0 40px ${skin.accent}55, 0 8px 32px rgba(0,0,0,0.4)`,
        }}
      >
        <span className="text-4xl drop-shadow">{skin.emoji}</span>
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-xl">🌿</div>
      </div>
    </div>
  );
}

export default function Menu({ save, onPlay, onNav, missionsDone, missionsTotal, loginAvailable }: Props) {
  const lvl = levelFromXp(save.xp);
  const title = TITLES.find((t) => t.id === save.equippedTitle);
  const badge = BADGES.find((b) => b.id === save.equippedBadge);

  return (
    <div className="flex h-full flex-col px-5 pb-5 pt-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { audio.click(); onNav("profile"); }}
          className="flex items-center gap-2 rounded-full bg-white/[0.08] border border-white/[0.1] px-3 py-1.5 hover:bg-white/[0.13] active:scale-95 transition-all"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-[11px] font-black text-white shadow-[0_0_8px_rgba(52,211,153,0.4)]">
            {lvl.level}
          </div>
          <span className="max-w-[100px] truncate text-sm font-bold text-white/90">{save.playerName}</span>
        </button>
        <div className="flex items-center gap-2">
          {save.dust > 0 && (
            <span className="text-xs font-bold text-violet-300 tabular-nums">💎{save.dust}</span>
          )}
          <CoinPill coins={save.coins} />
        </div>
      </div>

      {/* Title */}
      <div className="mt-5 text-center">
        {title && (
          <div className="text-[10px] font-semibold text-white/40 mb-1">{title.name}</div>
        )}
        <h1 className="text-5xl font-black tracking-tight text-white leading-none">
          KUSH<span className="text-lime-300 drop-shadow-[0_0_12px_rgba(163,230,53,0.5)]">CLOUD</span>
        </h1>
        <p className="mt-1.5 text-xs font-semibold text-white/40 tracking-wide">Flap higher. Stay chill. ✌️</p>
      </div>

      {/* Character + stats */}
      <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-4">
        <MiniBird skinId={save.equippedSkin} trailId={save.equippedTrail} />

        {/* XP bar */}
        <div className="w-full max-w-[260px]">
          <div className="mb-1.5 flex justify-between text-[11px] font-semibold text-white/45">
            <span>Level {lvl.level}</span>
            <span>{lvl.into} / {lvl.need} XP</span>
          </div>
          <ProgressBar value={lvl.into} max={lvl.need} />
        </div>

        {/* Best score / games / total score */}
        <div className="flex items-center gap-4 rounded-2xl bg-white/[0.06] border border-white/[0.08] px-6 py-3">
          <div className="text-center flex-1">
            <div className="text-2xl font-black text-amber-300 leading-none tabular-nums">{save.stats.bestScore}</div>
            <div className="mt-0.5 text-[10px] uppercase font-semibold tracking-wider text-white/40">Best</div>
          </div>
          <div className="h-8 w-px bg-white/[0.12]" />
          <div className="text-center flex-1">
            <div className="text-2xl font-black text-white leading-none tabular-nums">{save.stats.totalGames}</div>
            <div className="mt-0.5 text-[10px] uppercase font-semibold tracking-wider text-white/40">Games</div>
          </div>
          <div className="h-8 w-px bg-white/[0.12]" />
          <div className="text-center flex-1">
            <div className="text-xl font-black text-sky-300 leading-none tabular-nums">{save.stats.totalScore.toLocaleString()}</div>
            <div className="mt-0.5 text-[10px] uppercase font-semibold tracking-wider text-white/40">Total</div>
          </div>
        </div>
      </div>

      {/* Play button */}
      <Button size="lg" className="w-full text-xl py-4 font-black tracking-widest shadow-[0_6px_0_#065f46,0_2px_12px_rgba(0,0,0,0.5)]" onClick={onPlay}>
        ▶ PLAY
      </Button>

      {/* Nav grid */}
      <div className="mt-3 grid grid-cols-4 gap-2">
        <NavBtn icon="🛍️" label="Shop" onClick={() => onNav("shop")} />
        <NavBtn
          icon="📋"
          label="Daily"
          onClick={() => onNav("missions")}
          badge={loginAvailable ? "!" : missionsDone < missionsTotal ? String(missionsTotal - missionsDone) : undefined}
        />
        <NavBtn icon="🏆" label="Ranks" onClick={() => onNav("leaderboard")} />
        <NavBtn icon="🏅" label="Awards" onClick={() => onNav("achievements")} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <NavBtn icon="📊" label="Stats" onClick={() => onNav("statistics")} wide />
        <NavBtn icon="⚙️" label="Settings" onClick={() => onNav("settings")} wide />
        <NavBtn icon="❓" label="How to Play" onClick={() => onNav("tutorial")} wide />
      </div>
    </div>
  );
}

function NavBtn({
  icon, label, onClick, badge, wide,
}: {
  icon: string; label: string; onClick: () => void; badge?: string; wide?: boolean;
}) {
  return (
    <button
      onClick={() => { audio.click(); onClick(); }}
      className={cx(
        "relative flex items-center justify-center gap-1.5 rounded-2xl bg-white/[0.07] border border-white/[0.09] py-2.5 text-white hover:bg-white/[0.12] active:scale-95 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
        wide ? "flex-row px-4 py-2.5" : "flex-col",
      )}
    >
      <span className="text-xl leading-none">{icon}</span>
      <span className="text-[11px] font-semibold text-white/70">{label}</span>
      {badge && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-[0_2px_6px_rgba(239,68,68,0.5)]">
          {badge}
        </span>
      )}
    </button>
  );
}

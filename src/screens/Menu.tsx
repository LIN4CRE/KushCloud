import { type SaveData } from "../game/storage";
import { Button, CoinPill, Panel, ProgressBar, Stat } from "../ui";
import { WORLDS, worldForScore } from "../game/data";
import { getDailyRewardStatus } from "../game/rewards";
import { KushLogo } from "../components/KushLogo";

interface Props {
  save: SaveData;
  onPlay: () => void;
  onNav: (s: "shop" | "leaderboard" | "settings") => void;
  onClaimDaily: () => void;
}

export default function Menu({ save, onPlay, onNav, onClaimDaily }: Props) {
  const { stats, coins, playerName } = save;
  const world = worldForScore(stats.bestScore);
  const worldIndex = WORLDS.findIndex((w) => w.id === world.id);
  const nextWorld = WORLDS[worldIndex + 1];
  const worldProgress = nextWorld
    ? Math.max(0, stats.bestScore - world.minScore)
    : 1;
  const worldProgressMax = nextWorld
    ? Math.max(1, nextWorld.minScore - world.minScore)
    : 1;
  const daily = getDailyRewardStatus(save);
  const averageScore = stats.totalGames > 0 ? Math.round(stats.totalScore / stats.totalGames) : 0;

  return (
    <div className="flex h-full flex-col items-center overflow-y-auto px-6 py-8">
      <KushLogo className="mb-5 shrink-0" />

      <div className="mb-5 flex items-center gap-2">
        <span className="max-w-[180px] truncate text-lg font-bold text-white">{playerName}</span>
        <CoinPill amount={coins} />
      </div>

      <div className="mb-5 grid w-full max-w-sm grid-cols-4 gap-2">
        <Stat label="Best" value={stats.bestScore} />
        <Stat label="Avg" value={averageScore} />
        <Stat label="Games" value={stats.totalGames} />
        <Stat label="World" value={world.name} />
      </div>

      <Panel className="mb-4 w-full max-w-sm border-emerald-400/20 bg-emerald-950/30">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">Daily Cloud Drop</p>
            <p className="text-sm text-slate-300">
              Streak {daily.streak} · +{daily.reward} coins
            </p>
          </div>
          <Button
            onClick={onClaimDaily}
            disabled={daily.claimedToday}
            className="px-3 py-2 text-xs"
          >
            {daily.claimedToday ? "Claimed" : "Claim"}
          </Button>
        </div>
        <p className="text-xs text-slate-400">Come back daily to grow the reward cap and keep momentum.</p>
      </Panel>

      <Panel className="mb-6 w-full max-w-sm">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-bold text-white">{world.name}</span>
          {nextWorld ? (
            <span className="text-slate-400">Next: {nextWorld.name} @ {nextWorld.minScore}</span>
          ) : (
            <span className="text-amber-300">Final world reached</span>
          )}
        </div>
        <ProgressBar value={worldProgress} max={worldProgressMax} />
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-slate-300">
          <div className="rounded-xl bg-white/5 px-2 py-2">
            <div className="font-bold text-emerald-300">{stats.totalPerfectPasses}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Perfect</div>
          </div>
          <div className="rounded-xl bg-white/5 px-2 py-2">
            <div className="font-bold text-amber-300">×{stats.bestCombo}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Best Combo</div>
          </div>
          <div className="rounded-xl bg-white/5 px-2 py-2">
            <div className="font-bold text-sky-300">{stats.totalNearMiss}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Near Miss</div>
          </div>
        </div>
      </Panel>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <Button onClick={onPlay} className="w-full py-4 text-lg shadow-emerald-500/30">
          ▶ PLAY
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => onNav("shop")} className="flex-1">
            Shop
          </Button>
          <Button variant="secondary" onClick={() => onNav("leaderboard")} className="flex-1">
            Scores
          </Button>
          <Button variant="ghost" onClick={() => onNav("settings")} className="flex-1">
            Settings
          </Button>
        </div>
      </div>

      <div className="mt-5 text-center">
        <p className="text-xs text-slate-500">v{import.meta.env.VITE_APP_VERSION || "4.3.0"}</p>
      </div>
    </div>
  );
}

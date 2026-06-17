import { type SaveData } from "../game/storage";
import { Button, CoinPill, ScreenShell, Stat } from "../ui";
import { worldForScore } from "../game/data";
import { KushLogo } from "../components/KushLogo";

interface Props {
  save: SaveData;
  onPlay: () => void;
  onNav: (s: "shop" | "leaderboard" | "settings") => void;
}

export default function Menu({ save, onPlay, onNav }: Props) {
  const { stats, coins, playerName } = save;
  const world = worldForScore(stats.bestScore);

  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <KushLogo className="mb-6" />

      <div className="mb-6 flex items-center gap-2">
        <span className="text-lg font-bold text-white">{playerName}</span>
        <CoinPill amount={coins} />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3">
        <Stat label="Best" value={stats.bestScore} />
        <Stat label="Games" value={stats.totalGames} />
        <Stat label="Total Score" value={stats.totalScore} />
        <Stat label="World" value={world.name} />
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button onClick={onPlay} className="w-full text-lg py-4">
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

      <div className="mt-8 text-center">
        <p className="text-xs text-slate-500">v{import.meta.env.VITE_APP_VERSION || "4.0.0"}</p>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { type SaveData } from "../game/storage";
import { type RunResult } from "../game/runProcessing";
import { type RunSummary } from "../game/runProcessing";
import { GameCanvas, type GameCanvasHandle } from "../components/GameCanvas";
import { Button, Panel, Stat, CoinPill } from "../ui";
import { SKINS, TRAILS } from "../game/data";
import { dayNumber } from "../game/storage";

interface Props {
  save: SaveData;
  onExit: () => void;
  processRun: (run: RunResult) => Promise<RunSummary>;
  reviveRun: (cost: number) => boolean;
}

export default function Play({ save, onExit, processRun, reviveRun }: Props) {
  const [state, setState] = useState<"ready" | "playing" | "gameover">("ready");
  const canvasRef = useRef<GameCanvasHandle>(null);
  const lastRunRef = useRef<RunResult | null>(null);
  const [lastSummary, setLastSummary] = useState<RunSummary | null>(null);
  const [reviveCost] = useState(200);

  const skin = SKINS.find((s) => s.id === save.equippedSkin) || SKINS[0];
  const trail = TRAILS.find((t) => t.id === save.equippedTrail) || TRAILS[0];

  const onGameOver = useCallback(async (run: RunResult) => {
    lastRunRef.current = run;
    const summary = await processRun(run);
    setLastSummary(summary);
    setState("gameover");
  }, [processRun]);

  const handleRevive = () => {
    if (reviveRun(reviveCost)) {
      canvasRef.current?.revive();
      setState("playing");
      setLastSummary(null);
    }
  };

  const handleRestart = () => {
    canvasRef.current?.restart();
    setLastSummary(null);
    setState("ready");
  };

  useEffect(() => {
    if (state === "ready") {
      const timer = setTimeout(() => {
        canvasRef.current?.start();
        setState("playing");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-white/5 px-4 py-2">
        <button onClick={onExit} className="flex size-8 items-center justify-center rounded-lg bg-white/5 text-sm hover:bg-white/10 active:scale-90">
          ✕
        </button>
        <div className="flex-1" />
        <CoinPill amount={save.coins} />
      </header>

      <div className="relative flex-1">
        <GameCanvas
          ref={canvasRef}
          skin={skin}
          trail={trail}
          onGameOver={onGameOver}
        />

        {state === "gameover" && lastRunRef.current && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm px-6">
            <Panel className="w-full max-w-xs text-center mb-4">
              <h2 className="mb-3 text-2xl font-bold text-white">Game Over</h2>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Stat label="Score" value={lastRunRef.current.score} />
                <Stat label="Coins" value={Math.round(lastRunRef.current.coins * 10) + Math.round(lastRunRef.current.score * 2)} />
                <Stat label="Best Combo" value={lastRunRef.current.bestCombo} />
                <Stat label="Flaps" value={lastRunRef.current.flaps} />
              </div>
              {lastSummary && lastSummary.newBest && (
                <div className="mb-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-3 py-2 text-sm font-bold text-amber-300">
                  ✨ New Best Score! ✨
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={handleRevive} disabled={save.coins < reviveCost} className="flex-1">
                  Revive ({reviveCost}🪙)
                </Button>
                <Button variant="secondary" onClick={handleRestart} className="flex-1">
                  Retry
                </Button>
                <Button variant="ghost" onClick={onExit} className="flex-1">
                  Menu
                </Button>
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}

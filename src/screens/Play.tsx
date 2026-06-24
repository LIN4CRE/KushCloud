import { useCallback, useEffect, useRef, useState } from "react";
import { type SaveData } from "../game/storage";
import { type RunResult } from "../game/engine";
import { type RunSummary } from "../game/runProcessing";
import { GameCanvas, type GameCanvasHandle, type GameHudUpdate } from "../components/GameCanvas";
import { Button, Panel, Stat, CoinPill } from "../ui";
import { SKINS, TRAILS, POWERUPS } from "../game/data";

interface Props {
  save: SaveData;
  onExit: () => void;
  processRun: (run: RunResult) => Promise<RunSummary>;
  reviveRun: (cost: number) => boolean;
}

type PlayState = "ready" | "playing" | "paused" | "gameover";

const MAX_REVIVES = 1;

const initialHud = {
  score: 0,
  runCoins: 0,
  nearMiss: 0,
  perfectPasses: 0,
  combo: 1,
  worldName: "Meadow",
  frenzyActive: false,
  frenzyRemainingMs: 0,
  lastPowerUp: "",
  clutch: 0,
  redEye: 0,
};

export default function Play({ save, onExit, processRun, reviveRun }: Props) {
  const [state, setState] = useState<PlayState>("ready");
  const canvasRef = useRef<GameCanvasHandle>(null);
  const lastRunRef = useRef<RunResult | null>(null);
  const pendingRunRef = useRef<RunResult | null>(null);
  const [lastSummary, setLastSummary] = useState<RunSummary | null>(null);
  const [revivesUsed, setRevivesUsed] = useState(0);
  const [hud, setHud] = useState(initialHud);

  const reviveCost = 200 + revivesUsed * 200;
  const skin = SKINS.find((s) => s.id === save.equippedSkin) || SKINS[0];
  const trail = TRAILS.find((t) => t.id === save.equippedTrail) || TRAILS[0];
  const equippedPowerUps = (save.equippedPowerUps || []).slice(0, 2);
  const equippedDefs = equippedPowerUps
    .map((id) => POWERUPS.find((p) => p.id === id))
    .filter(Boolean);

  const handleHud = useCallback((patch: GameHudUpdate) => {
    setHud((prev) => ({
      ...prev,
      ...patch,
      lastPowerUp: Object.prototype.hasOwnProperty.call(patch, "lastPowerUp")
        ? patch.lastPowerUp ?? ""
        : prev.lastPowerUp,
    }));
  }, []);

  const settlePendingRun = useCallback(async () => {
    const pending = pendingRunRef.current;
    if (!pending) return lastSummary;
    pendingRunRef.current = null;
    const summary = await processRun(pending);
    setLastSummary(summary);
    return summary;
  }, [lastSummary, processRun]);

  const onGameOver = useCallback((run: RunResult) => {
    lastRunRef.current = run;
    pendingRunRef.current = run;
    setLastSummary(null);
    setState("gameover");
  }, []);

  const handleRevive = () => {
    if (revivesUsed >= MAX_REVIVES) return;
    if (reviveRun(reviveCost)) {
      // The revived segment continues the same visible run; only the final death
      // is banked, preventing duplicate rewards from revive attempts.
      pendingRunRef.current = null;
      canvasRef.current?.revive();
      setRevivesUsed((v) => v + 1);
      setLastSummary(null);
      setState("playing");
    }
  };

  const handleRestart = useCallback(async () => {
    await settlePendingRun();
    canvasRef.current?.restart();
    lastRunRef.current = null;
    setLastSummary(null);
    setRevivesUsed(0);
    setHud(initialHud);
    setState("ready");
  }, [settlePendingRun]);

  const handleExit = useCallback(async () => {
    await settlePendingRun();
    onExit();
  }, [onExit, settlePendingRun]);

  const handlePause = useCallback(() => {
    if (state !== "playing") return;
    canvasRef.current?.pause();
    setState("paused");
  }, [state]);

  const handleResume = useCallback(() => {
    if (state !== "paused") return;
    canvasRef.current?.resume();
    setState("playing");
  }, [state]);

  useEffect(() => {
    if (state === "ready") {
      const timer = setTimeout(() => {
        canvasRef.current?.start();
        setState("playing");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Escape" && e.code !== "KeyP") return;
      e.preventDefault();
      if (state === "playing") handlePause();
      else if (state === "paused") handleResume();
      else if (state === "gameover") void handleExit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleExit, handlePause, handleResume, state]);

  const run = lastRunRef.current;
  const projectedNewBest = !!run && run.score > save.stats.bestScore;
  const estimatedCoins = run ? Math.round(run.coins * 10) + Math.round(run.score * 2) : 0;
  const coinsLabel = lastSummary?.coinsGained ?? estimatedCoins;
  const canRevive = revivesUsed < MAX_REVIVES && save.coins >= reviveCost;

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-2 border-b border-white/5 px-4 py-2">
        <button onClick={() => { void handleExit(); }} className="flex size-8 items-center justify-center rounded-lg bg-white/5 text-sm hover:bg-white/10 active:scale-90">
          ✕
        </button>
        <button
          onClick={state === "paused" ? handleResume : handlePause}
          disabled={state !== "playing" && state !== "paused"}
          className="flex size-8 items-center justify-center rounded-lg bg-white/5 text-sm text-slate-200 hover:bg-white/10 active:scale-90 disabled:opacity-40"
          title="Pause (P/Esc)"
        >
          {state === "paused" ? "▶" : "Ⅱ"}
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
          {equippedDefs.length > 0 ? equippedDefs.map((powerUp) => powerUp && (
            <span key={powerUp.id} className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-200" title={powerUp.name}>
              {powerUp.icon}
            </span>
          )) : (
            <span className="truncate text-[11px] text-slate-500">No loadout</span>
          )}
        </div>
        <CoinPill amount={save.coins} />
      </header>

      <div className="relative flex-1">
        <GameCanvas
          ref={canvasRef}
          skin={skin}
          trail={trail}
          starterPowerUps={equippedPowerUps}
          onGameOver={onGameOver}
          onHud={handleHud}
          reducedMotion={save.reducedMotion}
          highContrast={save.highContrast}
        />

        {state !== "gameover" && (
          <div className="pointer-events-none absolute left-3 top-3 space-y-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span>🪙 {hud.runCoins}</span>
                <span className={hud.combo >= 3 ? "text-amber-300" : "text-emerald-300"}>×{hud.combo}</span>
                <span className="text-slate-300">{hud.worldName}</span>
              </div>
            </div>
            {(hud.nearMiss > 0 || hud.perfectPasses > 0 || hud.clutch > 0 || hud.redEye > 0) && (
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 px-3 py-1.5 text-[11px] font-semibold text-slate-200 backdrop-blur-sm">
                ✨ {hud.perfectPasses} &nbsp; ⚡ {hud.clutch} &nbsp; 👁 {hud.redEye} &nbsp; 😮 {hud.nearMiss}
              </div>
            )}
          </div>
        )}

        {hud.frenzyActive && state === "playing" && (
          <div className="pointer-events-none absolute inset-x-0 top-20 mx-auto w-fit rounded-full border border-amber-300/40 bg-amber-500/20 px-4 py-2 text-sm font-black uppercase tracking-wider text-amber-200 shadow-xl shadow-amber-900/30 backdrop-blur-sm combo-flame">
            🔥 Frenzy ×2
          </div>
        )}

        {hud.lastPowerUp && state === "playing" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-6 mx-auto w-fit rounded-full border border-emerald-300/30 bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-100 backdrop-blur-sm">
            {hud.lastPowerUp}
          </div>
        )}

        {state === "paused" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 px-6 backdrop-blur-sm">
            <Panel className="w-full max-w-xs text-center">
              <h2 className="mb-2 text-2xl font-bold text-white">Paused</h2>
              <p className="mb-4 text-sm text-slate-300">Press P/Esc or tap resume when you’re ready.</p>
              <div className="flex gap-2">
                <Button onClick={handleResume} className="flex-1">Resume</Button>
                <Button variant="ghost" onClick={() => { void handleExit(); }} className="flex-1">Menu</Button>
              </div>
            </Panel>
          </div>
        )}

        {state === "gameover" && run && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 px-6 backdrop-blur-sm">
            <Panel className="mb-4 w-full max-w-xs text-center">
              <h2 className="mb-3 text-2xl font-bold text-white">Game Over</h2>
              <div className="mb-4 grid grid-cols-2 gap-2">
                <Stat label="Score" value={run.score} />
                <Stat label="Coins" value={coinsLabel} />
                <Stat label="Best Combo" value={run.bestCombo} />
                <Stat label="Flaps" value={run.flaps} />
                <Stat label="Perfect" value={run.perfectPasses} />
                <Stat label="Red Eye" value={run.redEye ?? 0} />
                <Stat label="Clutch" value={run.clutch ?? 0} />
              </div>
              {(lastSummary?.newBest || projectedNewBest) && (
                <div className="mb-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-3 py-2 text-sm font-bold text-amber-300">
                  ✨ New Best Score! ✨
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={handleRevive} disabled={!canRevive} className="flex-1">
                  {revivesUsed >= MAX_REVIVES ? "Revive Used" : `Revive (${reviveCost}🪙)`}
                </Button>
                <Button variant="secondary" onClick={() => { void handleRestart(); }} className="flex-1">
                  Retry
                </Button>
                <Button variant="ghost" onClick={() => { void handleExit(); }} className="flex-1">
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

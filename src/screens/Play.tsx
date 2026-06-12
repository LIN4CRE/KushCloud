import { useEffect, useRef, useState } from "react";
import GameCanvas from "../game/GameCanvas";
import { RunResult } from "../game/engine";
import { SaveData } from "../game/storage";
import type { RunSummary } from "../game/runProcessing";
import { SKINS, TRAILS, World, worldForScore, levelFromXp } from "../game/data";
import { Button, CoinPill, cx } from "../ui";
import { audio } from "../game/audio";

function createRunId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

interface Props {
  save: SaveData;
  onExit: () => void;
  processRun: (r: RunResult) => Promise<RunSummary>;
}

export default function Play({ save, onExit, processRun }: Props) {
  const skin = SKINS.find((s) => s.id === save.equippedSkin) || SKINS[0];
  const trail = TRAILS.find((t) => t.id === save.equippedTrail) || TRAILS[0];

  const [runId, setRunId] = useState(() => createRunId());
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [perfects, setPerfects] = useState(0);
  const [combo, setCombo] = useState(1);
  const [world, setWorld] = useState<World>(worldForScore(0));
  const [phase, setPhase] = useState<"ready" | "playing" | "dead">("ready");
  const [paused, setPaused] = useState(false);
  const [practice, setPractice] = useState(false);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [comboPulse, setComboPulse] = useState(0);
  const deadTimer = useRef<number>(0);
  const activeRunIdRef = useRef(runId);
  const processedRunIdsRef = useRef(new Set<string>());
  const gameOverRef = useRef<HTMLDivElement>(null);
  const isDead = phase === "dead" || !!summary;
  const prevBestRef = useRef(save.stats.bestScore);

  useEffect(() => {
    activeRunIdRef.current = runId;
  }, [runId]);

  // Focus trap for Game Over modal
  useEffect(() => {
    if (summary && !practice && gameOverRef.current) {
      gameOverRef.current.focus();
    }
  }, [summary, practice]);

  useEffect(() => {
    audio.resume();
    prevBestRef.current = save.stats.bestScore;
    return () => window.clearTimeout(deadTimer.current);
  }, [save.stats.bestScore]);

  const handleDeath = (r: RunResult) => {
    if (processedRunIdsRef.current.has(r.runId)) return;
    processedRunIdsRef.current.add(r.runId);

    // Start processing immediately so the score is saved even if the user restarts or leaves
    const summaryPromise = processRun(r);
    const deathRunId = r.runId;

    window.clearTimeout(deadTimer.current);
    deadTimer.current = window.setTimeout(async () => {
      try {
        const s = await summaryPromise;
        if (activeRunIdRef.current !== deathRunId) return;
        setSummary(s);
        if (s.leveledUp.length) setTimeout(() => audio.levelUp(), 250);
      } catch (error) {
        console.error("Failed to process run:", error);
      }
    }, 850);
  };

  const restart = () => {
    const nextRunId = createRunId();
    activeRunIdRef.current = nextRunId;
    window.clearTimeout(deadTimer.current);
    prevBestRef.current = save.stats.bestScore;
    setSummary(null);
    setScore(0);
    setCoins(0);
    setPerfects(0);
    setCombo(1);
    setPhase("ready");
    setPaused(false);
    setWorld(worldForScore(0));
    setRunId(nextRunId);
  };

  const exitToMenu = () => {
    activeRunIdRef.current = "";
    window.clearTimeout(deadTimer.current);
    onExit();
  };

  const lvl = levelFromXp(save.xp);

  return (
    <div className="relative h-full w-full overflow-hidden animate-screen-enter">
      <GameCanvas
        skin={skin}
        trail={trail}
        reducedMotion={save.reducedMotion}
        highContrast={save.highContrast}
        practiceMode={practice}
        paused={paused || !!summary}
        runId={runId}
        onScore={setScore}
        onCoin={setCoins}
        onPerfectPass={setPerfects}
        onCombo={(m) => {
          setCombo(m);
          setComboPulse((p) => p + 1);
        }}
        onWorld={setWorld}
        onStateChange={(s) => setPhase(s)}
        onDeath={handleDeath}
      />

      {/* Top HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3 gap-2">
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              audio.click();
              if (!isDead) setPaused(true);
            }}
            disabled={isDead}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-xl bg-black/40 text-white text-lg border border-white/15 backdrop-blur-sm active:scale-95 transition-all disabled:opacity-30"
            aria-label="Pause"
          >
            ⏸
          </button>
          <button
            onClick={() => {
              audio.click();
              if (phase === "ready") setPractice((p) => !p);
            }}
            disabled={phase !== "ready"}
            className={cx(
              "pointer-events-auto flex h-10 items-center justify-center rounded-xl border px-2.5 text-xs font-bold backdrop-blur-sm active:scale-95 transition-all disabled:opacity-30",
              practice
                ? "bg-lime-500/20 border-lime-400/30 text-lime-300"
                : "bg-black/40 text-white/70 border-white/15",
            )}
            aria-label="Practice mode"
          >
            ✨ {practice ? "Practice" : "Learn"}
          </button>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="pointer-events-auto">
            <CoinPill coins={save.coins + coins} />
          </div>
          <div className="rounded-lg bg-black/35 px-2.5 py-1 text-[11px] font-semibold text-white/80 border border-white/10 backdrop-blur-sm">
            {world.name}
          </div>
        </div>
      </div>

      {/* Live coins & combo this run */}
      {phase !== "ready" && (
        <div className="pointer-events-none absolute left-1/2 top-[104px] -translate-x-1/2 flex items-center gap-3">
          {coins > 0 && (
            <div className="text-sm font-bold text-amber-200/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              🍁 {coins}
            </div>
          )}
          {perfects > 0 && (
            <div className="text-sm font-bold text-sky-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              ✨ {perfects}
            </div>
          )}
          {combo > 1 && (
            <div
              key={comboPulse}
              className="animate-[pop_0.4s_ease-out] text-lg font-black text-lime-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            >
              🔥 x{combo}
            </div>
          )}
        </div>
      )}

      {/* Ready overlay */}
      {phase === "ready" && !summary && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
          <div className="animate-bounce text-5xl">👆</div>
          <div className="rounded-2xl bg-black/50 px-6 py-3 border border-white/10 backdrop-blur-sm">
            <p className="text-base font-black text-white">Tap, click or press Space!</p>
            <p className="mt-1 text-xs font-medium text-white/60">
              {practice
                ? "Free flight — no pipes, no scoring. Just vibe! 🌿"
                : "Fly through the jars. Grab leaves. Don't crash."}
            </p>
          </div>
        </div>
      )}

      {/* Pause overlay */}
      {paused && !summary && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/65 backdrop-blur-md">
          <div className="text-center mb-2">
            <h2 className="text-3xl font-black text-white">Paused</h2>
            <p className="mt-1 text-sm font-semibold text-white/50">
              Score: <span className="text-white font-black">{score}</span>
              <span className="mx-2 text-white/20">·</span>
              🍁 <span className="text-amber-200 font-black">{coins}</span>
            </p>
          </div>
          <div className="flex flex-col gap-2.5 w-52">
            <Button size="lg" onClick={() => setPaused(false)}>▶ Resume</Button>
            <Button variant="dark" onClick={restart}>↻ Restart</Button>
            <Button variant="dark" onClick={exitToMenu}>⌂ Main Menu</Button>
          </div>
        </div>
      )}

      {/* Practice mode exit */}
      {practice && summary && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900/95 border border-white/10 p-6 text-center animate-[pop_0.35s_ease-out]">
            <div className="text-5xl mb-3">🌿</div>
            <h2 className="text-xl font-black text-white mb-2">Practice Complete</h2>
            <p className="text-sm text-white/60 mb-5">No score counted — just warming up!</p>
            <div className="flex flex-col gap-2">
              <Button size="lg" className="w-full" onClick={restart}>↻ Practice Again</Button>
              <Button variant="dark" className="w-full" onClick={() => { setPractice(false); restart(); }}>▶ Play for Real</Button>
              <Button variant="dark" className="w-full" onClick={exitToMenu}>⌂ Main Menu</Button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over modal */}
      {summary && !practice && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div
            ref={gameOverRef}
            role="dialog"
            aria-modal="true"
            aria-label={summary.newBest ? "New best score" : "Game over"}
            tabIndex={-1}
            className="w-full max-w-sm rounded-3xl bg-slate-900/95 border border-white/10 p-5 shadow-[0_24px_64px_rgba(0,0,0,0.7)] animate-[pop_0.35s_ease-out] outline-none"
          >
            {/* Header */}
            <div className="text-center mb-4">
              <h2 className="text-2xl font-black text-white">
                {summary.newBest ? "🏆 New Best!" : "Game Over"}
              </h2>
              {!summary.valid && (
                <p className="mt-1 text-xs font-semibold text-rose-400">
                  ⚠ Run not counted (validation failed)
                </p>
              )}
            </div>

            {/* Score row */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl bg-white/[0.07] border border-white/[0.08] p-3 text-center">
                <div className="text-3xl font-black text-white tabular-nums leading-none">{score}</div>
                <div className="mt-1 text-[10px] uppercase font-semibold tracking-wider text-white/40">Score</div>
                {score > 0 && prevBestRef.current > 0 && (
                  <div className="mt-1 text-[9px] font-semibold text-white/30">
                    {score > prevBestRef.current ? "+" : ""}{score - prevBestRef.current} vs best
                  </div>
                )}
              </div>
              <div className="rounded-2xl bg-amber-400/10 border border-amber-300/20 p-3 text-center">
                <div className="text-3xl font-black text-amber-300 tabular-nums leading-none">
                  {save.stats.bestScore}
                </div>
                <div className="mt-1 text-[10px] uppercase font-semibold tracking-wider text-white/40">Best</div>
              </div>
            </div>

            {/* Rewards row */}
            <div className="mt-2.5 flex items-center justify-around rounded-2xl bg-white/[0.05] border border-white/[0.07] py-3">
              <div className="text-center">
                <div className="font-black text-amber-300 tabular-nums">+{summary.coinsGained}</div>
                <div className="text-[10px] text-white/40 font-semibold mt-0.5">🪙 Coins</div>
              </div>
              {perfects > 0 && (
                <>
                  <div className="w-px h-6 bg-white/10" />
                  <div className="text-center">
                    <div className="font-black text-sky-400 tabular-nums">{perfects}</div>
                    <div className="text-[10px] text-white/40 font-semibold mt-0.5">Perfects</div>
                  </div>
                </>
              )}
              <div className="w-px h-6 bg-white/10" />
              <div className="text-center">
                <div className="font-black text-sky-300 tabular-nums">+{summary.xpGained}</div>
                <div className="text-[10px] text-white/40 font-semibold mt-0.5">XP</div>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="text-center">
                <div className="font-black text-lime-300">#{summary.rank}</div>
                <div className="text-[10px] text-white/40 font-semibold mt-0.5">Daily Rank</div>
              </div>
            </div>

            {/* Level up */}
            {summary.leveledUp.length > 0 && (
              <div className="mt-2.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-lime-500/20 border border-lime-400/25 p-3 text-center">
                <p className="font-black text-lime-300 text-sm">⬆ Level Up! Now Level {Math.max(...summary.leveledUp)}</p>
                {summary.levelUpCoins > 0 && (
                  <p className="text-[10px] font-semibold text-lime-200/70 mt-0.5">+{summary.levelUpCoins} bonus coins!</p>
                )}
              </div>
            )}

            {/* Achievements */}
            {summary.achievements.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {summary.achievements.map((a) => (
                  <div key={a} className="rounded-xl bg-amber-400/10 border border-amber-300/20 px-3 py-2 text-sm font-semibold text-amber-100">
                    🏅 Achievement: {a}
                  </div>
                ))}
              </div>
            )}

            {/* Missions */}
            {summary.missions.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {summary.missions.map((m) => (
                  <div key={m} className="rounded-xl bg-sky-500/10 border border-sky-300/20 px-3 py-2 text-sm font-semibold text-sky-100">
                    ✅ Mission: {m}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex flex-col gap-2">
              <Button size="lg" className="w-full" onClick={restart}>↻ One More Try</Button>
              <Button variant="dark" className="w-full" onClick={exitToMenu}>⌂ Main Menu</Button>
            </div>

            <p className="mt-3 text-center text-[10px] font-semibold text-white/25">
              Level {lvl.level} · {save.coins.toLocaleString()} coins banked
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

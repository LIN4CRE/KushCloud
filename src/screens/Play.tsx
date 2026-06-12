import { useEffect, useRef, useState } from "react";
import GameCanvas from "../components/GameCanvas";
import { RunResult } from "../game/engine";
import { SaveData } from "../game/storage";
import type { RunSummary } from "../game/runProcessing";
import { SKINS, TRAILS, World, worldForScore, levelFromXp } from "../game/data";
import { Button, CoinPill, cx } from "../ui";
import { audio } from "../game/audio";
import { env } from "../config/env";

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
  /** Deducts the revive cost from banked coins; returns false if unaffordable. */
  reviveRun: (cost: number) => boolean;
}

export default function Play({ save, onExit, processRun, reviveRun }: Props) {
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
  const [frenzy, setFrenzy] = useState<{ active: boolean; ms: number }>({ active: false, ms: 0 });
  const [clutchCount, setClutchCount] = useState(0);
  const [puToast, setPuToast] = useState<{ name: string; key: number } | null>(null);
  const puToastTimer = useRef<number>(0);
  const deadTimer = useRef<number>(0);
  const activeRunIdRef = useRef(runId);
  const processedRunIdsRef = useRef(new Set<string>());
  const gameOverRef = useRef<HTMLDivElement>(null);
  const isDead = phase === "dead" || !!summary;
  const prevBestRef = useRef(save.stats.bestScore);
  const [isNewBest, setIsNewBest] = useState(false);
  const [revived, setRevived] = useState(false);
  const [reviveSignal, setReviveSignal] = useState(0);
  const [reviveRunId, setReviveRunId] = useState("");
  // Revive costs more each time within a run; once-per-run keeps it from trivializing scores.
  const reviveCost = Math.max(50, Math.floor(save.stats.bestScore * 2));

  // Auto-pause when tab loses focus
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && phase === "playing" && !paused && !summary) {
        setPaused(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [phase, paused, summary]);

  // Track new best during gameplay
  useEffect(() => {
    if (phase === "playing" && score > 0 && score > save.stats.bestScore && score > prevBestRef.current) {
      setIsNewBest(true);
    }
  }, [score, phase, save.stats.bestScore]);

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
        // Always show Game Over so the player can restart
        if (activeRunIdRef.current === deathRunId) {
          setSummary({
            xpGained: 0,
            coinsGained: 0,
            levelUpCoins: 0,
            newBest: false,
            leveledUp: [],
            achievements: [],
            missions: [],
            badges: [],
            valid: false,
            rank: 1,
            status: "invalid",
          });
        }
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
    setIsNewBest(false);
    setRevived(false);
    setFrenzy({ active: false, ms: 0 });
    setClutchCount(0);
    setPuToast(null);
    window.clearTimeout(puToastTimer.current);
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
        bestScoreBefore={save.stats.bestScore}
        reviveSignal={reviveSignal}
        reviveRunId={reviveRunId}
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
        onFrenzy={(active, ms) => setFrenzy({ active, ms })}
        onClutch={(c) => setClutchCount(c)}
        onPowerUp={(_id, name) => {
          setPuToast({ name, key: Date.now() });
          window.clearTimeout(puToastTimer.current);
          puToastTimer.current = window.setTimeout(() => setPuToast(null), 1800);
        }}
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
              className={`animate-[pop_0.4s_ease-out] text-lg font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${combo >= 5 ? "combo-flame text-amber-300" : combo >= 3 ? "text-amber-300" : "text-lime-300"}`}
            >
              {combo >= 5 ? "🔥" : combo >= 3 ? "💥" : "🔥"} x{combo}
            </div>
          )}
        </div>
      )}

      {/* FRENZY banner with countdown */}
      {frenzy.active && phase === "playing" && (
        <div className="pointer-events-none absolute left-1/2 top-[132px] -translate-x-1/2 flex flex-col items-center gap-1 animate-[pop_0.4s_ease-out]">
          <div className="combo-flame rounded-full bg-gradient-to-r from-rose-500/30 to-amber-400/30 border border-amber-300/50 px-4 py-1 text-sm font-black text-amber-200 shadow-[0_0_24px_rgba(251,191,36,0.5)]">
            🔥 FRENZY · 2× POINTS
          </div>
          <div className="h-1 w-28 overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500 transition-[width] duration-200 ease-linear"
              style={{ width: `${Math.max(0, Math.min(100, (frenzy.ms / 6000) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* Power-up pickup toast */}
      {puToast && phase === "playing" && (
        <div
          key={puToast.key}
          className="pointer-events-none absolute left-1/2 top-[176px] -translate-x-1/2 animate-[pop_0.4s_ease-out]"
        >
          <div className="rounded-full bg-violet-500/25 border border-violet-300/40 px-3 py-1 text-xs font-black text-violet-100 shadow-[0_0_18px_rgba(167,139,250,0.4)]">
            ⚡ {puToast.name}!
          </div>
        </div>
      )}

      {/* Clutch counter */}
      {clutchCount > 0 && phase === "playing" && (
        <div className="pointer-events-none absolute right-3 top-[150px] animate-[pop_0.3s_ease-out]">
          <div className="rounded-lg bg-amber-500/20 border border-amber-400/30 px-2 py-1 text-[11px] font-black text-amber-300">
            ⚡ {clutchCount} clutch{clutchCount > 1 ? "es" : ""}
          </div>
        </div>
      )}

      {/* NEW BEST indicator during gameplay */}
      {isNewBest && phase === "playing" && (
        <div className="pointer-events-none absolute left-1/2 top-[140px] -translate-x-1/2 animate-[pop_0.5s_ease-out]">
          <div className="rounded-full bg-amber-500/20 border border-amber-400/40 px-3 py-1 text-xs font-black text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
            🏆 NEW BEST!
          </div>
        </div>
      )}

      {/* Ready overlay */}
      {phase === "ready" && !summary && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
          <div className="relative">
            <div className="animate-bounce text-5xl">👆</div>
            <div className="absolute -inset-8 animate-ping rounded-full bg-white/5" />
          </div>
          <div className="rounded-2xl bg-black/50 px-6 py-3 border border-white/10 backdrop-blur-sm">
            <p className="text-base font-black text-white">Tap, click or press Space!</p>
            <p className="mt-1 text-xs font-medium text-white/60">
              {practice
                ? "Free flight — no pipes, no scoring. Just vibe! 🌿"
                : "Fly through the jars. Grab leaves. Don't crash."}
            </p>
            {!practice && (
              <p className="mt-2 text-[11px] font-semibold text-amber-300/70">
                ⚡ Squeeze through tight = CLUTCH · 3 PERFECTS = 🔥 FRENZY · grab floating power-ups!
              </p>
            )}
          </div>
          {!practice && save.stats.bestScore > 0 && (
            <div className="mt-1 rounded-full bg-amber-500/15 border border-amber-400/25 px-4 py-1.5 text-xs font-bold text-amber-300/80">
              🏆 Best: {save.stats.bestScore}
            </div>
          )}
          {save.loginStreak > 1 && (
            <div className="mt-1 rounded-full bg-lime-500/15 border border-lime-400/25 px-4 py-1.5 text-xs font-bold text-lime-300/80">
              🔥 {save.loginStreak}-day streak!
            </div>
          )}
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

      {/* Dead but no summary yet — tap to restart fallback (covers processing failures) */}
      {phase === "dead" && !summary && !practice && (
        <button
          onClick={restart}
          className="absolute inset-0 z-10 flex items-center justify-center bg-transparent cursor-pointer"
          aria-label="Tap to restart"
        >
          <div className="rounded-2xl bg-black/50 px-6 py-3 border border-white/10 backdrop-blur-sm animate-pulse">
            <p className="text-sm font-bold text-white/80">Tap to restart...</p>
          </div>
        </button>
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
              {clutchCount > 0 && (
                <>
                  <div className="w-px h-6 bg-white/10" />
                  <div className="text-center">
                    <div className="font-black text-amber-300 tabular-nums">{clutchCount}</div>
                    <div className="text-[10px] text-white/40 font-semibold mt-0.5">⚡ Clutch</div>
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

            {/* Badges earned (boasting rights!) */}
            {summary.badges.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {summary.badges.map((b) => (
                  <div key={b} className="rounded-xl bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 border border-violet-300/25 px-3 py-2 text-sm font-bold text-violet-100 animate-[pop_0.4s_ease-out]">
                    🎖️ Badge unlocked: {b}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex flex-col gap-2">
              {!revived && save.coins >= reviveCost && summary.valid && (
                <Button
                  variant="gold"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    // Deduct coins first; bail if the (possibly stale) save can't afford it.
                    if (!reviveRun(reviveCost)) return;
                    // Resurrect the SAME run in-engine (score/coins/stats preserved).
                    // The post-revive segment gets a fresh runId so its death is
                    // still recorded (not deduped against the pre-revive death),
                    // while score/coins/duration carry over.
                    const nextRunId = createRunId();
                    activeRunIdRef.current = nextRunId;
                    setRevived(true);
                    setSummary(null);
                    setPaused(false);
                    setPhase("playing");
                    window.clearTimeout(deadTimer.current);
                    setReviveRunId(nextRunId);
                    setReviveSignal((n) => n + 1);
                    setPuToast(null);
                    window.clearTimeout(puToastTimer.current);
                  }}
                >
                  💛 Revive ({reviveCost} 🪙)
                </Button>
              )}
              <Button size="lg" className="w-full" onClick={restart}>↻ One More Try</Button>
              <Button variant="dark" className="w-full" onClick={exitToMenu}>⌂ Main Menu</Button>
            </div>

            <div className="mt-3 text-center">
              <p className="text-[10px] font-semibold text-white/25">
                Level {lvl.level} · {save.coins.toLocaleString()} coins banked
              </p>
              <p className="text-[8px] font-semibold text-white/15 mt-1">{env.app.name} v{env.app.version}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

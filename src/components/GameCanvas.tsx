import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { GameEngine, type RunResult, type GameState } from "../game/engine";
import { type Skin, type Trail, worldForScore } from "../game/data";
import { audio } from "../game/audio";

export interface GameCanvasHandle {
  start: () => void;
  restart: () => void;
  revive: () => void;
  pause: () => void;
  resume: () => void;
}

export interface GameHudUpdate {
  score?: number;
  runCoins?: number;
  nearMiss?: number;
  perfectPasses?: number;
  combo?: number;
  worldName?: string;
  frenzyActive?: boolean;
  frenzyRemainingMs?: number;
  lastPowerUp?: string;
  clutch?: number;
}

interface Props {
  skin: Skin;
  trail: Trail;
  onGameOver: (run: RunResult) => void;
  reducedMotion?: boolean;
  highContrast?: boolean;
  starterPowerUps?: string[];
  onHud?: (patch: GameHudUpdate) => void;
}

export const GameCanvas = forwardRef<GameCanvasHandle, Props>(function GameCanvas(
  {
    skin,
    trail,
    onGameOver,
    reducedMotion = false,
    highContrast = false,
    starterPowerUps = [],
    onHud,
  },
  ref,
) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const onGameOverRef = useRef(onGameOver);
  const onHudRef = useRef(onHud);
  onGameOverRef.current = onGameOver;
  onHudRef.current = onHud;

  const resetHud = () => {
    onHudRef.current?.({
      score: 0,
      runCoins: 0,
      nearMiss: 0,
      perfectPasses: 0,
      combo: 1,
      worldName: worldForScore(0).name,
      frenzyActive: false,
      frenzyRemainingMs: 0,
      lastPowerUp: undefined,
      clutch: 0,
    });
  };

  // Imperative handle for Play.tsx
  useImperativeHandle(ref, () => ({
    start() {
      const eng = engineRef.current;
      if (!eng) return;
      pausedRef.current = false;
      audio.resume();
      eng.flap(); // first flap transitions "ready" → "playing"
    },
    restart() {
      const eng = engineRef.current;
      if (!eng) return;
      pausedRef.current = false;
      eng.reset(crypto.randomUUID());
      resetHud();
    },
    revive() {
      const eng = engineRef.current;
      if (!eng) return;
      pausedRef.current = false;
      eng.revive(crypto.randomUUID());
    },
    pause() {
      pausedRef.current = true;
      audio.stopMusic();
    },
    resume() {
      pausedRef.current = false;
      lastRef.current = 0;
      audio.resume();
      audio.startMusic();
    },
  }));

  // init engine once
  useEffect(() => {
    const cb = {
      onScore: (score: number) => onHudRef.current?.({ score }),
      onCoin: (runCoins: number) => onHudRef.current?.({ runCoins }),
      onNearMiss: (nearMiss: number) => onHudRef.current?.({ nearMiss }),
      onPerfectPass: (perfectPasses: number) => onHudRef.current?.({ perfectPasses }),
      onCombo: (combo: number) => onHudRef.current?.({ combo }),
      onDeath: (r: RunResult) => onGameOverRef.current(r),
      onWorld: (world: ReturnType<typeof worldForScore>) => onHudRef.current?.({ worldName: world.name }),
      onStateChange: (_s: GameState) => {},
      onPowerUp: (_id: string, name: string) => onHudRef.current?.({ lastPowerUp: name }),
      onFrenzy: (active: boolean, remainingMs: number) => onHudRef.current?.({
        frenzyActive: active,
        frenzyRemainingMs: remainingMs,
      }),
      onClutch: (clutch: number) => onHudRef.current?.({ clutch }),
    };

    const eng = new GameEngine(skin, trail, worldForScore(0), cb);
    eng.setStarterPowerUps(starterPowerUps);
    engineRef.current = eng;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: false })!;

    const resize = () => {
      const parent = wrapperRef.current;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      eng.resize(w, h);
    };
    resize();
    eng.setAccessibility(reducedMotion, highContrast);
    eng.reset(crypto.randomUUID());
    resetHud();

    const ro = new ResizeObserver(resize);
    ro.observe(wrapperRef.current!);
    window.addEventListener("resize", resize);

    const loop = (t: number) => {
      const dt = lastRef.current ? (t - lastRef.current) / 1000 : 0.016;
      lastRef.current = t;
      if (!pausedRef.current) eng.update(dt);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      eng.render(ctx);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener("resize", resize);
      audio.stopMusic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update cosmetics / accessibility when props change
  useEffect(() => {
    engineRef.current?.setCosmetics(skin, trail);
    engineRef.current?.setAccessibility(reducedMotion, highContrast);
  }, [skin, trail, reducedMotion, highContrast]);

  const starterKey = starterPowerUps.join("|");
  useEffect(() => {
    engineRef.current?.setStarterPowerUps(starterPowerUps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starterKey]);

  // input
  useEffect(() => {
    const flap = () => {
      if (pausedRef.current) return;
      audio.resume();
      engineRef.current?.flap();
    };
    const canvas = canvasRef.current!;
    const onPointer = (e: PointerEvent) => {
      e.preventDefault();
      flap();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        flap();
      }
    };
    canvas.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      canvas.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
      audio.stopMusic();
    };
  }, []);

  return (
    <div ref={wrapperRef} className="block h-full w-full touch-none select-none">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
});

export default GameCanvas;

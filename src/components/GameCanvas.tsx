import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { GameEngine, type RunResult, type GameState } from "../game/engine";
import { type Skin, type Trail, worldForScore } from "../game/data";
import { audio } from "../game/audio";

export interface GameCanvasHandle {
  start: () => void;
  restart: () => void;
  revive: () => void;
}

interface Props {
  skin: Skin;
  trail: Trail;
  onGameOver: (run: RunResult) => void;
  reducedMotion?: boolean;
  highContrast?: boolean;
}

export const GameCanvas = forwardRef<GameCanvasHandle, Props>(function GameCanvas(
  { skin, trail, onGameOver, reducedMotion = false, highContrast = false },
  ref,
) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  // Imperative handle for Play.tsx
  useImperativeHandle(ref, () => ({
    start() {
      const eng = engineRef.current;
      if (!eng) return;
      eng.flap(); // first flap transitions "ready" → "playing"
    },
    restart() {
      const eng = engineRef.current;
      if (!eng) return;
      eng.reset(crypto.randomUUID());
    },
    revive() {
      const eng = engineRef.current;
      if (!eng) return;
      eng.revive(crypto.randomUUID());
    },
  }));

  // init engine once
  useEffect(() => {
    const cb = {
      onDeath: (r: RunResult) => onGameOverRef.current(r),
      onStateChange: (_s: GameState) => {},
    };

    const eng = new GameEngine(skin, trail, worldForScore(0), cb);
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

    const ro = new ResizeObserver(resize);
    ro.observe(wrapperRef.current!);
    window.addEventListener("resize", resize);

    const loop = (t: number) => {
      const dt = lastRef.current ? (t - lastRef.current) / 1000 : 0.016;
      lastRef.current = t;
      eng.update(dt);
      ctx.setTransform(
        Math.min(window.devicePixelRatio || 1, 2), 0, 0,
        Math.min(window.devicePixelRatio || 1, 2), 0, 0,
      );
      eng.render(ctx);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update cosmetics / accessibility when props change
  useEffect(() => {
    engineRef.current?.setCosmetics(skin, trail);
    engineRef.current?.setAccessibility(reducedMotion, highContrast);
  }, [skin, trail, reducedMotion, highContrast]);

  // input
  useEffect(() => {
    const flap = () => {
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

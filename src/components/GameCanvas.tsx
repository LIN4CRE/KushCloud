import { useEffect, useRef } from "react";
import { GameEngine, RunResult, GameState } from "../game/engine";
import { Skin, Trail, World, worldForScore } from "../game/data";
import { audio } from "../game/audio";

interface Props {
  skin: Skin;
  trail: Trail;
  reducedMotion: boolean;
  highContrast: boolean;
  practiceMode?: boolean;
  paused: boolean;
  runId: string;
  bestScoreBefore: number;
  /** Increment to resurrect the bird mid-run (paid Revive) without resetting score. */
  reviveSignal?: number;
  /** The fresh runId to assign to the post-revive segment (for scoring/dedup). */
  reviveRunId?: string;
  onScore?: (s: number) => void;
  onCoin?: (c: number) => void;
  onNearMiss?: (n: number) => void;
  onPerfectPass?: (p: number) => void;
  onCombo?: (m: number) => void;
  onWorld?: (w: World) => void;
  onDeath?: (r: RunResult) => void;
  onStateChange?: (s: GameState) => void;
  onPowerUp?: (id: string, name: string) => void;
  onFrenzy?: (active: boolean, remainingMs: number) => void;
  onClutch?: (count: number) => void;
}

export default function GameCanvas(props: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  const pausedRef = useRef(props.paused);
  const propsRef = useRef(props);
  propsRef.current = props;
  pausedRef.current = props.paused;

  // init engine once
  useEffect(() => {
    const cb = {
      onScore: (s: number) => propsRef.current.onScore?.(s),
      onCoin: (c: number) => propsRef.current.onCoin?.(c),
      onNearMiss: (n: number) => propsRef.current.onNearMiss?.(n),
      onPerfectPass: (p: number) => propsRef.current.onPerfectPass?.(p),
      onCombo: (m: number) => propsRef.current.onCombo?.(m),
      onWorld: (w: World) => propsRef.current.onWorld?.(w),
      onDeath: (r: RunResult) => propsRef.current.onDeath?.(r),
      onStateChange: (st: GameState) => propsRef.current.onStateChange?.(st),
      onPowerUp: (id: string, name: string) => propsRef.current.onPowerUp?.(id, name),
      onFrenzy: (active: boolean, remainingMs: number) => propsRef.current.onFrenzy?.(active, remainingMs),
      onClutch: (count: number) => propsRef.current.onClutch?.(count),
    };
    const eng = new GameEngine(props.skin, props.trail, worldForScore(0), cb);
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
    eng.setAccessibility(props.reducedMotion, props.highContrast);
    eng.setPracticeMode(!!props.practiceMode);
    eng.bestScoreBefore = props.bestScoreBefore;
    eng.reset(props.runId);

    const ro = new ResizeObserver(resize);
    ro.observe(wrapperRef.current!);
    window.addEventListener("resize", resize);

    const loop = (t: number) => {
      const dt = lastRef.current ? (t - lastRef.current) / 1000 : 0.016;
      lastRef.current = t;
      if (!pausedRef.current) eng.update(dt);
      ctx.setTransform(
        Math.min(window.devicePixelRatio || 1, 2), 0, 0,
        Math.min(window.devicePixelRatio || 1, 2), 0, 0
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

  // update cosmetics / accessibility / practice when props change
  useEffect(() => {
    engineRef.current?.setCosmetics(props.skin, props.trail);
    engineRef.current?.setAccessibility(props.reducedMotion, props.highContrast);
    engineRef.current?.setPracticeMode(!!props.practiceMode);
  }, [props.skin, props.trail, props.reducedMotion, props.highContrast, props.practiceMode]);

  // reset on new run
  useEffect(() => {
    lastRef.current = 0;
    engineRef.current?.reset(props.runId);
  }, [props.runId]);

  // revive on signal change (skip initial 0 / undefined)
  useEffect(() => {
    if (props.reviveSignal) {
      lastRef.current = 0;
      engineRef.current?.revive(propsRef.current.reviveRunId);
    }
  }, [props.reviveSignal]);

  // input
  useEffect(() => {
    const flap = () => {
      audio.resume();
      if (pausedRef.current) return;
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
      // clear audio handlers on unmount to avoid stale callbacks
      audio.stopMusic();
    };
  }, []);

  return (
    <div ref={wrapperRef} className="block h-full w-full touch-none select-none">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

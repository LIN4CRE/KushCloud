import { ReactNode, ButtonHTMLAttributes, useState, useEffect, useCallback } from "react";
import { audio } from "./game/audio";
import { RARITY, type Rarity } from "./game/data";

export function cx(...a: (string | false | undefined | null)[]) {
  return a.filter(Boolean).join(" ");
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "gold" | "danger" | "dark" | "premium";
  size?: "sm" | "md" | "lg";
}
export function Button({ variant = "primary", size = "md", className, children, onClick, ...rest }: BtnProps) {
  const [pressed, setPressed] = useState(false);
  const base =
    "relative inline-flex items-center justify-center gap-2 font-bold rounded-2xl transition-all duration-150 active:translate-y-px active:brightness-90 disabled:opacity-35 disabled:pointer-events-none select-none tracking-wide";
  const variants: Record<string, string> = {
    primary:
      "bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-[0_4px_0_#065f46,0_1px_3px_rgba(0,0,0,0.4)] hover:from-emerald-300",
    gold:
      "bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 shadow-[0_4px_0_#92400e,0_1px_3px_rgba(0,0,0,0.4)] hover:from-amber-200",
    danger:
      "bg-gradient-to-b from-rose-500 to-rose-700 text-white shadow-[0_4px_0_#881337,0_1px_3px_rgba(0,0,0,0.4)] hover:from-rose-400",
    dark:
      "bg-white/[0.08] text-white border border-white/[0.12] hover:bg-white/[0.13] backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
    ghost: "bg-transparent text-white/70 hover:text-white hover:bg-white/5",
    premium:
      "bg-gradient-to-b from-violet-400 to-violet-600 text-white shadow-[0_4px_0_#5b21b6,0_1px_3px_rgba(0,0,0,0.4)] hover:from-violet-300",
  };
  const sizes = {
    sm: "px-3.5 py-1.5 text-sm rounded-xl",
    md: "px-5 py-2.5 text-[0.9375rem]",
    lg: "px-7 py-3.5 text-lg",
  };
  return (
    <button
      className={cx(
        base,
        variants[variant] || variants.primary,
        sizes[size],
        pressed && "animate-press",
        className,
      )}
      onClick={(e) => {
        audio.click();
        setPressed(true);
        setTimeout(() => setPressed(false), 200);
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        "rounded-3xl bg-white/[0.07] backdrop-blur-md border border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.07)] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)] hover:bg-white/[0.09]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ScreenShell({
  title,
  onBack,
  children,
  right,
  subtitle,
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
  right?: ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="flex h-full flex-col animate-screen-enter">
      <div className="shrink-0 px-4 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { audio.click(); onBack(); }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08] text-white border border-white/[0.1] hover:bg-white/[0.13] active:scale-90 transition-all duration-150"
            aria-label="Back"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-white tracking-tight">{title}</h1>
            {subtitle && <p className="text-[11px] font-semibold text-white/40 mt-0.5">{subtitle}</p>}
          </div>
          {right && <div className="ml-auto">{right}</div>}
        </div>
        <div className="mt-3 h-px bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-8 [scrollbar-width:thin]">{children}</div>
    </div>
  );
}

export function Stat({ label, value, icon, variant = "default" }: { label: string; value: ReactNode; icon?: string; variant?: "default" | "highlight" | "danger" | "gold" }) {
  const variants = {
    default: "bg-white/[0.07] border-white/[0.09] text-white",
    highlight: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    danger: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    gold: "bg-amber-400/10 border-amber-300/20 text-amber-300",
  };
  return (
    <div className={cx("rounded-2xl border p-3 text-center flex flex-col items-center gap-0.5 transition-all duration-300 hover:scale-[1.04] hover:brightness-110 active:scale-[0.97]", variants[variant])}>
      {icon && <div className="text-xl leading-none mb-0.5 drop-shadow-sm transition-transform duration-300 group-hover:scale-110">{icon}</div>}
      <div className="text-lg font-black leading-tight tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wider opacity-50 font-black">{label}</div>
    </div>
  );
}

export function ProgressBar({ value, max, className, barClass, animate = true }: { value: number; max: number; className?: string; barClass?: string; animate?: boolean }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cx("h-2 w-full overflow-hidden rounded-full bg-black/40 border border-white/5", className)}>
      <div
        className={cx(
          "h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]",
          animate && "transition-all duration-1000 ease-out",
          barClass,
        )}
        style={{ width: pct + "%" }}
      />
    </div>
  );
}

export function CoinPill({ coins }: { coins: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-amber-400/15 border border-amber-300/25 px-3 py-1 font-bold text-amber-200 text-sm shadow-[inset_0_1px_0_rgba(251,191,36,0.1)] transition-all duration-300 hover:bg-amber-400/20 animate-breathe">
      <span className="text-base leading-none">🪙</span>
      <span className="tabular-nums">{coins.toLocaleString()}</span>
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-black uppercase tracking-widest text-white/35 mb-2">{children}</p>;
}

export function RarityBadge({ rarity, size = "sm" }: { rarity: Rarity; size?: "sm" | "md" }) {
  const r = RARITY[rarity];
  if (size === "md") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase"
        style={{ background: r.bg, border: `1px solid ${r.border}`, color: r.color }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.color, boxShadow: `0 0 4px ${r.color}` }} />
        {r.label}
      </span>
    );
  }
  return (
    <span className="text-[9px] font-black tracking-wider uppercase" style={{ color: r.color }}>
      {r.label}
    </span>
  );
}

export function RarityGlow({ rarity, children }: { rarity: Rarity; children: ReactNode }) {
  const r = RARITY[rarity];
  return (
    <div
      className="rounded-2xl p-[1px]"
      style={{ background: `linear-gradient(135deg, ${r.color}40, transparent, ${r.color}20)` }}
    >
      <div className="rounded-2xl bg-slate-900/95 h-full" style={{ boxShadow: `inset 0 0 20px ${r.glow}` }}>
        {children}
      </div>
    </div>
  );
}

/* Tabs component */
export function Tabs({ tabs, active, onChange }: {
  tabs: { key: string; label: string; icon?: string }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-black/25 p-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cx(
            "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all duration-200",
            active === t.key
              ? "bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.4)] scale-[1.02]"
              : "text-white/50 hover:text-white/70 active:scale-95",
          )}
        >
          {t.icon && <span>{t.icon}</span>}
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* Modal overlay */
export function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[fade-in_150ms_ease-out]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm animate-[scale-in_250ms_cubic-bezier(0.16,1,0.3,1)_both]" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/* Confetti burst particles */
export function ConfettiBurst({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<{ x: number; y: number; c: string; r: number }[]>([]);
  useEffect(() => {
    if (!active) { setParticles([]); return; }
    const colors = ["#fbbf24", "#f472b6", "#60a5fa", "#4ade80", "#a78bfa", "#fb923c"];
    const p = Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      y: -10 - Math.random() * 40,
      c: colors[Math.floor(Math.random() * colors.length)],
      r: 2 + Math.random() * 4,
    }));
    setParticles(p);
    const timer = setTimeout(() => setParticles([]), 1500);
    return () => clearTimeout(timer);
  }, [active]);
  if (particles.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-[confetti_1.5s_ease-out_forwards]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.r,
            height: p.r,
            background: p.c,
            boxShadow: `0 0 4px ${p.c}`,
            animationDelay: `${i * 20}ms`,
          }}
        />
      ))}
    </div>
  );
}

/* Animated number counter */
export function AnimatedNumber({ value, duration = 600 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const start = display;
    const diff = value - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      setDisplay(Math.round(start + diff * t * (2 - t)));
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
}

/* Shimmer loading placeholder */
export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cx("animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] rounded-2xl", className)}
    />
  );
}

/* Floating leaf decorative animation (cannabis-style) */
export function FloatingLeaf({ className }: { className?: string }) {
  const [style] = useState(() => ({
    left: `${5 + Math.random() * 90}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 3}s`,
    animationDuration: `${3 + Math.random() * 2}s`,
  }));
  return (
    <span
      className={cx("pointer-events-none absolute text-lg opacity-20 animate-leaf-drift", className)}
      style={style}
    >
      🍃
    </span>
  );
}

/* Toast notification with auto-dismiss */
interface ToastData {
  id: number;
  message: string;
  type?: "success" | "error" | "info";
}
let toastId = 0;
let toastListeners: ((t: ToastData) => void)[] = [];
export function showToast(message: string, type: "success" | "error" | "info" = "info") {
  const t: ToastData = { id: ++toastId, message, type };
  toastListeners.forEach((fn) => fn(t));
}
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const addToast = useCallback((t: ToastData) => {
    setToasts((prev) => [...prev, t]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 2400);
  }, []);
  useEffect(() => {
    toastListeners.push(addToast);
    return () => { toastListeners = toastListeners.filter((fn) => fn !== addToast); };
  }, [addToast]);
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cx(
            "pointer-events-auto rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-2xl animate-[slide-down_300ms_var(--ease-spring)_both]",
            t.type === "success" && "bg-gradient-to-r from-emerald-500 to-emerald-700",
            t.type === "error" && "bg-gradient-to-r from-rose-500 to-rose-700",
            t.type === "info" && "bg-gradient-to-r from-blue-500 to-blue-700",
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

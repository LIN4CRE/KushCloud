import { ReactNode, ButtonHTMLAttributes } from "react";
import { audio } from "./game/audio";

export function cx(...a: (string | false | undefined | null)[]) {
  return a.filter(Boolean).join(" ");
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "gold" | "danger" | "dark";
  size?: "sm" | "md" | "lg";
}
export function Button({ variant = "primary", size = "md", className, children, onClick, ...rest }: BtnProps) {
  const base =
    "relative inline-flex items-center justify-center gap-2 font-bold rounded-2xl transition-all duration-150 active:translate-y-px active:brightness-90 disabled:opacity-35 disabled:pointer-events-none select-none tracking-wide";
  const variants = {
    primary:
      "bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-[0_4px_0_#065f46,0_1px_3px_rgba(0,0,0,0.4)] hover:from-emerald-350 hover:to-emerald-550",
    gold:
      "bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 shadow-[0_4px_0_#92400e,0_1px_3px_rgba(0,0,0,0.4)] hover:from-amber-200",
    danger:
      "bg-gradient-to-b from-rose-500 to-rose-700 text-white shadow-[0_4px_0_#881337,0_1px_3px_rgba(0,0,0,0.4)] hover:from-rose-400",
    dark:
      "bg-white/[0.08] text-white border border-white/[0.12] hover:bg-white/[0.13] backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
    ghost: "bg-transparent text-white/70 hover:text-white hover:bg-white/5",
  };
  const sizes = {
    sm: "px-3.5 py-1.5 text-sm rounded-xl",
    md: "px-5 py-2.5 text-[0.9375rem]",
    lg: "px-7 py-3.5 text-lg",
  };
  return (
    <button
      className={cx(base, variants[variant], sizes[size], className)}
      onClick={(e) => {
        audio.click();
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
        "rounded-3xl bg-white/[0.07] backdrop-blur-md border border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.07)]",
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
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-4 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              audio.click();
              onBack();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08] text-white border border-white/[0.1] hover:bg-white/[0.13] active:scale-95 transition-all"
            aria-label="Back"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-xl font-black text-white tracking-tight">{title}</h1>
          {right && <div className="ml-auto">{right}</div>}
        </div>
        <div className="mt-3 h-px bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-8 [scrollbar-width:thin]">{children}</div>
    </div>
  );
}

export function Stat({ label, value, icon }: { label: string; value: ReactNode; icon?: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.07] border border-white/[0.09] p-3 text-center flex flex-col items-center gap-0.5">
      {icon && <div className="text-xl leading-none mb-0.5">{icon}</div>}
      <div className="text-lg font-black text-white leading-tight">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/45 font-semibold">{label}</div>
    </div>
  );
}

export function ProgressBar({
  value,
  max,
  className,
  barClass,
}: {
  value: number;
  max: number;
  className?: string;
  barClass?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cx("h-2 w-full overflow-hidden rounded-full bg-black/30", className)}>
      <div
        className={cx(
          "h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 transition-all duration-700 shadow-[0_0_6px_rgba(74,222,128,0.5)]",
          barClass,
        )}
        style={{ width: pct + "%" }}
      />
    </div>
  );
}

export function CoinPill({ coins }: { coins: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-amber-400/15 border border-amber-300/25 px-3 py-1 font-bold text-amber-200 text-sm shadow-[inset_0_1px_0_rgba(251,191,36,0.1)]">
      <span className="text-base leading-none">🪙</span>
      <span className="tabular-nums">{coins.toLocaleString()}</span>
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-black uppercase tracking-widest text-white/35 mb-2">{children}</p>
  );
}

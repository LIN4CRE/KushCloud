import { type ReactNode, useEffect, useState, useCallback, createContext, useContext } from "react";

export function Button({
  children, onClick, className = "", disabled, variant = "primary", ...rest
}: {
  children: ReactNode; onClick?: () => void; className?: string; disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
} & Record<string, unknown>) {
  const base = "relative cursor-pointer select-none rounded-xl px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40";
  const variants = {
    primary:   "bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-900/40 hover:from-emerald-300 hover:to-emerald-500",
    secondary: "bg-gradient-to-b from-slate-600 to-slate-700 text-slate-200 shadow-lg shadow-slate-900/40 hover:from-slate-500 hover:to-slate-600",
    ghost:     "bg-transparent text-slate-300 hover:bg-white/5",
    danger:    "bg-gradient-to-b from-red-500 to-red-700 text-white shadow-lg shadow-red-900/40 hover:from-red-400 hover:to-red-600",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}

export function ScreenShell({ children, title, onBack }: {
  children: ReactNode; title?: string; onBack?: () => void;
}) {
  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-white/5 px-4 py-3">
        {onBack && (
          <button onClick={onBack} className="flex size-9 items-center justify-center rounded-xl bg-white/5 text-lg hover:bg-white/10 active:scale-90">
            ←
          </button>
        )}
        {title && <h1 className="text-lg font-bold tracking-wider text-white">{title}</h1>}
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {children}
      </div>
    </div>
  );
}

export function Stat({ label, value, className = "" }: { label: string; value: string | number; className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <span className="text-xs uppercase tracking-widest text-slate-400">{label}</span>
      <span className="text-xl font-bold text-white">{value}</span>
    </div>
  );
}

export function ProgressBar({ value, max, className = "" }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-slate-700 ${className}`}>
      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function CoinPill({ amount, className = "" }: { amount: number; className?: string }) {
  const compact = amount >= 1000000 ? `${(amount / 1000000).toFixed(1)}M` :
    amount >= 1000 ? `${(amount / 1000).toFixed(1)}K` : String(amount);
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-3 py-1 text-sm font-bold text-amber-300 ${className}`}>
      <span>🪙</span>
      <span>{compact}</span>
    </div>
  );
}

export function Tabs({ tabs, active, onChange }: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-slate-800/60 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
            active === tab.id
              ? "bg-emerald-600 text-white shadow-lg"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-700 ${className}`} />
  );
}

export function FloatingLeaf({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-block animate-bounce text-xs ${className}`}>🌿</span>
  );
}

interface Toast {
  id: number; message: string; type: "success" | "error" | "info";
}

interface ToastCtx {
  show: (message: string, type?: Toast["type"]) => void;
}

const Ctx = createContext<ToastCtx>({ show: () => {} });

export function showToast(message: string, type: Toast["type"] = "info") {
  Ctx?._currentValue?.show?.(message, type);
}
showToast._ctx = Ctx;

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useState(0);

  const show = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = idRef[0]++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, [idRef]);

  return (
    <Ctx.Provider value={{ show }}>
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 mx-auto flex max-w-md flex-col items-center gap-2 px-4">
        {toasts.map((toast) => {
          const colors = {
            success: "bg-emerald-800/90 border-emerald-500 text-emerald-200",
            error: "bg-red-800/90 border-red-500 text-red-200",
            info: "bg-slate-800/90 border-slate-500 text-slate-200",
          };
          return (
            <div
              key={toast.id}
              className={`animate-in slide-in-from-bottom-2 rounded-xl border px-4 py-2 text-sm font-medium shadow-xl backdrop-blur-sm ${colors[toast.type]}`}
            >
              {toast.message}
            </div>
          );
        })}
      </div>
      {toasts.length === 0 && <span style={{ display: "none" }} />}
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  return useContext(Ctx);
}

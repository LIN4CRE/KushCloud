import { SaveData } from "../game/storage";
import { ScreenShell, Button, cx } from "../ui";

interface Props {
  save: SaveData;
  onBack: () => void;
  onChange: (patch: Partial<SaveData>) => void;
  onReset: () => void;
}

function Slider({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  icon: string;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.06] border border-white/[0.08] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-white">
          <span>{icon}</span> {label}
        </span>
        <span className="text-sm font-black text-emerald-400 tabular-nums w-10 text-right">
          {Math.round(value * 100)}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-emerald-400 cursor-pointer"
      />
    </div>
  );
}

function Toggle({
  label,
  desc,
  on,
  onClick,
  icon,
}: {
  label: string;
  desc: string;
  on: boolean;
  onClick: () => void;
  icon: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] p-4 text-left hover:bg-white/[0.09] active:scale-[0.99] transition-all"
    >
      <span className="text-xl shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-[10px] font-medium text-white/40 mt-0.5">{desc}</div>
      </div>
      <div
        className={cx(
          "relative h-6 w-11 rounded-full transition-all duration-200 shrink-0",
          on ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-white/15",
        )}
      >
        <div
          className={cx(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200",
            on ? "left-5" : "left-0.5",
          )}
        />
      </div>
    </button>
  );
}

export default function Settings({ save, onBack, onChange, onReset }: Props) {
  return (
    <ScreenShell title="Settings" onBack={onBack}>
      <div className="space-y-2.5">
        <p className="text-[11px] font-black uppercase tracking-widest text-white/30 mb-1">Audio</p>
        <Slider icon="🎵" label="Music" value={save.musicVol} onChange={(v) => onChange({ musicVol: v })} />
        <Slider icon="🔊" label="Sound Effects" value={save.sfxVol} onChange={(v) => onChange({ sfxVol: v })} />

        <p className="text-[11px] font-black uppercase tracking-widest text-white/30 pt-2 mb-1">Accessibility</p>
        <Toggle
          icon="🌀"
          label="Reduced Motion"
          desc="Fewer particles and no screen shake."
          on={save.reducedMotion}
          onClick={() => onChange({ reducedMotion: !save.reducedMotion })}
        />
        <Toggle
          icon="🎨"
          label="High Contrast"
          desc="Bolder colors for better visibility."
          on={save.highContrast}
          onClick={() => onChange({ highContrast: !save.highContrast })}
        />

        <p className="text-[11px] font-black uppercase tracking-widest text-white/30 pt-2 mb-1">Data</p>
        <div className="rounded-2xl bg-white/[0.06] border border-white/[0.08] p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">☁️</span>
            <span className="text-sm font-semibold text-white/70">Cloud save</span>
            <span className="ml-auto text-xs font-black text-emerald-400">Active</span>
          </div>
          <p className="text-[10px] font-medium text-white/30 ml-6">
            Last synced {new Date(save.lastSync).toLocaleTimeString()}
          </p>
        </div>

        <Button variant="danger" className="w-full mt-1" onClick={onReset}>
          🗑 Reset All Progress
        </Button>

        <p className="pb-2 pt-1 text-center text-[10px] font-semibold text-white/20">
          KushCloud v1.0 · Made with 🌿 & ☁️
        </p>
      </div>
    </ScreenShell>
  );
}

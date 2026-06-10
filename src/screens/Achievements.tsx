import { SaveData } from "../game/storage";
import { ACHIEVEMENTS } from "../game/data";
import { ScreenShell, Button, ProgressBar, cx } from "../ui";

interface Props {
  save: SaveData;
  onBack: () => void;
  onClaim: (id: string) => void;
}

export default function Achievements({ save, onBack, onClaim }: Props) {
  const statVal = (stat: string) => {
    if (stat === "score" || stat === "bestScore") return save.stats.bestScore;
    return (save.stats as any)[stat] ?? 0;
  };
  const done = save.unlockedAchievements.length;
  const total = ACHIEVEMENTS.length;
  const pct = Math.round((done / total) * 100);

  return (
    <ScreenShell
      title="Achievements"
      onBack={onBack}
      right={
        <span className="rounded-full bg-white/[0.08] border border-white/[0.1] px-3 py-1 text-xs font-black text-white">
          {done}/{total}
        </span>
      }
    >
      {/* Progress bar */}
      <div className="mb-4 rounded-2xl bg-white/[0.06] border border-white/[0.08] p-3.5">
        <div className="flex justify-between text-xs font-semibold text-white/50 mb-2">
          <span>Overall progress</span>
          <span className="text-emerald-400 font-black">{pct}%</span>
        </div>
        <ProgressBar value={done} max={total} />
      </div>

      <div className="space-y-2">
        {ACHIEVEMENTS.map((a) => {
          const val = Math.min(statVal(a.stat), a.goal);
          const unlocked = save.unlockedAchievements.includes(a.id);
          const claimed = save.claimedAchievements.includes(a.id);

          return (
            <div
              key={a.id}
              className={cx(
                "rounded-2xl border p-3.5 transition-all",
                claimed
                  ? "bg-white/[0.04] border-white/[0.06]"
                  : unlocked
                  ? "bg-amber-400/10 border-amber-300/25"
                  : "bg-white/[0.06] border-white/[0.08]",
              )}
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div
                  className={cx(
                    "flex h-11 w-11 items-center justify-center rounded-xl text-2xl shrink-0 transition-all",
                    unlocked ? "bg-amber-400/25" : "bg-black/25 grayscale opacity-40",
                  )}
                >
                  🏅
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className={cx("font-black text-sm", claimed ? "text-white/40" : "text-white")}>
                    {a.name}
                  </div>
                  <div className="text-[10px] font-medium text-white/40 mt-0.5 leading-snug">{a.desc}</div>
                </div>

                {/* Action */}
                {unlocked && !claimed ? (
                  <Button size="sm" variant="gold" className="shrink-0" onClick={() => onClaim(a.id)}>
                    🪙 {a.reward}
                  </Button>
                ) : claimed ? (
                  <span className="text-xs font-black text-emerald-400 shrink-0">✓ Claimed</span>
                ) : (
                  <span className="text-xs font-semibold text-white/30 shrink-0">🪙 {a.reward}</span>
                )}
              </div>

              {/* Progress bar for locked */}
              {!unlocked && (
                <div className="mt-2.5 flex items-center gap-2">
                  <ProgressBar value={val} max={a.goal} />
                  <span className="text-[10px] font-semibold text-white/35 shrink-0 tabular-nums">
                    {val}/{a.goal}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScreenShell>
  );
}

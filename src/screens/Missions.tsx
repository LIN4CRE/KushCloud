import { SaveData } from "../game/storage";
import { currentMissions } from "../game/storage";
import { LOGIN_REWARDS } from "../game/data";
import { ScreenShell, Button, ProgressBar, cx } from "../ui";

interface Props {
  save: SaveData;
  onBack: () => void;
  onClaimMission: (id: string) => void;
  onClaimLogin: () => void;
  loginAvailable: boolean;
}

export default function Missions({ save, onBack, onClaimMission, onClaimLogin, loginAvailable }: Props) {
  const missions = currentMissions();
  const streakIdx = Math.min(save.loginStreak, LOGIN_REWARDS.length) - 1;

  const week = Math.floor(Date.now() / (86400000 * 7));
  const events = [
    { name: "Frosty Friday Fest", desc: "Coins from runs are worth +50% all week!", icon: "❄️" },
    { name: "Double XP Daze", desc: "Earn bonus XP on every flap through the week.", icon: "✨" },
    { name: "Combo Carnival", desc: "Near-misses give extra combo this week.", icon: "🎪" },
  ];
  const ev = events[week % events.length];

  return (
    <ScreenShell title="Daily Hub" onBack={onBack}>
      {/* Login rewards */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-600/20 to-teal-700/15 border border-emerald-400/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-black text-white text-sm">🎁 Daily Login</h2>
            <p className="text-[10px] font-semibold text-white/40 mt-0.5">Day {save.loginStreak} streak</p>
          </div>
          {loginAvailable && (
            <span className="rounded-full bg-amber-400/20 border border-amber-300/30 px-2.5 py-0.5 text-[10px] font-black text-amber-300">
              Ready!
            </span>
          )}
        </div>

        <div className="flex gap-1.5 mb-3">
          {LOGIN_REWARDS.map((r, i) => (
            <div
              key={i}
              className={cx(
                "flex-1 rounded-xl border py-2 text-center transition-all",
                i < save.loginStreak
                  ? "bg-amber-400/20 border-amber-300/30"
                  : "bg-black/20 border-white/[0.08]",
                i === streakIdx && loginAvailable && "ring-1 ring-amber-300 ring-offset-1 ring-offset-transparent",
              )}
            >
              <div className="text-[9px] font-bold text-white/40">D{i + 1}</div>
              <div className="text-[11px] font-black text-amber-200 tabular-nums">{r}</div>
            </div>
          ))}
        </div>

        {loginAvailable ? (
          <Button variant="gold" className="w-full" onClick={onClaimLogin}>
            Claim Today · 🪙 {LOGIN_REWARDS[Math.max(0, streakIdx)]}
          </Button>
        ) : (
          <div className="rounded-xl bg-black/20 py-2 text-center text-xs font-semibold text-white/40">
            ✓ Claimed — come back tomorrow!
          </div>
        )}
      </div>

      {/* Weekly event */}
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-fuchsia-600/15 to-violet-700/15 border border-fuchsia-400/20 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-500/20 text-2xl shrink-0">
            {ev.icon}
          </div>
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-fuchsia-300/70 mb-0.5">Active Event</div>
            <div className="font-black text-white text-sm">{ev.name}</div>
            <div className="text-[10px] font-medium text-white/45 mt-0.5 leading-snug">{ev.desc}</div>
          </div>
        </div>
      </div>

      {/* Daily missions */}
      <div className="mt-5">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-white/35 mb-2.5">Daily Challenges</h2>
        <div className="space-y-2">
          {missions.map((m) => {
            const prog = save.missions.find((p) => p.id === m.id);
            const value = Math.min(prog?.progress ?? 0, m.goal);
            const complete = value >= m.goal;
            const claimed = prog?.claimed;
            return (
              <div
                key={m.id}
                className={cx(
                  "rounded-2xl border p-3.5 transition-all",
                  claimed
                    ? "bg-white/[0.04] border-white/[0.06]"
                    : complete
                    ? "bg-emerald-500/10 border-emerald-400/25"
                    : "bg-white/[0.06] border-white/[0.08]",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={cx("text-sm font-semibold leading-snug", claimed ? "text-white/40" : "text-white")}>
                    {m.text}
                  </span>
                  {complete && !claimed ? (
                    <Button size="sm" variant="gold" className="shrink-0" onClick={() => onClaimMission(m.id)}>
                      🪙 {m.reward}
                    </Button>
                  ) : claimed ? (
                    <span className="text-xs font-black text-emerald-400 shrink-0">✓ Done</span>
                  ) : (
                    <span className="text-xs font-semibold text-amber-300/60 shrink-0">🪙 {m.reward}</span>
                  )}
                </div>
                {!claimed && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <ProgressBar value={value} max={m.goal} />
                    <span className="text-[10px] font-semibold text-white/40 shrink-0 tabular-nums">
                      {value}/{m.goal}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-5 text-center text-[10px] font-semibold text-white/25">New challenges every day · resets at midnight 🌙</p>
    </ScreenShell>
  );
}

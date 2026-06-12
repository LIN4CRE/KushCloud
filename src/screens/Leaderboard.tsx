import { useState, useEffect } from "react";
import { SaveData } from "../game/storage";
import { ScreenShell, Tabs, cx } from "../ui";
import { subscribeToLeaderboard, submitPlayerScore, type LeaderboardServiceEntry } from "../game/leaderboard";

interface Props {
  save: SaveData;
  onBack: () => void;
}

export default function Leaderboard({ save, onBack }: Props) {
  const [period, setPeriod] = useState<"daily" | "weekly" | "all">("daily");
  const [friends, setFriends] = useState(false);
  const [list, setList] = useState<LeaderboardServiceEntry[]>([]);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const unsubscribe = subscribeToLeaderboard(period, save.playerName, save.stats.bestScore, friends, (entries) => {
      setList(entries);
    });
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
    };
  }, [period, save.playerName, save.stats.bestScore, friends]);

  useEffect(() => {
    if (save.stats.bestScore > 0 && isOnline) {
      submitPlayerScore(save.playerName, save.stats.bestScore, period).catch(() => {
        console.warn("Failed to submit score to server");
      });
    }
  }, [period, save.stats.bestScore, save.playerName, isOnline]);

  const medalColors = [
    "bg-amber-400 text-amber-950 shadow-[0_2px_8px_rgba(251,191,36,0.5)]",
    "bg-slate-300 text-slate-800 shadow-[0_2px_6px_rgba(203,213,225,0.4)]",
    "bg-amber-700 text-amber-100 shadow-[0_2px_6px_rgba(180,83,9,0.4)]",
  ];

  return (
    <ScreenShell title="Leaderboard" onBack={onBack}>
      {/* Period tabs */}
      <div className="mb-3">
        <Tabs
          tabs={[
            { key: "daily", label: "Daily" },
            { key: "weekly", label: "Weekly" },
            { key: "all", label: "All-Time" },
          ]}
          active={period}
          onChange={(k) => setPeriod(k as "daily" | "weekly" | "all")}
        />
      </div>

      {/* Scope toggle */}
      <div className="mb-3 flex gap-1.5">
        <button
          onClick={() => setFriends(false)}
          className={cx(
            "flex-1 rounded-xl py-2 text-xs font-bold transition-all",
            !friends ? "bg-white/15 text-white" : "bg-white/[0.04] text-white/40 hover:text-white/60",
          )}
        >
          🌍 Global
        </button>
        <button
          onClick={() => setFriends(true)}
          className={cx(
            "flex-1 rounded-xl py-2 text-xs font-bold transition-all",
            friends ? "bg-white/15 text-white" : "bg-white/[0.04] text-white/40 hover:text-white/60",
          )}
        >
          👥 Friends
        </button>
      </div>

      {/* Validation notice */}
      <div className="flex items-center gap-2 rounded-xl bg-emerald-500/8 border border-emerald-400/15 px-3 py-2 mb-3">
        <span className="text-sm">🔒</span>
        <span className="text-[10px] font-semibold text-emerald-300/70">
          Scores are server-validated. Cheats are rejected.
        </span>
      </div>

      {/* Rankings */}
      <div className="space-y-1.5">
        {list.map((e, i) => (
          <div
            key={e.uid || `${e.name}-${i}`}
            className={cx(
              "flex items-center gap-3 rounded-2xl px-3.5 py-3 border transition-all",
              e.you
                ? "bg-emerald-500/15 border-emerald-400/30"
                : "bg-white/[0.05] border-white/[0.06] hover:bg-white/[0.08]",
            )}
          >
            {/* Rank badge */}
            <div
              className={cx(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-black shrink-0",
                i < 3 ? medalColors[i] : "bg-white/[0.08] text-white/50",
              )}
            >
              {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <span className="font-bold text-white text-sm truncate block">
                {e.name}
                {e.you && (
                  <span className="ml-1.5 text-[9px] font-black text-emerald-400 bg-emerald-400/15 rounded px-1 py-0.5">
                    YOU
                  </span>
                )}
                {e.friend && !e.you && (
                  <span className="ml-1 text-sky-400 text-[10px]">★</span>
                )}
              </span>
            </div>

            {/* Score */}
            <div className="font-black text-white tabular-nums text-sm shrink-0">{e.score.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}

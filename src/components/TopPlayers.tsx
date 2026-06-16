import { useEffect, useState } from "react";
import { subscribeToLeaderboard, type LeaderboardServiceEntry } from "../game/leaderboard";
import type { SaveData } from "../game/storage";

interface Props {
  save: SaveData;
  limit?: number;
  variant?: "default" | "compact" | "mini";
  className?: string;
}

const MEDALS = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

export default function TopPlayers({ save, limit = 5, variant = "default", className = "" }: Props) {
  const [entries, setEntries] = useState<LeaderboardServiceEntry[]>([]);

  useEffect(() => {
    const unsub = subscribeToLeaderboard("daily", save.playerName, save.stats.bestScore, false, (list) => {
      const top = list.slice(0, limit);
      if (top.length > 0) setEntries(top);
    });
    return unsub;
  }, [save.playerName, save.stats.bestScore, limit]);

  if (entries.length === 0) return null;

  if (variant === "mini") {
    return (
      <div className={"rounded-lg bg-black/35 backdrop-blur-sm border border-white/[0.06] px-2 py-1 " + className}>
        <div className="text-[8px] font-bold text-white/30 uppercase tracking-wider mb-0.5">🏆 Top</div>
        {entries.map((e, i) => (
          <div key={e.uid || i} className="flex items-center gap-1 text-[9px] leading-tight">
            <span className="shrink-0">{MEDALS[i]}</span>
            <span className="font-semibold text-white/70 truncate max-w-[60px]">{e.name}</span>
            <span className="ml-auto tabular-nums text-white/40">{e.score.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={"rounded-2xl bg-white/[0.04] border border-white/[0.07] px-3 py-2.5 " + className}>
        <div className="text-[9px] font-bold text-white/30 uppercase tracking-wider mb-1.5">🏆 Leaderboard</div>
        {entries.map((e, i) => (
          <div key={e.uid || i} className="flex items-center gap-1.5 py-0.5 text-[11px]">
            <span className="shrink-0 text-xs">{MEDALS[i]}</span>
            <span className="font-semibold text-white/80 truncate">{e.name}</span>
            <span className="ml-auto tabular-nums text-white/40">{e.score.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={"rounded-2xl bg-white/[0.06] border border-white/[0.08] p-3 " + className}>
      <h3 className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-2">🏆 Top Players</h3>
      {entries.map((e, i) => (
        <div key={e.uid || i} className="flex items-center gap-2 py-1">
          <span className="shrink-0 text-sm">{MEDALS[i]}</span>
          <span className="font-bold text-white text-sm truncate">{e.name}</span>
          <span className="ml-auto font-bold text-white/60 tabular-nums text-sm">{e.score.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

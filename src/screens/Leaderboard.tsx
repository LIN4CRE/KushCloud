import { useEffect, useState } from "react";
import { type SaveData } from "../game/storage";
import { getLocalLeaderboard, type LbEntry } from "../game/leaderboard";
import { Panel, ScreenShell } from "../ui";

interface Props {
  save: SaveData;
  onBack: () => void;
}

export default function Leaderboard({ save, onBack }: Props) {
  const [entries, setEntries] = useState<LbEntry[]>([]);

  useEffect(() => {
    setEntries(getLocalLeaderboard());
  }, []);

  const playerRank = entries.findIndex((e) => e.name === save.playerName && e.score === save.stats.bestScore) + 1;
  const topEntries = entries.slice(0, 50);

  return (
    <ScreenShell title="Leaderboard" onBack={onBack}>
      {save.stats.bestScore > 0 && (
        <Panel className="mb-4 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Your Rank</p>
          <p className="text-2xl font-bold text-emerald-400">
            #{playerRank > 0 ? playerRank : entries.length + 1}
          </p>
          <p className="text-sm text-slate-300">{save.playerName} — {save.stats.bestScore}</p>
        </Panel>
      )}

      <div className="space-y-1">
        {topEntries.length === 0 && (
          <p className="text-center text-sm text-slate-500 py-8">
            No scores yet. Play a game to set the first record!
          </p>
        )}
        {topEntries.map((entry, i) => {
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
          const isPlayer = entry.name === save.playerName;
          return (
            <div
              key={`${entry.name}-${entry.score}-${entry.date}`}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
                isPlayer ? "bg-emerald-900/30 border border-emerald-700/40" : "bg-slate-800/30"
              }`}
            >
              <span className="w-8 text-center text-sm font-bold text-slate-400">{medal}</span>
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-bold truncate block ${isPlayer ? "text-emerald-300" : "text-white"}`}>
                  {entry.name}
                </span>
              </div>
              <span className="text-sm font-bold text-white">{entry.score.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </ScreenShell>
  );
}

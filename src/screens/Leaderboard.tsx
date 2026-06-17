import { useState, useEffect, useCallback, useRef } from "react";
import { SaveData } from "../game/storage";
import { ScreenShell, Tabs, cx, Shimmer, Button, showToast } from "../ui";
import { subscribeToLeaderboard, submitPlayerScore, type LeaderboardServiceEntry, copyBragToClipboard, encodeScoreLink, getFriendScores } from "../game/leaderboard";

interface Props {
  save: SaveData;
  onBack: () => void;
}

export default function Leaderboard({ save, onBack }: Props) {
  const [period, setPeriod] = useState<"daily" | "weekly" | "all">("daily");
  const [friends, setFriends] = useState(false);
  const [list, setList] = useState<LeaderboardServiceEntry[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const prevPeriodRef = useRef(period);
  const prevBestRef = useRef(save.stats.bestScore);
  const scoreRef = useRef(save.stats.bestScore);
  const nameRef = useRef(save.playerName);
  const subscribeKeyRef = useRef(0);
  const [subscribeKey, setSubscribeKey] = useState(0);
  scoreRef.current = save.stats.bestScore;
  nameRef.current = save.playerName;

  useEffect(() => {
    setIsOnline(navigator.onLine);
    setLoading(true);
    const unsubscribe = subscribeToLeaderboard(
      period, nameRef.current, scoreRef.current, friends,
      (entries) => {
        // Merge URL-imported friend scores (no Firebase needed)
        const importedFriends = getFriendScores().filter(f => !entries.some(e => e.name === f.name));
        const merged = [...entries, ...importedFriends].sort((a, b) => b.score - a.score).slice(0, 50);
        setList(merged);
        setLoading(false);
        setLastUpdated(new Date());
      },
    );
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
    };
  }, [period, friends, subscribeKey]);

  // Re-subscribe when tab becomes visible (ensures fresh data after background)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setIsOnline(navigator.onLine);
        subscribeKeyRef.current += 1;
        setSubscribeKey(subscribeKeyRef.current);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const periodChanged = prevPeriodRef.current !== period;
    const newBest = save.stats.bestScore > prevBestRef.current;
    if (save.stats.bestScore > 0 && isOnline && (periodChanged || newBest || !submitted)) {
      submitPlayerScore(save.playerName, save.stats.bestScore, period).then(() => {
        setSubmitted(true);
      }).catch(() => {
        console.warn("Failed to submit score to server");
      });
    }
    prevPeriodRef.current = period;
    prevBestRef.current = save.stats.bestScore;
  }, [period, save.stats.bestScore, save.playerName, isOnline, submitted]);

  const handleRetry = useCallback(() => {
    if (!isOnline) return;
    setLoading(true);
    submitPlayerScore(nameRef.current, scoreRef.current, period).catch(() => {});
    const unsub = subscribeToLeaderboard(
      period, nameRef.current, scoreRef.current, friends, (entries) => {
        setList(entries);
        setLoading(false);
        setLastUpdated(new Date());
        unsub();
      },
    );
  }, [period, friends, isOnline]);

  const myEntry = list.find((e) => e.you);
  const myRank = myEntry ? list.indexOf(myEntry) + 1 : null;
  const totalPlayers = list.length;

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
          onChange={(k) => {
            setSubmitted(false);
            setPeriod(k as "daily" | "weekly" | "all");
          }}
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

      {/* Player stats bar */}
      {myEntry && !loading && (
        <div className="mb-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-center">
              <div className="text-lg font-black text-emerald-400 tabular-nums">#{myRank}</div>
              <div className="text-[9px] font-black uppercase tracking-wider text-emerald-400/50">Your Rank</div>
            </div>
            <div className="flex-1 rounded-xl bg-white/7 border border-white/10 px-3 py-2 text-center">
              <div className="text-lg font-black text-white tabular-nums">{totalPlayers}</div>
              <div className="text-[9px] font-black uppercase tracking-wider text-white/40">Players</div>
            </div>
            <div className="flex-1 rounded-xl bg-white/7 border border-white/10 px-3 py-2 text-center">
              <div className="text-lg font-black text-white tabular-nums">{myEntry.score.toLocaleString()}</div>
              <div className="text-[9px] font-black uppercase tracking-wider text-white/40">Best Score</div>
            </div>
          </div>
          <Button
            variant="gold"
            size="sm"
            className="w-full shadow-[0_4px_0_#92400e]"
            onClick={async () => {
              const success = await copyBragToClipboard(period, save.playerName, myEntry.score, myRank!);
              if (success) {
                showToast("Brag copied to clipboard! 🏆", "success");
              } else {
                showToast("Failed to copy brag.", "error");
              }
            }}
          >
            Brag about this score! 🏆
          </Button>
          <Button
            variant="dark"
            size="sm"
            className="w-full"
            onClick={() => {
              const link = encodeScoreLink(save.playerName, myEntry.score, "🌿");
              navigator.clipboard?.writeText(link).then(() => {
                showToast("Share link copied! 📋", "success");
              }).catch(() => {
                showToast("Could not copy link.", "error");
              });
            }}
          >
            Share Score Link 📋
          </Button>
        </div>
      )}

      {/* Validation notice */}
      <div className="flex items-center gap-2 rounded-xl bg-emerald-500/8 border border-emerald-400/15 px-3 py-2 mb-3">
        <span className="text-sm">🔒</span>
        <span className="text-[10px] font-semibold text-emerald-300/70">
          Scores are server-validated. Cheats are rejected.
        </span>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-1.5" role="status" aria-label="Loading leaderboard">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl px-3.5 py-3 bg-white/[0.05] border border-white/[0.06]">
              <Shimmer className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Shimmer className="h-4 w-28 mb-1" />
              </div>
              <Shimmer className="h-4 w-14" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && list.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-white/40">
          <span className="text-4xl">🏆</span>
          <p className="text-sm font-bold">No scores yet</p>
          <p className="text-xs">Play a game to be the first!</p>
          {!isOnline && (
            <p className="text-xs text-amber-400/60 mt-1">
              You appear offline. Scores will sync when connected.
            </p>
          )}
        </div>
      )}

      {/* Offline notice */}
      {!isOnline && list.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-400/20 px-3 py-2 mb-3">
          <span className="text-sm">📡</span>
          <span className="text-[10px] font-semibold text-amber-300/70">
            Offline — showing cached scores
          </span>
        </div>
      )}

      {/* Rankings */}
      {!loading && list.length > 0 && (
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
                  e.you && i >= 3 && "bg-emerald-500/20 text-emerald-300",
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
      )}

      {/* Refresh indicator */}
      {lastUpdated && !loading && list.length > 0 && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[9px] text-white/30">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRetry}
            disabled={!isOnline}
            className="text-[9px] font-bold text-white/30 hover:text-white/50 transition-colors disabled:opacity-30"
          >
            ↻ Refresh
          </button>
        </div>
      )}
    </ScreenShell>
  );
}

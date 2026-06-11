import { useState, useEffect } from "react";
import { SaveData } from "../game/storage";
import { ScreenShell, Button, Panel, ProgressBar } from "../ui";
import { subscribeFriends, addFriend, removeFriend, findUser, getUID } from "../game/leaderboard";
import { UserProfile } from "../config/firebase";
import { audio } from "../game/audio";

interface Props {
  save: SaveData;
  onBack: () => void;
}

export default function Friends({ onBack }: Props) {
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState<UserProfile | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeFriends(async (uids) => {
      const profiles = await Promise.all(uids.map(uid => findUser(uid)));
      setFriends(profiles.filter(p => p !== null) as UserProfile[]);
    });
    return unsub;
  }, []);

  const handleSearch = async () => {
    if (!searchId.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const user = await findUser(searchId.trim());
      if (user) {
        setSearchResult(user);
      } else {
        setError("User not found. Check the UID and try again.");
        setSearchResult(null);
      }
    } catch (err) {
      setError("An error occurred during search.");
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (uid: string) => {
    audio.reward();
    await addFriend(uid);
    setSearchResult(null);
    setSearchId("");
  };

  const handleRemove = async (uid: string) => {
    if (confirm("Remove friend?")) {
      await removeFriend(uid);
    }
  };

  return (
    <ScreenShell title="Friends" onBack={onBack}>
      <div className="space-y-6">
        {/* Search Section */}
        <Panel>
          <div className="p-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-white/35 mb-3">Add Friend by UID</h2>
            <div className="flex gap-2">
              <input
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter User ID..."
                className="flex-1 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-emerald-500/50 transition-colors"
              />
              <Button size="sm" onClick={handleSearch} disabled={searching}>
                {searching ? "..." : "Search"}
              </Button>
            </div>

            {error && <p className="mt-2 text-[10px] font-semibold text-rose-400">{error}</p>}

            {searchResult && (
              <div className="mt-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] p-3 animate-[pop_0.3s_ease-out]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-xl border border-emerald-500/30">🌿</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{searchResult.name}</div>
                    <div className="text-[10px] text-white/40">Level {searchResult.level}</div>
                  </div>
                  <Button size="sm" variant="gold" onClick={() => handleAdd(searchResult.uid)}>
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Panel>

        {/* Friends List */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-white/35 px-1">Your Buds ({friends.length})</h2>

          {friends.length === 0 ? (
            <div className="text-center py-12 rounded-3xl bg-white/[0.03] border border-dashed border-white/10">
              <div className="text-3xl mb-2 opacity-50">👥</div>
              <p className="text-sm font-medium text-white/30">No friends yet. Add some buds!</p>
              <div className="mt-4 flex flex-col items-center gap-1">
                <p className="text-[9px] uppercase font-black text-white/20 tracking-tighter">Your User ID:</p>
                <code className="text-[10px] font-mono text-emerald-400/60 bg-black/40 px-2 py-1 rounded-lg border border-white/5 select-all">{getUID()}</code>
              </div>
            </div>
          ) : (
            friends.map(friend => (
              <Panel key={friend.uid}>
                <div className="p-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xl shadow-lg border border-white/10">🌿</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">{friend.name}</div>
                      <div className="text-[10px] text-emerald-400 font-bold">Level {friend.level}</div>
                    </div>
                    <button
                      onClick={() => handleRemove(friend.uid)}
                      className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center hover:bg-rose-500/20 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="rounded-xl bg-black/30 p-2 text-center border border-white/5">
                      <div className="text-xs font-black text-white">{friend.bestScore}</div>
                      <div className="text-[8px] uppercase font-bold text-white/30">Best Score</div>
                    </div>
                    <div className="rounded-xl bg-black/30 p-2 text-center border border-white/5">
                      <div className="text-xs font-black text-amber-300">{friend.totalCoins.toLocaleString()}</div>
                      <div className="text-[8px] uppercase font-bold text-white/30">Kush Coins</div>
                    </div>
                  </div>
                  <ProgressBar value={friend.xp % 1000} max={1000} />
                </div>
              </Panel>
            ))
          )}
        </div>

        {/* Share your ID */}
        <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-4 text-center">
          <p className="text-[10px] font-black uppercase text-emerald-400/60 mb-2 tracking-widest">Share your User ID</p>
          <div className="flex items-center gap-2 bg-black/40 rounded-xl p-2 border border-white/5">
            <code className="flex-1 text-[11px] font-mono text-white/70 truncate select-all">{getUID()}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(getUID());
                audio.click();
              }}
              className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-400/10 px-2 py-1 rounded-lg hover:bg-emerald-400/20 transition-all"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}

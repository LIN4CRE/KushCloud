import { useState, useEffect } from "react";
import { SaveData } from "../game/storage";
import { SKINS, TRAILS, levelFromXp } from "../game/data";
import { ScreenShell, Stat, ProgressBar, Button, Panel } from "../ui";
import { loadUserProfile, getUID } from "../game/leaderboard";

interface Props {
  save: SaveData;
  onBack: () => void;
}

interface UserProfile {
  uid: string;
  name: string;
  bestScore: number;
  totalGames: number;
  totalCoins: number;
  level: number;
  xp: number;
  createdAt: number;
  updatedAt: number;
}

export default function Statistics({ save, onBack }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userProfile = await loadUserProfile();
        setProfile(userProfile);
      } catch (error) {
        console.warn("Failed to load user profile from server:", error);
        setIsOnline(false);
      }
    };

    loadProfile();

    const handleOnline = () => {
      setIsOnline(true);
      loadProfile();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const lvl = levelFromXp(save.xp);
  const profileData = profile || ({} as UserProfile);

  return (
    <ScreenShell
      title="Statistics"
      onBack={onBack}
      right={
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-black ${isOnline ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/50"}` }>
            {isOnline ? "🟢 Online" : "🟡 Offline"}
          </span>
        </div>
      }
    >
      <div className="space-y-6">
        <Panel>
          <div className="p-5">
            <h2 className="text-lg font-black text-white mb-4">Account</h2>
            <div className="flex items-center gap-4 mb-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl shrink-0 shadow-lg"
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${save.equippedSkin ? SKINS.find(s => s.id === save.equippedSkin)?.body || '#5fbf5f' : '#5fbf5f'}, ${save.equippedSkin ? SKINS.find(s => s.id === save.equippedSkin)?.accent || '#3d8b3d' : '#3d8b3d'})`,
                  boxShadow: `0 0 20px ${save.equippedSkin ? SKINS.find(s => s.id === save.equippedSkin)?.accent || '#3d8b3d' : '#3d8b3d'}50`,
                }}
              >
                {save.equippedSkin ? SKINS.find(s => s.id === save.equippedSkin)?.emoji || '🌿' : '🌿'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-white truncate mb-1">
                  {save.playerName}
                </div>
                <div className="text-xs font-semibold text-emerald-400 mb-2">Level {lvl.level}</div>
                <ProgressBar value={lvl.into} max={lvl.need} />
                <div className="mt-1.5 text-[10px] font-semibold text-white/35 tabular-nums">
                  {lvl.into} / {lvl.need} XP to next level
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat icon="👤" label="UID" value={getUID().slice(0, 12) + "..."} />
              <Stat icon="🏗" label="Account Created" value={profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : "N/A"} />
              <Stat icon="🔄" label="Last Updated" value={profileData.updatedAt ? new Date(profileData.updatedAt).toLocaleTimeString() : "N/A"} />
              <Stat icon="⭐" label="Server Level" value={profileData.level || lvl.level} />
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="p-5">
            <h2 className="text-lg font-black text-white mb-4">Performance Stats</h2>
            <div className="grid grid-cols-3 gap-3">
              <Stat icon="🏆" label="Best Score" value={save.stats.bestScore} />
              <Stat icon="🎮" label="Games Played" value={save.stats.totalGames} />
              <Stat icon="🪙" label="Total Coins" value={save.stats.totalCoins.toLocaleString()} />
              <Stat icon="✨" label="Perfect Pass" value={save.stats.totalPerfectPasses || 0} />
              <Stat icon="🎯" label="Near Misses" value={save.stats.totalNearMiss} />
              <Stat icon="🔥" label="Best Combo" value={`x${save.stats.bestCombo}`} />
              <Stat icon="🪽" label="Flaps" value={save.stats.totalFlaps.toLocaleString()} />
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="p-5">
            <h2 className="text-lg font-black text-white mb-4">Progress</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-white/50 mb-2">
                  <span>XP Progress</span>
                  <span className="text-emerald-400">{save.xp.toLocaleString()} XP</span>
                </div>
                <ProgressBar value={lvl.into} max={lvl.need} />
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-white/50 mb-2">
                  <span>Coins Progress</span>
                  <span className="text-amber-400">{save.coins.toLocaleString()} Coins</span>
                </div>
                <ProgressBar value={Math.min(save.coins, 1000)} max={1000} />
              </div>
              {profile && (
                <div>
                  <div className="flex justify-between text-xs font-semibold text-white/50 mb-2">
                    <span>Server XP</span>
                    <span className="text-emerald-400">{profile.xp.toLocaleString()} XP</span>
                  </div>
                  <ProgressBar value={profile.xp} max={profile.xp + 1000} />
                </div>
              )}
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="p-5">
            <h2 className="text-lg font-black text-white mb-4">Skins & Trails</h2>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold text-white/50 mb-2">Equipped Skin</div>
                <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] border border-white/[0.08] p-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-xl shrink-0"
                    style={{
                      background: `radial-gradient(circle at 35% 30%, ${save.equippedSkin ? SKINS.find(s => s.id === save.equippedSkin)?.body || '#5fbf5f' : '#5fbf5f'}, ${save.equippedSkin ? SKINS.find(s => s.id === save.equippedSkin)?.accent || '#3d8b3d' : '#3d8b3d'})`,
                    }}
                  >
                    {save.equippedSkin ? SKINS.find(s => s.id === save.equippedSkin)?.emoji || '🌿' : '🌿'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-black text-white">{save.equippedSkin ? SKINS.find(s => s.id === save.equippedSkin)?.name || 'Buddy' : 'Buddy'}</div>
                    <div className="text-[10px] font-medium text-white/40 mt-0.5">{save.equippedSkin ? SKINS.find(s => s.id === save.equippedSkin)?.desc || 'The classic floating bud.' : 'The classic floating bud.'}</div>
                  </div>
                  <div className="text-xs font-semibold text-emerald-400">Equipped</div>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-white/50 mb-2">Equipped Trail</div>
                <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] border border-white/[0.08] p-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-xl shrink-0"
                    style={{ backgroundColor: save.equippedTrail ? TRAILS.find(t => t.id === save.equippedTrail)?.color || '#ffffff' : '#ffffff' }}
                  >
                    💨
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-black text-white">{save.equippedTrail ? TRAILS.find(t => t.id === save.equippedTrail)?.name || 'No Trail' : 'No Trail'}</div>
                    <div className="text-[10px] font-medium text-white/40 mt-0.5">{save.equippedTrail ? TRAILS.find(t => t.id === save.equippedTrail)?.desc || 'Clean and simple.' : 'Clean and simple.'}</div>
                  </div>
                  <div className="text-xs font-semibold text-emerald-400">Equipped</div>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="p-5">
            <h2 className="text-lg font-black text-white mb-4">Activity</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                <span className="text-sm font-semibold text-white/70">Recent Runs</span>
                <span className="text-sm font-black text-white">{save.scoreHistory.length} games</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                <span className="text-sm font-semibold text-white/70">Score History</span>
                <span className="text-sm font-black text-white">{save.scoreHistory.length > 0 ? save.scoreHistory[save.scoreHistory.length - 1].toLocaleString() : 0}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                <span className="text-sm font-semibold text-white/70">Coins Banked Today</span>
                <span className="text-sm font-black text-amber-400">+{save.dailyCoins.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-semibold text-white/70">Games Today</span>
                <span className="text-sm font-black text-white">{save.dailyPlays}</span>
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="p-5">
            <h2 className="text-lg font-black text-white mb-4">Server Sync</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                <span className="text-sm font-semibold text-white/70">Sync Status</span>
                <span className={`text-sm font-black ${isOnline ? "text-emerald-400" : "text-white/50"}` }>
                  {isOnline ? "✅ Synced" : "❌ Offline"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                <span className="text-sm font-semibold text-white/70">Last Sync</span>
                <span className="text-sm font-black text-white">{new Date(save.lastSync).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-semibold text-white/70">Profile ID</span>
                <span className="text-[10px] font-mono text-white/40">{getUID()}</span>
              </div>
            </div>
            <div className="mt-4">
              <Button
                variant="dark"
                className="w-full"
                onClick={() => {
                  try {
                    const syncData = {
                      ...save,
                      lastSync: Date.now(),
                    };
                    localStorage.setItem("kushcloud_save_v1", JSON.stringify(syncData));
                    alert("Progress synced locally!");
                  } catch {
                    alert("Failed to sync — storage may be full.");
                  }
                }}
              >
                💾 Sync Now
              </Button>
            </div>
          </div>
        </Panel>
      </div>
    </ScreenShell>
  );
}
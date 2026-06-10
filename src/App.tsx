import { useEffect, useState } from "react";
import { useSave } from "./store";
import { audio } from "./game/audio";
import { RunResult } from "./game/engine";
import {
  SKINS, TRAILS, ACHIEVEMENTS, levelFromXp, LOGIN_REWARDS, getDailyMissions,
} from "./game/data";
import {
  validateRun, dayNumber, randomName, DEFAULT_STATS, getRank,
} from "./game/storage";
import Menu from "./screens/Menu";
import Play, { RunSummary } from "./screens/Play";
import Shop from "./screens/Shop";
import Leaderboard from "./screens/Leaderboard";
import Achievements from "./screens/Achievements";
import Missions from "./screens/Missions";
import Profile from "./screens/Profile";
import Statistics from "./screens/Statistics";
import Settings from "./screens/Settings";
import Tutorial from "./screens/Tutorial";

export type Screen =
  | "menu" | "play" | "shop" | "leaderboard"
  | "achievements" | "missions" | "profile" | "statistics" | "settings" | "tutorial";

export default function App() {
  const { save, update } = useSave();
  const [screen, setScreen] = useState<Screen>(save.seenTutorial ? "menu" : "tutorial");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    audio.reward();
    window.setTimeout(() => setToast(null), 2400);
  };

  // Error handling
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Application error:", event.error);
      setError(event.error?.message || "An unknown error occurred");
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950 p-4">
        <div className="max-w-md rounded-3xl bg-red-900/20 border border-red-500/30 p-6 text-center">
          <h2 className="text-xl font-black text-white mb-4">⚠️ Application Error</h2>
          <p className="text-white/70 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-red-500/20 border border-red-400/30 px-4 py-2 text-white hover:bg-red-500/30 transition-colors"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    audio.setMusicVol(save.musicVol);
    audio.setSfxVol(save.sfxVol);
    const start = () => {
      audio.resume();
      if (save.musicVol > 0) audio.startMusic();
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
    window.addEventListener("pointerdown", start);
    window.addEventListener("keydown", start);
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    audio.setMusicVol(save.musicVol);
    audio.setSfxVol(save.sfxVol);
    if (save.musicVol === 0) audio.stopMusic();
    else if (audio.isStarted) audio.startMusic();
  }, [save.musicVol, save.sfxVol]);

  const processRun = async (r: RunResult): Promise<RunSummary> => {
    try {
      const check = validateRun(r.score, r.durationMs, r.flaps, r.coins);
      const week = Math.floor(Date.now() / (86400000 * 7));
      const coinBoost = week % 3 === 0 ? 1.5 : 1;
      const xpBoost = week % 3 === 1 ? 1.3 : 1;

      const beforeLevel = levelFromXp(save.xp).level;
      let coinsGained = 0;
      let xpGained = 0;
      let newBest = false;
      const newAch: string[] = [];
      const newMissions: string[] = [];

      if (check.valid) {
        coinsGained = Math.round(r.coins * 10 * coinBoost) + r.score * 2;
        xpGained = Math.round((r.score * 10 + r.coins * 5 + r.nearMiss * 8 + 5) * xpBoost);
      }

      const projectedXp = save.xp + xpGained;
      const targetLevel = levelFromXp(projectedXp).level;
      const leveledUp: number[] = [];
      let levelUpCoins = 0;
      for (let l = beforeLevel + 1; l <= targetLevel; l++) {
        leveledUp.push(l);
        levelUpCoins += l * 5;
      }

      await new Promise<void>((resolve) => {
        update((s) => {
          s.stats.totalGames += 1;
          s.stats.totalFlaps += r.flaps;
          if (check.valid) {
            s.stats.totalScore += r.score;
            s.stats.totalCoins += coinsGained;
            s.stats.totalNearMiss += r.nearMiss;
            s.stats.bestCombo = Math.max(s.stats.bestCombo, r.bestCombo);
            if (r.score > s.stats.bestScore) {
              s.stats.bestScore = r.score;
              newBest = true;
            }
            s.coins += coinsGained + levelUpCoins;
            s.xp += xpGained;
            s.scoreHistory.push(r.score);
            if (s.scoreHistory.length > 100) s.scoreHistory = s.scoreHistory.slice(-100);
            s.dailyPlays += 1;
            s.dailyCoins += r.coins;
          }

          const todays = getDailyMissions(dayNumber());
          for (const m of todays) {
            let prog = s.missions.find((p) => p.id === m.id);
            if (!prog) {
              prog = { id: m.id, progress: 0, claimed: false };
              s.missions.push(prog);
            }
            let v = prog.progress;
            if (m.metric === "runScore") v = Math.max(v, r.score);
            else if (m.metric === "runCoins") v = Math.max(v, r.coins);
            else if (m.metric === "runNearMiss") v = Math.max(v, r.nearMiss);
            else if (m.metric === "plays") v = s.dailyPlays;
            else if (m.metric === "totalCoins") v = s.dailyCoins;
            const wasComplete = prog.progress >= m.goal;
            prog.progress = v;
            if (!wasComplete && v >= m.goal) newMissions.push(m.text);
          }

          for (const a of ACHIEVEMENTS) {
            if (s.unlockedAchievements.includes(a.id)) continue;
            const val = a.stat === "score" ? s.stats.bestScore : (s.stats as any)[a.stat] ?? 0;
            if (val >= a.goal) {
              s.unlockedAchievements.push(a.id);
              newAch.push(a.name);
            }
          }
        });
        resolve();
      });

      const rank = await getRank("daily", Math.max(r.score, save.stats.bestScore));

      return {
        xpGained,
        coinsGained,
        levelUpCoins,
        newBest,
        leveledUp,
        achievements: newAch,
        missions: newMissions,
        valid: check.valid,
        rank,
      };
    } catch (error) {
      console.error("Error processing run:", error);
      throw error;
    }
  };

  const buySkin = (id: string) => {
    const skin = SKINS.find((s) => s.id === id);
    if (!skin || save.coins < skin.cost || save.ownedSkins.includes(id)) return;
    update((s) => {
      s.coins -= skin.cost;
      s.ownedSkins.push(id);
      s.equippedSkin = id;
    });
    showToast(`Unlocked ${skin.name}! 🎉`);
  };
  const buyTrail = (id: string) => {
    const tr = TRAILS.find((t) => t.id === id);
    if (!tr || save.coins < tr.cost || save.ownedTrails.includes(id)) return;
    update((s) => {
      s.coins -= tr.cost;
      s.ownedTrails.push(id);
      s.equippedTrail = id;
    });
    showToast(`Unlocked ${tr.name}! 🎉`);
  };

  const claimAchievement = (id: string) => {
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (!a || save.claimedAchievements.includes(id) || !save.unlockedAchievements.includes(id)) return;
    update((s) => {
      s.claimedAchievements.push(id);
      s.coins += a.reward;
    });
    showToast(`+${a.reward} 🪙 from ${a.name}!`);
  };

  const claimMission = (id: string) => {
    const todays = getDailyMissions(dayNumber());
    const m = todays.find((x) => x.id === id);
    const prog = save.missions.find((p) => p.id === id);
    if (!m || !prog || prog.claimed || prog.progress < m.goal) return;
    update((s) => {
      const p = s.missions.find((x) => x.id === id)!;
      p.claimed = true;
      s.coins += m.reward;
    });
    showToast(`Mission done! +${m.reward} 🪙`);
  };

  const claimLogin = () => {
    if (save.loginClaimedToday) return;
    const idx = Math.min(save.loginStreak, LOGIN_REWARDS.length) - 1;
    const reward = LOGIN_REWARDS[Math.max(0, idx)];
    update((s) => {
      s.loginClaimedToday = true;
      s.coins += reward;
    });
    showToast(`Daily reward: +${reward} 🪙`);
  };

  const resetProgress = () => {
    if (!confirm("Reset ALL progress? This cannot be undone.")) return;
    update((s) => {
      s.coins = 0;
      s.xp = 0;
      s.stats = { ...DEFAULT_STATS };
      s.ownedSkins = ["bud"];
      s.ownedTrails = ["none"];
      s.equippedSkin = "bud";
      s.equippedTrail = "none";
      s.unlockedAchievements = [];
      s.claimedAchievements = [];
      s.scoreHistory = [];
      s.missions = [];
      s.loginStreak = 0;
      s.loginClaimedToday = false;
      s.playerName = randomName();
      s.seenTutorial = true;
    });
    showToast("Progress reset.");
    setScreen("menu");
  };

  const loginAvailable = !save.loginClaimedToday;
  const claimedMissions = save.missions.filter((m) => m.claimed).length;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950 overflow-hidden">
      {/* Subtle ambient glow behind the card */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[420px] rounded-full bg-emerald-900/30 blur-[80px]" />
      </div>

      <div className="relative mx-auto h-full w-full max-w-md overflow-hidden bg-gradient-to-b from-slate-900 via-emerald-950/60 to-slate-950 shadow-[0_0_80px_rgba(0,0,0,0.8)]">
        {/* Subtle top gradient shine */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />

        {screen === "menu" && (
          <Menu
            save={save}
            onPlay={() => setScreen("play")}
            onNav={setScreen}
            missionsDone={claimedMissions}
            missionsTotal={3}
            loginAvailable={loginAvailable}
          />
        )}
        {screen === "play" && (
          <Play save={save} onExit={() => setScreen("menu")} processRun={processRun} />
        )}
        {screen === "shop" && (
          <Shop
            save={save}
            onBack={() => setScreen("menu")}
            onBuySkin={buySkin}
            onBuyTrail={buyTrail}
            onEquipSkin={(id) => update((s) => { s.equippedSkin = id; })}
            onEquipTrail={(id) => update((s) => { s.equippedTrail = id; })}
          />
        )}
        {screen === "leaderboard" && <Leaderboard save={save} onBack={() => setScreen("menu")} />}
        {screen === "achievements" && (
          <Achievements save={save} onBack={() => setScreen("menu")} onClaim={claimAchievement} />
        )}
        {screen === "missions" && (
          <Missions
            save={save}
            onBack={() => setScreen("menu")}
            onClaimMission={claimMission}
            onClaimLogin={claimLogin}
            loginAvailable={loginAvailable}
          />
        )}
        {screen === "profile" && (
          <Profile
            save={save}
            onBack={() => setScreen("menu")}
            onRename={(name) => update((s) => { s.playerName = name || randomName(); })}
          />
        )}
        {screen === "statistics" && (
          <Statistics save={save} onBack={() => setScreen("menu")} />
        )}
        {screen === "settings" && (
          <Settings
            save={save}
            onBack={() => setScreen("menu")}
            onChange={(patch) => update((s) => Object.assign(s, patch))}
            onReset={resetProgress}
          />
        )}
        {screen === "tutorial" && (
          <Tutorial
            firstTime={!save.seenTutorial}
            onDone={() => {
              if (!save.seenTutorial) update((s) => { s.seenTutorial = true; });
              setScreen("menu");
            }}
          />
        )}

        {/* Toast */}
        {toast && (
          <div className="pointer-events-none absolute left-1/2 top-16 z-50 -translate-x-1/2 animate-[slide-up_0.3s_ease-out]">
            <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(0,0,0,0.5)] border border-white/20 backdrop-blur">
              {toast}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

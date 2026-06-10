import { useEffect, useState } from "react";
import { useSave } from "./store";
import { audio } from "./game/audio";
import { RunResult } from "./game/engine";
import {
  SKINS, TRAILS, TITLES, BADGES, EFFECTS, POWERUPS, LOOT_CRATES,
  ACHIEVEMENTS, levelFromXp, LOGIN_REWARDS, getDailyMissions, rollLootCrate,
  currentWeekIndex, WEEKLY_EVENTS, type LootCrate,
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
  const [lootCrateOpen, setLootCrateOpen] = useState<LootCrate | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    audio.reward();
    window.setTimeout(() => setToast(null), 2400);
  };

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
      const week = currentWeekIndex();
      const ev = WEEKLY_EVENTS[week % WEEKLY_EVENTS.length];
      const coinBoost = ev.coinBoost;
      const xpBoost = ev.xpBoost;

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
            let val = 0;
            if (a.stat === "score") val = s.stats.bestScore;
            else if (a.stat === "ownedSkins") val = s.ownedSkins.length;
            else if (a.stat === "ownedTrails") val = s.ownedTrails.length;
            else if (a.stat === "ownedEffects") val = s.ownedEffects.length;
            else if (a.stat === "ownedBadges") val = s.ownedBadges.length;
            else if (a.stat === "ownedTitles") val = s.ownedTitles.length;
            else val = (s.stats as any)[a.stat] ?? 0;
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
        xpGained, coinsGained, levelUpCoins, newBest, leveledUp,
        achievements: newAch, missions: newMissions, valid: check.valid, rank,
      };
    } catch (error) {
      console.error("Error processing run:", error);
      throw error;
    }
  };

  const buySkin = (id: string) => {
    const skin = SKINS.find((s) => s.id === id);
    if (!skin || save.coins < skin.cost || save.ownedSkins.includes(id)) return;
    audio.purchase();
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
    audio.purchase();
    update((s) => {
      s.coins -= tr.cost;
      s.ownedTrails.push(id);
      s.equippedTrail = id;
    });
    showToast(`Unlocked ${tr.name}! 🎉`);
  };

  const buyCrate = (crate: LootCrate) => {
    if (save.coins < crate.cost) return;
    audio.purchase();
    update((s) => {
      s.coins -= crate.cost;
      s.cratesOpened += 1;
    });
    setLootCrateOpen(crate);
  };

  const claimCrateDrops = (itemIds: string[], dust: number) => {
    update((s) => {
      for (const id of itemIds) {
        const skin = SKINS.find(x => x.id === id);
        if (skin && !s.ownedSkins.includes(id)) { s.ownedSkins.push(id); continue; }
        const trail = TRAILS.find(x => x.id === id);
        if (trail && !s.ownedTrails.includes(id)) { s.ownedTrails.push(id); continue; }
        const title = TITLES.find(x => x.id === id);
        if (title && !s.ownedTitles.includes(id)) { s.ownedTitles.push(id); continue; }
        const badge = BADGES.find(x => x.id === id);
        if (badge && !s.ownedBadges.includes(id)) { s.ownedBadges.push(id); continue; }
        const effect = EFFECTS.find(x => x.id === id);
        if (effect && !s.ownedEffects.includes(id)) { s.ownedEffects.push(id); continue; }
        s.dust += dust;
      }
      s.dust += dust;
    });
    const names = itemIds.map(id => {
      return [...SKINS, ...TRAILS, ...TITLES, ...BADGES, ...EFFECTS].find(x => x.id === id)?.name || id;
    });
    showToast(`Got: ${names.join(", ")}${dust > 0 ? ` +${dust} dust` : ""}`);
    setLootCrateOpen(null);
  };

  const buyPowerUp = (id: string) => {
    const p = POWERUPS.find(x => x.id === id);
    if (!p || save.coins < p.cost || save.ownedPowerUps.includes(id)) return;
    audio.purchase();
    update((s) => {
      s.coins -= p.cost;
      s.ownedPowerUps.push(id);
    });
    showToast(`Got ${p.name}! Use it in-game!`);
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
      s.coins = 0; s.xp = 0; s.dust = 0;
      s.stats = { ...DEFAULT_STATS };
      s.ownedSkins = ["bud"]; s.ownedTrails = ["none"]; s.ownedEffects = ["e_none"];
      s.ownedTitles = []; s.ownedBadges = []; s.ownedPowerUps = [];
      s.equippedSkin = "bud"; s.equippedTrail = "none"; s.equippedEffect = "e_none";
      s.equippedTitle = null; s.equippedBadge = null;
      s.unlockedAchievements = []; s.claimedAchievements = [];
      s.scoreHistory = []; s.missions = [];
      s.loginStreak = 0; s.loginClaimedToday = false;
      s.cratesOpened = 0; s.seenItems = {};
      s.playerName = randomName(); s.seenTutorial = true;
    });
    showToast("Progress reset.");
    setScreen("menu");
  };

  const loginAvailable = !save.loginClaimedToday;
  const claimedMissions = save.missions.filter((m) => m.claimed).length;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[420px] rounded-full bg-emerald-900/30 blur-[80px]" />
      </div>

      <div className="relative mx-auto h-full w-full max-w-md overflow-hidden bg-gradient-to-b from-slate-900 via-emerald-950/60 to-slate-950 shadow-[0_0_80px_rgba(0,0,0,0.8)]">
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
          <Play
            save={save}
            onExit={() => setScreen("menu")}
            processRun={processRun}
          />
        )}
        {screen === "shop" && (
          <Shop
            save={save}
            onBack={() => setScreen("menu")}
            onBuySkin={buySkin}
            onBuyTrail={buyTrail}
            onBuyCrate={buyCrate}
            onEquipSkin={(id) => { audio.equip(); update((s) => { s.equippedSkin = id; }); }}
            onEquipTrail={(id) => { audio.equip(); update((s) => { s.equippedTrail = id; }); }}
            onEquipTitle={(id) => { audio.equip(); update((s) => { s.equippedTitle = id; }); }}
            onEquipBadge={(id) => { audio.equip(); update((s) => { s.equippedBadge = id; }); }}
            onEquipEffect={(id) => { audio.equip(); update((s) => { s.equippedEffect = id; }); }}
            onBuyPowerUp={buyPowerUp}
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

        {/* Loot crate modal */}
        {lootCrateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="relative w-full max-w-sm animate-[scale-in_0.3s_ease-out]">
              <div className="rounded-3xl bg-gradient-to-b from-slate-800 to-slate-900 border border-white/[0.1] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                <CrateReveal
                  crate={lootCrateOpen}
                  onClaim={(itemIds, dust) => claimCrateDrops(itemIds, dust)}
                  onClose={() => setLootCrateOpen(null)}
                />
              </div>
            </div>
          </div>
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

function CrateReveal({ crate, onClaim, onClose }: {
  crate: LootCrate;
  onClaim: (itemIds: string[], dust: number) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"shake" | "reveal" | "done">("shake");
  const [drops, setDrops] = useState<Array<{ drop: any; type: string; icon: string }>>([]);
  const [dust, setDust] = useState(0);

  useEffect(() => {
    const result = rollLootCrate(crate);
    if (result.drops.length === 0) {
      onClaim([], 0);
      return;
    }
    const mapped = result.drops.map(drop => {
      let type = "Skin", icon = "🐦";
      if (TRAILS.find(t => t.id === drop.id)) { type = "Trail"; icon = "✨"; }
      else if (TITLES.find(t => t.id === drop.id)) { type = "Title"; icon = "📛"; }
      else if (BADGES.find(t => t.id === drop.id)) { type = "Badge"; icon = (drop as any).icon || "🏅"; }
      else if (EFFECTS.find(t => t.id === drop.id)) { type = "Effect"; icon = "🌈"; }
      else if (SKINS.find(t => t.id === drop.id)) { icon = (drop as any).emoji || "🐦"; }
      return { drop, type, icon };
    });
    setDrops(mapped);
    setDust(result.dust);
  }, [crate]);

  useEffect(() => {
    if (phase !== "shake") return;
    const t1 = setTimeout(() => audio.crateOpen(), 100);
    const t2 = setTimeout(() => {
      audio.rareDrop();
      setPhase("reveal");
    }, 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  if (phase === "shake") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="text-7xl animate-[crate-shake_0.4s_ease-in-out_infinite]">{crate.icon}</div>
        <div className="text-white/60 text-sm font-semibold animate-pulse">Opening {crate.name}...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <h2 className="text-xl font-black text-white">🎉 You Got!</h2>
      <div className="grid gap-3 w-full" style={{ gridTemplateColumns: drops.length > 1 ? "1fr 1fr" : "1fr" }}>
        {drops.map((d, i) => {
          const rarity = (d.drop as any).rarity as Rarity;
          const r = RARITY[rarity];
          return (
            <div
              key={i}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl animate-[reveal_0.5s_ease-out_forwards]"
              style={{
                background: r.bg,
                border: `1px solid ${r.border}`,
                boxShadow: `0 0 20px ${r.glow}`,
                animationDelay: `${i * 200}ms`,
                opacity: 0,
              }}
            >
              <div className={`text-3xl rarity-glow-${rarity}`}>{d.icon}</div>
              <div className="text-sm font-black text-white text-center">{(d.drop as any).name}</div>
              <span
                className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full"
                style={{ background: r.bg, border: `1px solid ${r.border}`, color: r.color }}
              >
                {r.label}
              </span>
              <div className="text-[9px] font-medium text-white/40">{d.type}</div>
            </div>
          );
        })}
      </div>
      {dust > 0 && <div className="text-sm text-white/60">+{dust} 💎 Dust</div>}
      <Button
        variant="gold"
        className="w-full mt-2"
        onClick={() => { audio.reward(); onClaim(drops.map(d => d.drop.id), dust); onClose(); }}
      >
        Claim & Continue
      </Button>
    </div>
  );
}

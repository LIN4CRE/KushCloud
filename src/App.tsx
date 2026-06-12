import { useEffect, useState } from "react";
import { useSave, type Screen } from "./store";
import { audio } from "./game/audio";
import { env } from "./config/env";
import { useUpdateChecker } from "./hooks/useUpdateChecker";
import {
  SKINS, TRAILS, TITLES, BADGES, EFFECTS, type LootCrate, type LootDrop, type Skin, type Badge,
} from "./game/data";
import type { SaveData } from "./game/storage";
import Menu from "./screens/Menu";
import Play from "./screens/Play";
import Shop from "./screens/Shop";
import Leaderboard from "./screens/Leaderboard";
import Achievements from "./screens/Achievements";
import Missions from "./screens/Missions";
import Profile from "./screens/Profile";
import Statistics from "./screens/Statistics";
import Settings from "./screens/Settings";
import Tutorial from "./screens/Tutorial";
import Friends from "./screens/Friends";
import Chat from "./screens/Chat";
import { Button, ToastContainer } from "./ui";
import { loginWithGoogle, logout } from "./config/firebase";

import { useShopHandlers } from "./hooks/useShopHandlers";
import { useGameHandlers } from "./hooks/useGameHandlers";
import { useAudio } from "./hooks/useAudio";

export default function App() {
  const { save, update, user, syncStatus } = useSave();
  const [screen, setScreen] = useState<Screen>(save.seenTutorial ? "menu" : "tutorial");
  const [lootCrateOpen, setLootCrateOpen] = useState<LootCrate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const updateCtx = useUpdateChecker(env.app.version);

  const {
    buySkin, buyTrail, buyCrate, claimCrateDrops, buyPowerUp, buyDustItem,
    equipSkin, equipTrail, equipTitle, equipBadge, equipEffect,
  } = useShopHandlers(save, update);

  const { processRun, reviveRun, claimAchievement, claimMission, claimLogin, resetProgress } =
    useGameHandlers(save, update, setScreen);

  useAudio(save);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Application error:", event.error);
      setError(event.error?.message || "An unknown error occurred");
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      setError(event.reason?.message || "An unknown error occurred");
      event.preventDefault();
    };
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
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

  const loginAvailable = !save.loginClaimedToday;
  const claimedMissions = save.missions.filter((m) => m.claimed).length;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[420px] rounded-full bg-emerald-900/30 blur-[80px] animate-[glow-pulse_6s_ease-in-out_infinite]" />
        <div className="h-[300px] w-[300px] translate-x-[120px] translate-y-[80px] rounded-full bg-violet-900/20 blur-[60px] animate-[glow-pulse_8s_ease-in-out_infinite_0.5s]" />
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
            reviveRun={reviveRun}
          />
        )}
        {screen === "shop" && (
          <Shop
            save={save}
            onBack={() => setScreen("menu")}
            onBuySkin={buySkin}
            onBuyTrail={buyTrail}
            onBuyCrate={(crate) => buyCrate(crate, setLootCrateOpen)}
            onEquipSkin={equipSkin}
            onEquipTrail={equipTrail}
            onEquipTitle={equipTitle}
            onEquipBadge={equipBadge}
            onEquipEffect={equipEffect}
            onBuyPowerUp={buyPowerUp}
            onBuyDustItem={buyDustItem}
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
            user={user}
            syncStatus={syncStatus}
            onBack={() => setScreen("menu")}
            onRename={(name) => update((s) => { s.playerName = name; })}
            onLogin={async () => { try { await loginWithGoogle(); } catch (e) { console.error(e); } }}
            onLogout={async () => { try { await logout(); } catch (e) { console.error(e); } }}
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
        {screen === "friends" && (
          <Friends onBack={() => setScreen("menu")} />
        )}
        {screen === "chat" && (
          <Chat save={save} onBack={() => setScreen("menu")} />
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
                  save={save}
                  onClaim={(itemIds, dust) => claimCrateDrops(itemIds, dust, () => setLootCrateOpen(null))}
                  onClose={() => setLootCrateOpen(null)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Update modal */}
        {updateCtx.show && updateCtx.update && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={updateCtx.dismiss}>
            <div className="relative w-full max-w-sm animate-[scale-in_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
              <div className="rounded-3xl bg-gradient-to-b from-slate-800 to-slate-900 border border-amber-500/20 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                <div className="flex flex-col items-center gap-3 text-center">
                  <span className="text-4xl">📦</span>
                  <h2 className="text-lg font-black text-white">Update Available</h2>
                  <p className="text-sm text-amber-300 font-bold">{updateCtx.update.latestVersion}</p>
                  <p className="text-xs text-white/50 leading-relaxed">
                    {updateCtx.installType === "pwa"
                      ? "A new version is available. Installed PWAs update on next launch after refresh. Tap the button below to get the latest build."
                      : updateCtx.installType === "android"
                        ? "A new APK build is ready. Download from the release page and install manually (your progress is saved locally)."
                        : "A new version has been released. Refresh to get the latest changes."}
                  </p>

                  <div className="mt-2 flex flex-col gap-2 w-full">
                    <a
                      href={updateCtx.update.releaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 text-amber-950 font-bold px-5 py-2.5 text-sm shadow-[0_4px_0_#92400e] hover:from-amber-300 active:translate-y-px"
                    >
                      <span>⬇</span>
                      <span>{updateCtx.installType === "pwa" ? "Refresh & Update" : "Go to Release"}</span>
                    </a>

                    <div className="flex gap-2">
                      <button
                        onClick={updateCtx.dismiss}
                        className="flex-1 rounded-xl bg-white/8 border border-white/10 px-4 py-2 text-xs font-bold text-white/60 hover:text-white hover:bg-white/13 transition-all"
                      >
                        Remind Later
                      </button>
                      <button
                        onClick={updateCtx.skip}
                        className="flex-1 rounded-xl bg-white/8 border border-white/10 px-4 py-2 text-xs font-bold text-white/60 hover:text-white hover:bg-white/13 transition-all"
                      >
                        Skip v{updateCtx.update.latestVersion.replace(/^v/, "")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <ToastContainer />
      </div>
    </div>
  );
}

function CrateReveal({ crate, save, onClaim, onClose }: {
  crate: LootCrate;
  save: SaveData;
  onClaim: (itemIds: string[], dust: number) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"shake" | "reveal" | "done">("shake");
  const [drops, setDrops] = useState<Array<{ drop: LootDrop; type: string; icon: string }>>([]);
  const [dust, setDust] = useState(0);

  useEffect(() => {
    const owned = new Set([...save.ownedSkins, ...save.ownedTrails, ...save.ownedTitles, ...save.ownedBadges, ...save.ownedEffects]);
    const result = rollLootCrate(crate, owned, { bonusRolls: lootFeverBonusRolls() });
    if (result.drops.length === 0) {
      onClaim([], 0);
      return;
    }
    const mapped = result.drops.map(drop => {
      let type = "Skin", icon = "🐦";
      if (TRAILS.find(t => t.id === drop.id)) { type = "Trail"; icon = "✨"; }
      else if (TITLES.find(t => t.id === drop.id)) { type = "Title"; icon = "📛"; }
      else if (BADGES.find(t => t.id === drop.id)) { type = "Badge"; icon = (drop as Badge).icon || "🏅"; }
      else if (EFFECTS.find(t => t.id === drop.id)) { type = "Effect"; icon = "🌈"; }
      else if (SKINS.find(t => t.id === drop.id)) { icon = (drop as Skin).emoji || "🐦"; }
      return { drop, type, icon };
    });
    setDrops(mapped);
    setDust(result.dust);
  }, [crate, onClaim, save.ownedBadges, save.ownedEffects, save.ownedSkins, save.ownedTitles, save.ownedTrails]);

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
          const rarity = d.drop.rarity as string;
          const r = (RARITY as Record<string, { bg: string; border: string; glow: string; label: string; color: string }>)[rarity];
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
              <div className="text-sm font-black text-white text-center">{d.drop.name}</div>
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

// Re-export needed for CrateReveal
import { RARITY, rollLootCrate, lootFeverBonusRolls } from "./game/data";

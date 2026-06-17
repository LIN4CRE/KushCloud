import { useState } from "react";
import { useSave, type Screen } from "./store";
import Menu from "./screens/Menu";
import Play from "./screens/Play";
import Shop from "./screens/Shop";
import Leaderboard from "./screens/Leaderboard";
import Settings from "./screens/Settings";
import { ToastContainer } from "./ui";
import { applyCompletedRun, type RunResult, type RunSummary } from "./game/runProcessing";
import { submitLocalScore } from "./game/leaderboard";
import { SKINS, TRAILS, POWERUPS } from "./game/data";

export default function App() {
  const { save, update } = useSave();
  const [screen, setScreen] = useState<Screen>("menu");

  const processRun = async (r: RunResult): Promise<RunSummary> => {
    return update((s) => {
      const result = applyCompletedRun(s, r);
      if (result.status === "recorded" && s.stats.bestScore > 0) {
        submitLocalScore(s.playerName, s.stats.bestScore);
      }
      return result;
    });
  };

  const reviveRun = (cost: number): boolean => {
    return update((s) => {
      if (s.coins >= cost) {
        s.coins -= cost;
        return true;
      }
      return false;
    });
  };

  const buySkin = (id: string) => {
    const skin = SKINS.find((s) => s.id === id);
    if (!skin || skin.cost === undefined) return;
    update((s) => {
      if (s.ownedSkins.includes(id)) return;
      if (s.coins < (skin.cost ?? 0)) return;
      s.coins -= skin.cost ?? 0;
      s.ownedSkins.push(id);
    });
  };

  const buyTrail = (id: string) => {
    const trail = TRAILS.find((t) => t.id === id);
    if (!trail || trail.cost === undefined) return;
    update((s) => {
      if (s.ownedTrails.includes(id)) return;
      if (s.coins < (trail.cost ?? 0)) return;
      s.coins -= trail.cost ?? 0;
      s.ownedTrails.push(id);
    });
  };

  const equipSkin = (id: string) => update((s) => { s.equippedSkin = id; });
  const equipTrail = (id: string) => update((s) => { s.equippedTrail = id; });

  const buyPowerUp = (id: string) => {
    const pu = POWERUPS.find((p) => p.id === id);
    if (!pu) return;
    update((s) => {
      if (s.ownedPowerUps.includes(id)) return;
      if (s.coins < pu.cost) return;
      s.coins -= pu.cost;
      s.ownedPowerUps.push(id);
    });
  };

  const resetProgress = () => {
    if (window.confirm("Reset all progress? This cannot be undone.")) {
      update((s) => {
        const { loadSave } = { loadSave: () => ({ playerName: "Player", coins: 0, stats: { bestScore: 0, totalGames: 0, totalScore: 0, totalCoins: 0, totalNearMiss: 0, totalPerfectPasses: 0, bestCombo: 0, totalFlaps: 0 }, ownedSkins: ["bud"], ownedTrails: ["none"], ownedPowerUps: [], equippedSkin: "bud", equippedTrail: "none", lastDay: 0, musicVol: 0.5, sfxVol: 0.8, reducedMotion: false, highContrast: false, seenTutorial: false, version: 5 }) };
        const fresh = loadSave();
        Object.assign(s, fresh);
      });
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[420px] rounded-full bg-emerald-900/30 blur-[80px] animate-[glow-pulse_6s_ease-in-out_infinite]" />
        <div className="h-[300px] w-[300px] translate-x-[120px] translate-y-[80px] rounded-full bg-violet-900/20 blur-[60px] animate-[glow-pulse_8s_ease-in-out_infinite_0.5s]" />
      </div>
      <div className="relative mx-auto h-full w-full max-w-md md:max-w-xl lg:max-w-2xl overflow-hidden bg-gradient-to-b from-slate-900 via-emerald-950/60 to-slate-950 shadow-[0_0_80px_rgba(0,0,0,0.8)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />

        {screen === "menu" && <Menu save={save} onPlay={() => setScreen("play")} onNav={setScreen} />}
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
            onEquipSkin={equipSkin}
            onEquipTrail={equipTrail}
            onBuyPowerUp={buyPowerUp}
          />
        )}
        {screen === "leaderboard" && <Leaderboard save={save} onBack={() => setScreen("menu")} />}
        {screen === "settings" && (
          <Settings
            save={save}
            onBack={() => setScreen("menu")}
            onChange={(patch: Partial<typeof save>) => update((s) => Object.assign(s, patch))}
            onReset={resetProgress}
          />
        )}
        <ToastContainer />
      </div>
    </div>
  );
}

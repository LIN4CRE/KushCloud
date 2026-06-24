import { useEffect, useState } from "react";
import { useSave, type Screen } from "./store";
import Menu from "./screens/Menu";
import Play from "./screens/Play";
import Shop from "./screens/Shop";
import Leaderboard from "./screens/Leaderboard";
import Settings from "./screens/Settings";
import { ToastContainer, showToast } from "./ui";
import { applyCompletedRun, type RunResult, type RunSummary } from "./game/runProcessing";
import { submitScore } from "./game/leaderboard";
import { SKINS, TRAILS, POWERUPS } from "./game/data";
import { createDefaultSave, recordRun } from "./game/storage";
import { claimDailyReward } from "./game/rewards";
import { audio } from "./game/audio";

const POWERUP_SLOTS = 2;

export default function App() {
  const { save, update } = useSave();
  const [screen, setScreen] = useState<Screen>("menu");

  useEffect(() => {
    audio.setMusicVol(save.musicVol);
    audio.setSfxVol(save.sfxVol);
  }, [save.musicVol, save.sfxVol]);

  const processRun = async (r: RunResult): Promise<RunSummary> => {
    let leaderboardPayload: Parameters<typeof submitScore>[0] | null = null;
    const summary = update((s) => {
      const result = applyCompletedRun(s, r);
      if (result.status === "recorded" && s.stats.bestScore > 0) {
        leaderboardPayload = {
          uid: s.playerId,
          name: s.playerName,
          score: s.stats.bestScore,
          totalGames: s.stats.totalGames,
          bestCombo: s.stats.bestCombo,
          redEye: r.redEye ?? 0,
        };
      }
      return result;
    });

    if (summary.status === "recorded") {
      recordRun(r.score);
    }

    if (leaderboardPayload) {
      void submitScore(leaderboardPayload).then((result) => {
        if (result.online && result.cloudRank && result.cloudRank <= 10) {
          showToast(`Cloud rank #${result.cloudRank}!`, "success");
        }
      });
    }

    return summary;
  };

  const reviveRun = (cost: number): boolean => {
    return update((s) => {
      if (s.coins >= cost) {
        s.coins -= cost;
        showToast(`Revived for ${cost} coins`, "info");
        return true;
      }
      showToast("Not enough coins to revive", "error");
      return false;
    });
  };

  const buySkin = (id: string) => {
    const skin = SKINS.find((s) => s.id === id);
    if (!skin || skin.cost === undefined) return;
    update((s) => {
      if (s.ownedSkins.includes(id)) return;
      if (s.coins < (skin.cost ?? 0)) {
        showToast("Not enough coins", "error");
        return;
      }
      s.coins -= skin.cost ?? 0;
      s.ownedSkins.push(id);
      showToast(`${skin.name} unlocked`, "success");
    });
  };

  const buyTrail = (id: string) => {
    const trail = TRAILS.find((t) => t.id === id);
    if (!trail || trail.cost === undefined) return;
    update((s) => {
      if (s.ownedTrails.includes(id)) return;
      if (s.coins < (trail.cost ?? 0)) {
        showToast("Not enough coins", "error");
        return;
      }
      s.coins -= trail.cost ?? 0;
      s.ownedTrails.push(id);
      showToast(`${trail.name} trail unlocked`, "success");
    });
  };

  const buyPowerUp = (id: string) => {
    const pu = POWERUPS.find((p) => p.id === id);
    if (!pu) return;
    update((s) => {
      if (s.ownedPowerUps.includes(id)) return;
      if (s.coins < pu.cost) {
        showToast("Not enough coins", "error");
        return;
      }
      s.coins -= pu.cost;
      s.ownedPowerUps.push(id);
      s.equippedPowerUps = s.equippedPowerUps || [];
      if (s.equippedPowerUps.length < POWERUP_SLOTS) s.equippedPowerUps.push(id);
      showToast(`${pu.name} unlocked`, "success");
    });
  };

  const equipSkin = (id: string) => update((s) => {
    if (!s.ownedSkins.includes(id)) return;
    s.equippedSkin = id;
    showToast("Skin equipped", "success");
  });

  const equipTrail = (id: string) => update((s) => {
    if (!s.ownedTrails.includes(id)) return;
    s.equippedTrail = id;
    showToast("Trail equipped", "success");
  });

  const equipPowerUp = (id: string) => update((s) => {
    if (!s.ownedPowerUps.includes(id)) return;
    s.equippedPowerUps = s.equippedPowerUps || [];
    if (s.equippedPowerUps.includes(id)) return;
    if (s.equippedPowerUps.length >= POWERUP_SLOTS) {
      showToast("Power-up loadout is full", "error");
      return;
    }
    s.equippedPowerUps.push(id);
    showToast("Power-up equipped", "success");
  });

  const unequipPowerUp = (id: string) => update((s) => {
    s.equippedPowerUps = (s.equippedPowerUps || []).filter((powerUpId) => powerUpId !== id);
    showToast("Power-up removed", "info");
  });

  const claimDaily = () => {
    const result = update((s) => claimDailyReward(s));
    if (result.claimed) {
      showToast(`Daily claimed: +${result.reward} coins (streak ${result.streak})`, "success");
    } else {
      showToast("Daily reward already claimed", "info");
    }
  };

  const resetProgress = () => {
    if (window.confirm("Reset all progress? This cannot be undone.")) {
      update((s) => {
        Object.assign(s, createDefaultSave());
      });
      showToast("Progress reset", "info");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[420px] animate-[glow-pulse_6s_ease-in-out_infinite] rounded-full bg-emerald-900/30 blur-[80px]" />
        <div className="h-[300px] w-[300px] translate-x-[120px] translate-y-[80px] animate-[glow-pulse_8s_ease-in-out_infinite_0.5s] rounded-full bg-violet-900/20 blur-[60px]" />
      </div>
      <div className="relative mx-auto h-full w-full max-w-md overflow-hidden bg-gradient-to-b from-slate-900 via-emerald-950/60 to-slate-950 shadow-[0_0_80px_rgba(0,0,0,0.8)] md:max-w-xl lg:max-w-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />

        {screen === "menu" && <Menu save={save} onPlay={() => setScreen("play")} onNav={setScreen} onClaimDaily={claimDaily} />}
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
            onEquipPowerUp={equipPowerUp}
            onUnequipPowerUp={unequipPowerUp}
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

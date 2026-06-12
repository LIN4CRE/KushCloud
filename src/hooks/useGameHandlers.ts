import { useCallback, useRef } from "react";
import { audio } from "../game/audio";
import { RunResult } from "../game/engine";
import {
  ACHIEVEMENTS, BADGES, getDailyMissions, LOGIN_REWARDS, podiumBadgeForRank,
} from "../game/data";
import { dayNumber, randomName, DEFAULT_STATS, type SaveData } from "../game/storage";
import { getRank } from "../game/leaderboard";
import { applyCompletedRun, type RunSummary } from "../game/runProcessing";
import { showToast as toastNotify } from "../ui";
import type { Screen } from "../store";

// Match the exact signature from useSave()
type UpdateFn = <T>(fn: (s: SaveData) => T) => T;

export function useGameHandlers(save: SaveData, update: UpdateFn, setScreen: (s: Screen) => void) {
  const saveRef = useRef(save);
  saveRef.current = save;

  const showToast = useCallback((msg: string) => {
    audio.reward();
    toastNotify(msg);
  }, []);

  const processRun = useCallback(async (r: RunResult): Promise<RunSummary> => {
    try {
      const result = update((s) => applyCompletedRun(s, r));
      const currentSave = saveRef.current;
      const { submitPlayerScore } = await import("../game/leaderboard");
      for (const submission of result.submissions) {
        submitPlayerScore(currentSave.playerName, submission.score, submission.period).catch(() => {});
      }
      const rank = await getRank("daily", result.rankScore);
      result.summary.rank = rank;

      // Boasting rights: award a permanent podium badge for top-3 daily finishes
      // (only on a valid, recorded run that set a leaderboard score).
      if (result.summary.valid && result.summary.status === "recorded" && result.rankScore > 0) {
        const podiumId = podiumBadgeForRank(rank);
        if (podiumId && !saveRef.current.ownedBadges.includes(podiumId)) {
          update((s) => { if (!s.ownedBadges.includes(podiumId)) s.ownedBadges.push(podiumId); });
          const b = BADGES.find((x) => x.id === podiumId);
          if (b) {
            result.summary.badges = [...result.summary.badges, b.name];
            showToast(`${b.icon} ${b.name} badge earned!`);
          }
        }
      }

      if (import.meta.env.DEV) {
        console.log(
          `[RunProcessor] Run ${r.runId.slice(0, 8)}... completed: ` +
          `status=${result.summary.status} score=${r.score} ` +
          `totalGames=${currentSave.stats.totalGames} dailyPlays=${currentSave.dailyPlays}`
        );
      }
      return { ...result.summary, rank };
    } catch (error) {
      console.error("[RunProcessor] Error processing run:", error);
      throw error;
    }
  }, [update, showToast]);

  /**
   * Deduct revive cost from banked coins. Returns true if the player could
   * afford it (and coins were deducted), false otherwise. This is the single
   * source of truth for the revive transaction so the UI can't grant a free
   * revive if the save is stale.
   */
  const reviveRun = useCallback((cost: number): boolean => {
    const s = saveRef.current;
    if (s.coins < cost) return false;
    update((d) => { d.coins = Math.max(0, d.coins - cost); });
    audio.shieldBreak();
    return true;
  }, [update]);

  const claimAchievement = useCallback((id: string) => {
    const s = saveRef.current;
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (!a || s.claimedAchievements.includes(id) || !s.unlockedAchievements.includes(id)) return;
    update((d) => { d.claimedAchievements.push(id); d.coins += a.reward; });
    showToast(`+${a.reward} 🪙 from ${a.name}!`);
  }, [update, showToast]);

  const claimMission = useCallback((id: string) => {
    const s = saveRef.current;
    const todays = getDailyMissions(dayNumber());
    const m = todays.find((x) => x.id === id);
    const prog = s.missions.find((p) => p.id === id);
    if (!m || !prog || prog.claimed || prog.progress < m.goal) return;
    update((d) => { const p = d.missions.find((x) => x.id === id)!; p.claimed = true; d.coins += m.reward; });
    showToast(`Mission done! +${m.reward} 🪙`);
  }, [update, showToast]);

  const claimLogin = useCallback(() => {
    if (saveRef.current.loginClaimedToday) return;
    const idx = Math.min(saveRef.current.loginStreak, LOGIN_REWARDS.length) - 1;
    const reward = LOGIN_REWARDS[Math.max(0, idx)];
    update((s) => { s.loginClaimedToday = true; s.coins += reward; });
    showToast(`Daily reward: +${reward} 🪙`);
  }, [update, showToast]);

  const resetProgress = useCallback(() => {
    if (!confirm("Reset ALL progress? This cannot be undone.")) return;
    update((s) => {
      s.coins = 0; s.xp = 0; s.dust = 0;
      s.stats = { ...DEFAULT_STATS };
      s.ownedSkins = ["bud"]; s.ownedTrails = ["none"]; s.ownedEffects = ["e_none"];
      s.ownedTitles = []; s.ownedBadges = []; s.ownedPowerUps = [];
      s.equippedSkin = "bud"; s.equippedTrail = "none"; s.equippedEffect = "e_none";
      s.equippedTitle = null; s.equippedBadge = null;
      s.unlockedAchievements = []; s.claimedAchievements = [];
      s.scoreHistory = []; s.missions = []; s.processedRunIds = [];
      s.loginStreak = 0; s.loginClaimedToday = false;
      s.cratesOpened = 0; s.seenItems = {};
      s.playerName = randomName(); s.seenTutorial = true;
    });
    showToast("Progress reset.");
    setScreen("menu");
  }, [update, showToast, setScreen]);

  return { processRun, reviveRun, claimAchievement, claimMission, claimLogin, resetProgress };
}

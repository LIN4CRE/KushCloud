import { dayNumber, type SaveData } from "./storage";

export const DAILY_BASE_REWARD = 100;
export const DAILY_STREAK_STEP = 25;
export const DAILY_STREAK_CAP_BONUS = 400;

export interface DailyRewardStatus {
  claimedToday: boolean;
  streak: number;
  reward: number;
  today: number;
}

export interface DailyRewardClaim extends DailyRewardStatus {
  claimed: boolean;
}

export function nextDailyRewardAmount(streak: number): number {
  const safeStreak = Math.max(1, Math.floor(streak));
  return DAILY_BASE_REWARD + Math.min(DAILY_STREAK_CAP_BONUS, (safeStreak - 1) * DAILY_STREAK_STEP);
}

export function getDailyRewardStatus(save: Pick<SaveData, "dailyStreak" | "lastDailyClaimDay">, today = dayNumber()): DailyRewardStatus {
  const claimedToday = save.lastDailyClaimDay === today;
  const continuesStreak = claimedToday || save.lastDailyClaimDay === today - 1;
  const streak = claimedToday
    ? Math.max(1, save.dailyStreak)
    : continuesStreak
      ? Math.max(1, save.dailyStreak + 1)
      : 1;

  return {
    claimedToday,
    streak,
    reward: nextDailyRewardAmount(streak),
    today,
  };
}

export function claimDailyReward(save: SaveData, today = dayNumber()): DailyRewardClaim {
  const status = getDailyRewardStatus(save, today);
  if (status.claimedToday) {
    return { ...status, claimed: false };
  }

  save.dailyStreak = status.streak;
  save.lastDailyClaimDay = today;
  save.coins += status.reward;
  save.stats.totalCoins += status.reward;

  return { ...status, claimedToday: true, claimed: true };
}

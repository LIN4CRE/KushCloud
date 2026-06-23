import { describe, expect, it } from "vitest";
import { claimDailyReward, getDailyRewardStatus, nextDailyRewardAmount } from "./rewards";
import { loadSave } from "./storage";

describe("daily rewards", () => {
  it("scales reward with streak and caps the bonus", () => {
    expect(nextDailyRewardAmount(1)).toBe(100);
    expect(nextDailyRewardAmount(3)).toBe(150);
    expect(nextDailyRewardAmount(999)).toBe(500);
  });

  it("shows an available first-day reward", () => {
    const save = loadSave();
    save.lastDailyClaimDay = 0;
    save.dailyStreak = 0;

    const status = getDailyRewardStatus(save, 10);

    expect(status.claimedToday).toBe(false);
    expect(status.streak).toBe(1);
    expect(status.reward).toBe(100);
  });

  it("continues streak from yesterday", () => {
    const save = loadSave();
    save.lastDailyClaimDay = 9;
    save.dailyStreak = 4;

    const status = getDailyRewardStatus(save, 10);

    expect(status.streak).toBe(5);
    expect(status.reward).toBe(200);
  });

  it("claims once and adds coins", () => {
    const save = loadSave();
    save.coins = 10;
    save.stats.totalCoins = 10;

    const first = claimDailyReward(save, 10);
    const second = claimDailyReward(save, 10);

    expect(first.claimed).toBe(true);
    expect(first.reward).toBe(100);
    expect(save.coins).toBe(110);
    expect(save.stats.totalCoins).toBe(110);
    expect(second.claimed).toBe(false);
    expect(save.coins).toBe(110);
  });
});

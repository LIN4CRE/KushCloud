import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { Leaderboard } from "../screens/Leaderboard";
import { SaveData } from "../game/storage";
import { LeaderboardPeriod } from "../game/leaderboardModel";

vi.mock("../game/leaderboard", () => ({
  subscribeToLeaderboard: vi.fn(),
  submitPlayerScore: vi.fn(),
  getUID: () => "test-uid-123",
  setUID: vi.fn(),
}));

vi.mock("../ui", () => ({
  ScreenShell: ({ children, title, onBack }: any) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
  Tabs: ({ tabs, active, onChange }: any) => (
    <div>
      {tabs.map((tab: any) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={active === tab.key ? "active" : ""}
        >
          {tab.label}
        </button>
      ))}
    </div>
  ),
  Shimmer: ({ className }: any) => <div className={className} data-testid="shimmer" />,
  cx: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

vi.mock("../game/storage", () => ({
  SaveData: vi.fn(),
}));

describe("Leaderboard Screen - Integration Test", () => {
  const mockSave: SaveData = {
    version: 4,
    playerName: "TestPlayer",
    coins: 100,
    xp: 0,
    dust: 0,
    stats: {
      totalGames: 10,
      totalScore: 1500,
      totalCoins: 50,
      totalNearMiss: 2,
      totalPerfectPasses: 5,
      bestCombo: 3,
      totalFlaps: 100,
      bestScore: 100,
    },
    ownedSkins: ["bud"],
    ownedTrails: ["none"],
    ownedTitles: [],
    ownedBadges: [],
    ownedEffects: ["e_none"],
    ownedPowerUps: [],
    equippedSkin: "bud",
    equippedTrail: "none",
    equippedTitle: null,
    equippedBadge: null,
    equippedEffect: "e_none",
    unlockedAchievements: [],
    claimedAchievements: [],
    cratesOpened: 0,
    lastDay: 1,
    missions: [],
    dailyPlays: 5,
    dailyCoins: 10,
    lastLoginDay: 1,
    loginStreak: 2,
    loginClaimedToday: false,
    musicVol: 0.5,
    sfxVol: 0.8,
    reducedMotion: false,
    highContrast: false,
    seenTutorial: false,
    scoreHistory: [50, 75, 100, 125, 150, 175, 200, 225, 250, 300],
    seasonalXp: 0,
    currentSeason: 1,
    lastSync: Date.now(),
    lastCloudSync: 0,
    seenItems: {},
    eventState: {},
    processedRunIds: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render leaderboard component", async () => {
    vi.mocked(require("../game/leaderboard").subscribeToLeaderboard).mockImplementation(
      (
        period: LeaderboardPeriod,
        playerName: string,
        playerScore: number,
        friendsOnly: boolean,
        callback: (entries: any[]) => void
      ) => {
        callback([]);
        return () => {};
      }
    );

    await act(async () => {
      render(<Leaderboard save={mockSave} onBack={() => {}} />);
    });

    expect(screen.getByText("Leaderboard")).toBeInTheDocument();
  });
});

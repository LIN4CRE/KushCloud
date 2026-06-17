import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import Leaderboard from "../screens/Leaderboard";
import type { SaveData } from "../game/storage";

vi.mock("../game/leaderboard", () => ({
  subscribeToLeaderboard: vi.fn((_period: string, _name: string, _score: number, _friends: boolean, cb: (entries: any[]) => void) => {
    cb([]);
    return () => {};
  }),
  submitPlayerScore: vi.fn(),
  copyBragToClipboard: vi.fn(),
  type: {} as any,
}));

vi.mock("../ui", () => ({
  ScreenShell: ({ children, title }: any) => (
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
  Button: ({ children, onClick, className }: any) => (
    <button onClick={onClick} className={className}>{children}</button>
  ),
  showToast: vi.fn(),
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
    await act(async () => {
      render(<Leaderboard save={mockSave} onBack={() => {}} />);
    });
    expect(screen.getByText("Leaderboard")).toBeInTheDocument();
  });
});

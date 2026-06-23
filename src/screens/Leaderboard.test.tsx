import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import Leaderboard from "../screens/Leaderboard";
import type { SaveData } from "../game/storage";

vi.mock("../ui", () => ({
  ScreenShell: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
  Panel: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

describe("Leaderboard Screen", () => {
  const mockSave: SaveData = {
    version: 5,
    playerName: "TestPlayer",
    coins: 100,
    stats: {
      totalGames: 10, totalScore: 1500, totalCoins: 50,
      totalNearMiss: 2, totalPerfectPasses: 5, bestCombo: 3,
      totalFlaps: 100, bestScore: 100,
    },
    ownedSkins: ["bud"],
    ownedTrails: ["none"],
    ownedPowerUps: [],
    equippedSkin: "bud",
    equippedTrail: "none",
    lastDay: 1,
    musicVol: 0.5, sfxVol: 0.8,
    reducedMotion: false, highContrast: false,
    seenTutorial: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders leaderboard component", () => {
    render(<Leaderboard save={mockSave} onBack={() => {}} />);
    // Component renders without crashing
  });

  it("shows empty state when no scores exist", () => {
    const { container } = render(<Leaderboard save={mockSave} onBack={() => {}} />);
    expect(container.textContent).toContain("No scores yet");
  });
});

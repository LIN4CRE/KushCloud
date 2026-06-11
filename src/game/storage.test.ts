import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  dayNumber, normalizePlayerName, migrateSave, loadSave, writeSave,
  rollDaily, currentMissions, validateRun, seededScores, trackEventMetric,
  DEFAULT_STATS,
} from "./storage";

const STORAGE_KEY = "kushcloud_save_v1";

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("dayNumber", () => {
  beforeEach(() => { vi.useFakeTimers(); });

  it("returns consistent value for a given date", () => {
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    const d1 = dayNumber();
    vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
    const d2 = dayNumber();
    expect(d1).toBe(d2);
  });

  it("increments after midnight", () => {
    vi.setSystemTime(new Date("2024-01-01T23:59:59Z"));
    const d1 = dayNumber();
    vi.setSystemTime(new Date("2024-01-02T00:00:00Z"));
    const d2 = dayNumber();
    expect(d2).toBe(d1 + 1);
  });
});

describe("normalizePlayerName", () => {
  it("trims whitespace", () => {
    expect(normalizePlayerName("  hello  ")).toBe("hello");
  });

  it("slices to 16 chars", () => {
    expect(normalizePlayerName("a".repeat(30))).toBe("a".repeat(16));
  });

  it("uses fallback for empty name", () => {
    expect(normalizePlayerName("  ", "Fallback")).toBe("Fallback");
  });

  it("uses provided fallback", () => {
    expect(normalizePlayerName("", "CustomFallback123")).toBe("CustomFallback123");
  });
});

describe("migrateSave", () => {
  it("fills missing fields from defaults", () => {
    const result = migrateSave({});
    expect(result.version).toBe(4);
    expect(result.coins).toBe(0);
    expect(result.stats).toEqual(DEFAULT_STATS);
  });

  it("preserves existing values", () => {
    const result = migrateSave({ coins: 500, playerName: "Test" });
    expect(result.coins).toBe(500);
    expect(result.playerName).toBe("Test");
  });

  it("migrates v1 to v4", () => {
    const result = migrateSave({ version: 1, stats: { totalGames: 10 } });
    expect(result.version).toBe(4);
    expect(result.stats.totalGames).toBe(10);
    expect(result.ownedTitles).toEqual([]);
    expect(result.processedRunIds).toEqual([]);
  });

  it("migrates v2 to v4", () => {
    const result = migrateSave({ version: 2, eventState: undefined });
    expect(result.version).toBe(4);
    expect(result.eventState).toEqual({});
    expect(result.processedRunIds).toEqual([]);
  });

  it("migrates v3 to v4", () => {
    const result = migrateSave({ version: 3, processedRunIds: undefined });
    expect(result.version).toBe(4);
    expect(result.processedRunIds).toEqual([]);
  });

  it("adds totalPerfectPasses if missing from stats", () => {
    const result = migrateSave({ stats: { totalGames: 1 } });
    expect(result.stats.totalPerfectPasses).toBe(0);
  });
});

describe("loadSave", () => {
  it("returns default save when localStorage is empty", () => {
    const save = loadSave();
    expect(save.version).toBe(4);
    expect(save.coins).toBe(0);
  });

  it("loads and migrates existing save", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, coins: 100 }));
    const save = loadSave();
    expect(save.version).toBe(4);
    expect(save.coins).toBe(100);
  });

  it("returns default on corrupt data", () => {
    localStorage.setItem(STORAGE_KEY, "not-json");
    const save = loadSave();
    expect(save.version).toBe(4);
  });

  it("returns default on non-object data", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify("string"));
    const save = loadSave();
    expect(save.version).toBe(4);
  });
});

describe("writeSave", () => {
  it("writes to localStorage", () => {
    const save = loadSave();
    writeSave(save);
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toBeDefined();
    const parsed = JSON.parse(stored!);
    expect(parsed.version).toBe(4);
  });

  it("sets lastSync timestamp", () => {
    const save = loadSave();
    const before = save.lastSync;
    writeSave(save);
    expect(save.lastSync).toBeGreaterThanOrEqual(before);
  });
});

describe("rollDaily", () => {
  beforeEach(() => { vi.useFakeTimers(); });

  it("resets missions when day changes", () => {
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    const save = loadSave();
    save.lastDay = dayNumber() - 1;
    save.missions = [];
    const updated = rollDaily(save);
    expect(updated.missions.length).toBe(3);
    expect(updated.lastDay).toBe(dayNumber());
  });

  it("does not reset missions when rolled twice on same day", () => {
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    const save = loadSave();
    rollDaily(save); // first call populates missions for today
    expect(save.missions.length).toBe(3);
    const missionsBefore = save.missions.length;
    rollDaily(save); // second call should NOT reset
    expect(save.missions.length).toBe(missionsBefore);
  });
});

describe("currentMissions", () => {
  beforeEach(() => { vi.useFakeTimers(); });

  it("returns 3 missions for current day", () => {
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    const missions = currentMissions();
    expect(missions).toHaveLength(3);
  });
});

describe("validateRun", () => {
  it("accepts valid run", () => {
    expect(validateRun(10, 5000, 20, 3)).toEqual({ valid: true });
  });

  it("rejects non-finite values", () => {
    expect(validateRun(Infinity, 1000, 5, 1).valid).toBe(false);
    expect(validateRun(10, NaN, 5, 1).valid).toBe(false);
  });

  it("rejects non-integer values", () => {
    expect(validateRun(10.5, 5000, 5, 2).valid).toBe(false);
    expect(validateRun(10, 5000, 5.5, 2).valid).toBe(false);
  });

  it("rejects negative values", () => {
    expect(validateRun(-1, 1000, 5, 1).valid).toBe(false);
    expect(validateRun(10, -1, 5, 1).valid).toBe(false);
  });

  it("rejects score/time mismatch", () => {
    expect(validateRun(10, 100, 5, 1).valid).toBe(false);
  });

  it("rejects insufficient flaps for high score", () => {
    expect(validateRun(10, 5000, 1, 1).valid).toBe(false);
  });

  it("rejects coin anomaly", () => {
    expect(validateRun(1, 1000, 5, 10).valid).toBe(false);
  });

  it("rejects out of bounds score", () => {
    expect(validateRun(100001, 50000000, 500, 50).valid).toBe(false);
  });
});

describe("seededScores", () => {
  beforeEach(() => { vi.useFakeTimers(); });

  it("returns 31 entries", () => {
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    const scores = seededScores("daily");
    expect(scores).toHaveLength(31);
  });

  it("each entry has name and score", () => {
    const scores = seededScores("daily");
    for (const entry of scores) {
      expect(typeof entry.name).toBe("string");
      expect(entry.score).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("trackEventMetric", () => {
  beforeEach(() => { vi.useFakeTimers(); });

  it("calls update when events are active", () => {
    vi.setSystemTime(new Date("2025-04-25T12:00:00Z"));
    const update = vi.fn((fn) => {
      const save = loadSave();
      fn(save);
    });
    trackEventMetric("score", 10, loadSave(), update);
    expect(update).toHaveBeenCalled();
  });

  it("does not call update when no events are active", () => {
    vi.setSystemTime(new Date("2020-01-01T00:00:00Z"));
    const update = vi.fn();
    trackEventMetric("score", 10, loadSave(), update);
    expect(update).not.toHaveBeenCalled();
  });
});

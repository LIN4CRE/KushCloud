import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  dayNumber, randomName, loadSave, writeSave,
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

describe("randomName", () => {
  it("returns a string with expected format", () => {
    const name = randomName();
    expect(name.length).toBeGreaterThan(5);
    expect(name).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+\d{2}$/);
  });
});

describe("loadSave", () => {
  it("returns default save when localStorage is empty", () => {
    const save = loadSave();
    expect(save.version).toBe(5);
    expect(save.coins).toBe(0);
    expect(save.stats).toEqual(DEFAULT_STATS);
    expect(save.ownedSkins).toEqual(["bud"]);
    expect(save.ownedTrails).toEqual(["none"]);
  });

  it("preserves existing values", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ coins: 500, playerName: "Test" }));
    const save = loadSave();
    expect(save.version).toBe(5);
    expect(save.coins).toBe(500);
    expect(save.playerName).toBe("Test");
  });

  it("returns default on corrupt data", () => {
    localStorage.setItem(STORAGE_KEY, "not-json");
    const save = loadSave();
    expect(save.version).toBe(5);
  });

  it("returns default on non-object data", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify("string"));
    const save = loadSave();
    expect(save.version).toBe(5);
  });
});

describe("writeSave", () => {
  it("writes to localStorage", () => {
    const save = loadSave();
    writeSave(save);
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toBeDefined();
    const parsed = JSON.parse(stored!);
    expect(parsed.version).toBe(5);
  });
});

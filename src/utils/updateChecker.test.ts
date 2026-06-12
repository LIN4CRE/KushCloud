import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  detectInstallType,
  isVersionDismissed,
  dismissUpdate,
  isVersionSkipped,
  skipVersion,
} from "./updateChecker";

/**
 * Tests for the update-checker helpers that don't require network access:
 * install-type detection and the dismiss/skip persistence logic.
 */

describe("updateChecker — persistence helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("dismissUpdate / isVersionDismissed", () => {
    it("returns false when nothing has been dismissed", () => {
      expect(isVersionDismissed("2.4.0")).toBe(false);
    });

    it("returns true immediately after dismissing the same version", () => {
      dismissUpdate("2.4.0");
      expect(isVersionDismissed("2.4.0")).toBe(true);
    });

    it("returns false for a different version than the one dismissed", () => {
      dismissUpdate("2.4.0");
      expect(isVersionDismissed("2.5.0")).toBe(false);
    });

    it("expires the dismissal after the TTL window", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
      dismissUpdate("2.4.0");
      expect(isVersionDismissed("2.4.0")).toBe(true);

      // Advance > 24h
      vi.setSystemTime(new Date("2026-01-02T00:00:01Z"));
      expect(isVersionDismissed("2.4.0")).toBe(false);
    });

    it("returns false when stored payload is corrupt", () => {
      localStorage.setItem("kc_update_dismissed", "not-json");
      expect(isVersionDismissed("2.4.0")).toBe(false);
    });
  });

  describe("skipVersion / isVersionSkipped", () => {
    it("returns false when no version is skipped", () => {
      expect(isVersionSkipped("2.4.0")).toBe(false);
    });

    it("returns true for the exact skipped version", () => {
      skipVersion("2.4.0");
      expect(isVersionSkipped("2.4.0")).toBe(true);
      expect(isVersionSkipped("2.5.0")).toBe(false);
    });
  });
});

describe("updateChecker — detectInstallType", () => {
  const originalUA = navigator.userAgent;

  function setUA(ua: string) {
    Object.defineProperty(navigator, "userAgent", { value: ua, configurable: true });
  }

  afterEach(() => {
    setUA(originalUA);
    vi.restoreAllMocks();
  });

  it("detects standalone PWA via display-mode", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true }) as unknown as typeof matchMedia,
    );
    expect(detectInstallType()).toBe("pwa");
  });

  it("detects Android browser (not WebView)", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: false }) as unknown as typeof matchMedia,
    );
    setUA("Mozilla/5.0 (Linux; Android 13; Pixel) Chrome/120");
    expect(detectInstallType()).toBe("android");
  });

  it("falls back to web for a desktop browser", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: false }) as unknown as typeof matchMedia,
    );
    setUA("Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/120");
    expect(detectInstallType()).toBe("web");
  });

  it("treats an Android WebView (wv) as web rather than android", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: false }) as unknown as typeof matchMedia,
    );
    setUA("Mozilla/5.0 (Linux; Android 13; wv) Chrome/120");
    expect(detectInstallType()).toBe("web");
  });
});

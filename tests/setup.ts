import { afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, "navigator", {
  value: { onLine: true },
  writable: true,
  configurable: true,
});

// Clean up after each test
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

// Mock Canvas API if needed
if (typeof window !== "undefined") {
  HTMLCanvasElement.prototype.getContext = vi.fn();
}

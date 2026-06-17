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

// Preserve real jsdom navigator properties (e.g. userAgent) that React 19
// depends on, while overriding onLine for test control.
const origNav = globalThis.navigator;
Object.defineProperty(globalThis, "navigator", {
  value: new Proxy(origNav ?? { onLine: true }, {
    get(target, prop) {
      if (prop === "onLine") return true;
      const val = (target as unknown as Record<string, unknown>)[prop as string];
      return val;
    },
  }),
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

import { afterEach, vi } from "vitest";
import "@testing-library/jest-dom";

// Clean up after each test
afterEach(() => {
  vi.restoreAllMocks();
});

// Mock Canvas API if needed
if (typeof window !== "undefined") {
  HTMLCanvasElement.prototype.getContext = vi.fn();
}

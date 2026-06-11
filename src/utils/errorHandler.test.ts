import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError, ErrorCode, logger, setupGlobalErrorHandling } from "./errorHandler";

describe("AppError", () => {
  it("creates error with default UNKNOWN code", () => {
    const err = new AppError("something broke");
    expect(err.message).toBe("something broke");
    expect(err.name).toBe("AppError");
    expect(err.code).toBe(ErrorCode.UNKNOWN);
    expect(typeof err.timestamp).toBe("string");
  });

  it("creates error with specific code", () => {
    const err = new AppError("network failure", ErrorCode.NETWORK_ERROR);
    expect(err.message).toBe("network failure");
    expect(err.code).toBe(ErrorCode.NETWORK_ERROR);
  });

  it("captures stack trace", () => {
    const err = new AppError("with stack");
    expect(err.stack).toBeDefined();
  });
});

describe("logger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("debug logs nothing in production", () => {
    vi.stubEnv("DEV", false);
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    logger.debug("test message");
    expect(spy).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("debug logs in development", () => {
    vi.stubEnv("DEV", true);
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    logger.debug("test message");
    expect(spy).toHaveBeenCalledWith("[KushCloud]", "test message");
    vi.unstubAllEnvs();
  });

  it("info logs to console.info", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    logger.info("info msg");
    expect(spy).toHaveBeenCalledWith("[KushCloud]", "info msg");
  });

  it("warn logs to console.warn", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logger.warn("warn msg");
    expect(spy).toHaveBeenCalledWith("[KushCloud]", "warn msg");
  });

  it("error logs Error object message", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error(new Error("oops"));
    expect(spy).toHaveBeenCalledWith("[KushCloud] ERROR:", "oops");
  });

  it("error logs string message", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("string error");
    expect(spy).toHaveBeenCalledWith("[KushCloud] ERROR:", "string error");
  });

  it("error includes context", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("fail", "NetworkModule");
    expect(spy).toHaveBeenCalledWith("[KushCloud] [NetworkModule] ERROR:", "fail");
  });
});

describe("setupGlobalErrorHandling", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("adds error and unhandledrejection listeners", () => {
    const addEventListener = vi.spyOn(window, "addEventListener").mockImplementation(() => {});
    setupGlobalErrorHandling();
    expect(addEventListener).toHaveBeenCalledWith("error", expect.any(Function));
    expect(addEventListener).toHaveBeenCalledWith("unhandledrejection", expect.any(Function));
  });
});

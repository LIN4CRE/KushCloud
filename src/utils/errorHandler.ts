/**
 * Global Error Handling Module
 */

export enum ErrorCode {
  NETWORK_ERROR = "NETWORK_ERROR",
  AUTH_ERROR = "AUTH_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  STORAGE_ERROR = "STORAGE_ERROR",
  UNKNOWN = "UNKNOWN",
}

export class AppError extends Error {
  public code: ErrorCode;
  public timestamp: string;

  constructor(message: string, code: ErrorCode = ErrorCode.UNKNOWN) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.timestamp = new Date().toISOString();
  }
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (import.meta.env.DEV) console.debug("[KushCloud]", ...args);
  },
  info: (...args: unknown[]) => console.info("[KushCloud]", ...args),
  warn: (...args: unknown[]) => console.warn("[KushCloud]", ...args),
  error: (err: Error | string, context?: string) => {
    const msg = err instanceof Error ? err.message : err;
    console.error(`[KushCloud]${context ? ` [${context}]` : ""} ERROR:`, msg);
    // Integration point for Sentry or other telemetry
  },
};

let onFatalError: ((message: string) => void) | null = null;

export function setOnFatalError(cb: (message: string) => void) {
  onFatalError = cb;
}

/**
 * Global listener for unhandled errors
 */
export function setupGlobalErrorHandling() {
  window.addEventListener("error", (event) => {
    const msg = event.error?.message || event.message || "An unknown error occurred";
    logger.error(msg, "UnhandledError");
    onFatalError?.(msg);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const msg = event.reason?.message || "An unknown error occurred";
    logger.error(msg, "UnhandledRejection");
    onFatalError?.(msg);
    event.preventDefault();
  });
}

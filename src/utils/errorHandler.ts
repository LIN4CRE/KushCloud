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
  debug: (...args: any[]) => {
    if (import.meta.env.DEV) console.debug("[KushCloud]", ...args);
  },
  info: (...args: any[]) => console.info("[KushCloud]", ...args),
  warn: (...args: any[]) => console.warn("[KushCloud]", ...args),
  error: (err: Error | string, context?: string) => {
    const msg = err instanceof Error ? err.message : err;
    console.error(`[KushCloud]${context ? ` [${context}]` : ""} ERROR:`, msg);
    // Integration point for Sentry or other telemetry
  },
};

/**
 * Global listener for unhandled errors
 */
export function setupGlobalErrorHandling() {
  window.addEventListener("error", (event) => {
    logger.error(event.error || event.message, "UnhandledError");
  });

  window.addEventListener("unhandledrejection", (event) => {
    logger.error(event.reason, "UnhandledRejection");
  });
}

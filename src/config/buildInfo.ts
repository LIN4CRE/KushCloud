export interface BuildInfo {
  version: string;
  commit: string;
  branch: string;
  builtAt: string;
  mode: string;
  baseUrl: string;
  leaderboardCloud: boolean;
  production: boolean;
}

export const BUILD_INFO: BuildInfo = {
  version: import.meta.env.VITE_APP_VERSION || "dev",
  commit: import.meta.env.VITE_GIT_SHA || "local",
  branch: import.meta.env.VITE_GIT_BRANCH || "local",
  builtAt: import.meta.env.VITE_BUILD_TIME || "unknown",
  mode: import.meta.env.MODE,
  baseUrl: import.meta.env.BASE_URL,
  leaderboardCloud: !!import.meta.env.VITE_LEADERBOARD_API_URL,
  production: import.meta.env.PROD,
};

export function shortCommit(commit = BUILD_INFO.commit) {
  return commit === "local" ? commit : commit.slice(0, 12);
}

export function buildDebugReport(extra: Record<string, unknown> = {}) {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const win = typeof window !== "undefined" ? window : undefined;

  return {
    app: "KushCloud",
    build: BUILD_INFO,
    runtime: {
      userAgent: nav?.userAgent ?? "unknown",
      language: nav?.language ?? "unknown",
      online: nav?.onLine ?? false,
      url: win?.location.href ?? "unknown",
      viewport: win ? `${win.innerWidth}x${win.innerHeight}` : "unknown",
      devicePixelRatio: win?.devicePixelRatio ?? 1,
      serviceWorker: !!nav?.serviceWorker,
      localStorage: (() => {
        try {
          const key = "kushcloud_debug_probe";
          localStorage.setItem(key, "1");
          localStorage.removeItem(key);
          return true;
        } catch {
          return false;
        }
      })(),
    },
    ...extra,
  };
}

export const env = {
  app: {
    name: "KushCloud",
    version: import.meta.env.VITE_APP_VERSION || "4.0.0",
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
  },
} as const;

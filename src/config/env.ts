/**
 * Environment Configuration Module
 * Validates and provides type-safe access to environment variables.
 */

function validateEnv(key: string, required = true): string {
  const value = import.meta.env[key];
  if (required && (!value || value.trim() === "")) {
    console.error(`[KushCloud] Missing required environment variable: ${key}`);
    return "";
  }
  return value || "";
}

export const env = {
  app: {
    name: "KushCloud",
    version: "2.3.0",
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
  },
  firebase: {
    apiKey: validateEnv("VITE_FIREBASE_API_KEY"),
    authDomain: validateEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    databaseURL: validateEnv("VITE_FIREBASE_DATABASE_URL"),
    projectId: validateEnv("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: validateEnv("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: validateEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: validateEnv("VITE_FIREBASE_APP_ID"),
  },
} as const;

export default env;

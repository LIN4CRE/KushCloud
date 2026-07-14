import { initializeApp, type FirebaseApp } from "firebase/app";
import { getDatabase, ref, get, query, orderByChild, limitToLast, runTransaction, type Database } from "firebase/database";

function loadFirebaseConfig() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD0U-oXBjC-n88CGQgXN4EWZ1skhDyXMJQ";
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "kushcloud-25cd5";
  const databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://kushcloud-25cd5-default-rtdb.europe-west1.firebasedatabase.app";
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "kushcloud-25cd5.firebaseapp.com";
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "kushcloud-25cd5.firebasestorage.app";
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "348700156533";
  const appId = import.meta.env.VITE_FIREBASE_APP_ID || "1:348700156533:web:271b97dac290b1702f4e3c";
  return { apiKey, authDomain, databaseURL, projectId, storageBucket, messagingSenderId, appId };
}

export function isFirebaseConfigured(): boolean {
  const cfg = loadFirebaseConfig();
  return !!(cfg.databaseURL && cfg.projectId);
}

let app: FirebaseApp | null = null;
let dbInstance: Database | null = null;
let initPromise: Promise<void> | null = null;
let initError: Error | null = null;

async function ensureInit(): Promise<Database | null> {
  if (dbInstance) return dbInstance;
  if (initError) return null;

  if (!initPromise) {
    initPromise = (async () => {
      if (!isFirebaseConfigured()) {
        initError = new Error("Firebase not configured");
        return;
      }
      try {
        const cfg = loadFirebaseConfig();
        app = initializeApp(cfg);
        dbInstance = getDatabase(app);
      } catch (err) {
        initError = err as Error;
        console.warn("[Firebase] init failed:", err);
      }
    })();
  }

  await initPromise;
  return dbInstance;
}

export const db = null;

export async function submitLeaderboardScore(uid: string, name: string, score: number): Promise<{ rank: number } | null> {
  const database = await ensureInit();
  if (!database || !uid || !Number.isFinite(score) || score < 0) return null;
  const now = Date.now();
  const safeName = name.trim().slice(0, 32) || "Anonymous";
  const refPath = ref(database, `leaderboards/all/${uid}`);

  try {
    await runTransaction(refPath, (current) => {
      if (!current) {
        return { uid, name: safeName, score, timestamp: now, period: "all" };
      }
      const cur = current as { score?: number; name?: string; timestamp?: number };
      return {
        uid,
        name: safeName,
        score: Math.max(cur.score || 0, score),
        timestamp: (score >= (cur.score || 0)) ? now : (cur.timestamp || now),
        period: "all",
      };
    });

    const better = await get(query(ref(database, "leaderboards/all"), orderByChild("score"), limitToLast(100000)));
    let rank = 1;
    better.forEach((child) => {
      const val = child.val() as { score?: number };
      if (val && typeof val.score === "number" && val.score > score) rank++;
    });

    return { rank };
  } catch (err) {
    console.warn("[Firebase] submit error:", err);
    return null;
  }
}

export async function getLeaderboardEntries(limit = 50): Promise<{ uid: string; name: string; score: number; date: number }[]> {
  const database = await ensureInit();
  if (!database) return [];
  try {
    const snapshot = await get(query(ref(database, "leaderboards/all"), orderByChild("score"), limitToLast(limit)));
    const entries: { uid: string; name: string; score: number; date: number }[] = [];
    snapshot.forEach((child) => {
      const val = child.val() as { uid?: string; name?: string; score?: number; timestamp?: number } | null;
      if (val && typeof val.score === "number" && val.name) {
        entries.push({
          uid: val.uid || child.key || "",
          name: String(val.name).slice(0, 32),
          score: Math.floor(val.score),
          date: val.timestamp || Date.now(),
        });
      }
    });
    return entries.reverse();
  } catch (err) {
    console.warn("[Firebase] read error:", err);
    return [];
  }
}

export async function getPlayerRank(uid: string, score: number): Promise<number> {
  const database = await ensureInit();
  if (!database || !uid) return 0;
  try {
    const better = await get(query(ref(database, "leaderboards/all"), orderByChild("score"), limitToLast(100000)));
    let rank = 1;
    better.forEach((child) => {
      const val = child.val() as { score?: number };
      if (val && typeof val.score === "number" && val.score > score) rank++;
    });
    return rank;
  } catch {
    return 0;
  }
}

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push, onValue, off, query, orderByChild, limitToLast, get } from "firebase/database";

// Firebase configuration - replace with your own Firebase project credentials
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://your-project-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "your-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export type LeaderboardPeriod = "daily" | "weekly" | "all";

export interface LeaderboardEntry {
  name: string;
  score: number;
  timestamp: number;
  uid: string;
  period: LeaderboardPeriod;
}

export interface UserProfile {
  uid: string;
  name: string;
  bestScore: number;
  totalGames: number;
  totalCoins: number;
  level: number;
  xp: number;
  createdAt: number;
  updatedAt: number;
}

export async function submitScore(
  uid: string,
  name: string,
  score: number,
  period: LeaderboardPeriod
): Promise<void> {
  const entry: LeaderboardEntry = {
    uid,
    name,
    score,
    timestamp: Date.now(),
    period,
  };
  
  const leaderboardRef = ref(db, `leaderboards/${period}`);
  const newEntryRef = push(leaderboardRef);
  await set(newEntryRef, entry);
  
  // Also update user profile
  const profileRef = ref(db, `users/${uid}`);
  const snapshot = await get(profileRef);
  const existing = snapshot.val() as UserProfile | null;
  
  const profile: UserProfile = {
    uid,
    name,
    bestScore: existing ? Math.max(existing.bestScore, score) : score,
    totalGames: (existing?.totalGames || 0) + 1,
    totalCoins: existing?.totalCoins || 0,
    level: existing?.level || 1,
    xp: existing?.xp || 0,
    createdAt: existing?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  
  await set(profileRef, profile);
}

export function subscribeLeaderboard(
  period: LeaderboardPeriod,
  callback: (entries: LeaderboardEntry[]) => void
): () => void {
  const leaderboardRef = ref(db, `leaderboards/${period}`);
  const q = query(leaderboardRef, orderByChild("score"), limitToLast(100));
  
  const unsubscribe = onValue(q, (snapshot) => {
    const entries: LeaderboardEntry[] = [];
    snapshot.forEach((child) => {
      entries.push({ ...child.val(), uid: child.key || "" });
    });
    // Sort descending by score
    entries.sort((a, b) => b.score - a.score);
    callback(entries.slice(0, 50));
  });
  
  return () => off(q, "value", unsubscribe);
}

export function subscribeUserProfile(uid: string, callback: (profile: UserProfile | null) => void): () => void {
  const profileRef = ref(db, `users/${uid}`);
  
  const unsubscribe = onValue(profileRef, (snapshot) => {
    const profile = snapshot.val() as UserProfile | null;
    callback(profile);
  });
  
  return () => off(profileRef, "value", unsubscribe);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const profileRef = ref(db, `users/${uid}`);
  const snapshot = await get(profileRef);
  return snapshot.val() as UserProfile | null;
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  const profileRef = ref(db, `users/${uid}`);
  await set(profileRef, { ...updates, updatedAt: Date.now() });
}

export function generateUID(): string {
  return "user_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getDatabase, ref, set, onValue, query, orderByChild, limitToLast, get, runTransaction, update, type Database } from "firebase/database";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from "firebase/auth";
import { env } from "./env";
import {
  normalizeLeaderboardEntries,
  toLeaderboardEntry,
  type LeaderboardEntry,
  type LeaderboardPeriod,
} from "../game/leaderboardModel";

function firebaseConfigValid(): boolean {
  return !!(env.firebase.databaseURL && env.firebase.projectId);
}

export const isFirebaseAvailable = firebaseConfigValid();

let app: FirebaseApp | null = null;
let dbInstance: Database | null = null;
let authInstance: ReturnType<typeof getAuth> | null = null;

if (isFirebaseAvailable) {
  try {
    app = initializeApp({
      apiKey: env.firebase.apiKey,
      authDomain: env.firebase.authDomain,
      databaseURL: env.firebase.databaseURL,
      projectId: env.firebase.projectId,
      storageBucket: env.firebase.storageBucket,
      messagingSenderId: env.firebase.messagingSenderId,
      appId: env.firebase.appId,
    });
    dbInstance = getDatabase(app);
    authInstance = getAuth(app);
  } catch (err) {
    console.warn("[Firebase] Failed to initialize Firebase:", err);
  }
}

export const db = dbInstance;
export const auth = authInstance;
const googleProvider = authInstance ? new GoogleAuthProvider() : null;

export async function loginWithGoogle(): Promise<User> {
  if (!authInstance || !googleProvider) throw new Error("Firebase not available");
  const result = await signInWithPopup(authInstance, googleProvider);
  return result.user;
}

export async function logout(): Promise<void> {
  if (!authInstance) return;
  await signOut(authInstance);
}

export { onAuthStateChanged, type User };

export type { LeaderboardEntry, LeaderboardPeriod };

const MAX_NAME_LENGTH = 32;

function sanitizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH) || "Anonymous";
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

function guardDb(): Database {
  if (!dbInstance) throw new Error("Firebase not available");
  return dbInstance;
}

export async function submitScore(
  uid: string,
  name: string,
  score: number,
  period: LeaderboardPeriod
): Promise<void> {
  if (!isFirebaseAvailable) return;
  const safeName = name.trim().slice(0, 32) || "Anonymous";
  if (!uid.trim()) return;
  if (!Number.isFinite(score) || !Number.isInteger(score) || score < 0 || score > 100000) return;

  const now = Date.now();
  const entry: LeaderboardEntry = {
    uid,
    name: safeName,
    score,
    timestamp: now,
    period,
  };

  try {
    const _db = guardDb();
    const leaderboardRef = ref(_db, `leaderboards/${period}/${uid}`);
    await runTransaction(leaderboardRef, (current) => {
      const currentEntry = toLeaderboardEntry(current, uid, period);
      if (!currentEntry) return entry;
      if (currentEntry.score > score) {
        return { ...currentEntry, name: safeName, timestamp: currentEntry.timestamp };
      }
      return { ...entry, name: safeName };
    });

    const profileRef = ref(_db, `users/${uid}`);
    await runTransaction(profileRef, (current) => {
      const existing = current as UserProfile | null;
      const profile: UserProfile = {
        uid,
        name: safeName,
        bestScore: existing ? Math.max(existing.bestScore, score) : score,
        totalGames: existing?.totalGames || 0,
        totalCoins: existing?.totalCoins || 0,
        level: existing?.level || 1,
        xp: existing?.xp || 0,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };
      return profile;
    });
  } catch (err) { console.warn("[Firebase] submitScore failed:", err); }
}

export function subscribeLeaderboard(
  period: LeaderboardPeriod,
  callback: (entries: LeaderboardEntry[]) => void
): () => void {
  if (!isFirebaseAvailable) {
    callback([]);
    return () => {};
  }
  let _db: Database;
  try { _db = guardDb(); } catch {
    callback([]);
    return () => {};
  }
  const q = query(ref(_db, `leaderboards/${period}`), orderByChild("score"), limitToLast(100));
  return onValue(q, (snapshot) => {
    const entries: LeaderboardEntry[] = [];
    snapshot.forEach((child) => {
      const entry = toLeaderboardEntry(child.val(), child.key, period);
      if (entry) entries.push(entry);
    });
    callback(normalizeLeaderboardEntries(entries, period));
  }, (error) => {
    console.warn("[Firebase] subscribeLeaderboard error:", error);
    callback([]);
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!isFirebaseAvailable) return null;
  const _db = guardDb();
  const snapshot = await get(ref(_db, `users/${uid}`));
  return snapshot.val() as UserProfile | null;
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  if (!isFirebaseAvailable || !uid.trim()) return;
  const _db = guardDb();
  const safeUpdates: Partial<UserProfile> = { ...updates, updatedAt: Date.now() };
  if (typeof safeUpdates.name === "string") safeUpdates.name = sanitizeName(safeUpdates.name);
  if (typeof safeUpdates.bestScore === "number") safeUpdates.bestScore = Math.max(0, Math.min(100000, safeUpdates.bestScore));
  await update(ref(_db, `users/${uid}`), safeUpdates);
}

export async function addFriend(uid: string, friendUid: string): Promise<void> {
  if (!isFirebaseAvailable || uid === friendUid) return;
  const _db = guardDb();
  await set(ref(_db, `friends/${uid}/${friendUid}`), true);
}

export async function removeFriend(uid: string, friendUid: string): Promise<void> {
  if (!isFirebaseAvailable) return;
  const _db = guardDb();
  await set(ref(_db, `friends/${uid}/${friendUid}`), null);
}

export function subscribeFriends(uid: string, callback: (friendUids: string[]) => void): () => void {
  if (!isFirebaseAvailable) {
    callback([]);
    return () => {};
  }
  let _db: Database;
  try { _db = guardDb(); } catch {
    callback([]);
    return () => {};
  }
  return onValue(ref(_db, `friends/${uid}`), (snapshot) => {
    const data = snapshot.val();
    callback(data ? Object.keys(data) : []);
  }, (error) => {
    console.warn("[Firebase] subscribeFriends error:", error);
    callback([]);
  });
}

export async function searchUserByUid(uid: string): Promise<UserProfile | null> {
  return getUserProfile(uid);
}

export function generateUID(): string {
  if (globalThis.crypto?.randomUUID) {
    return `user_${globalThis.crypto.randomUUID()}`;
  }

  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    const random = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `user_${random}`;
  }

  return `user_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

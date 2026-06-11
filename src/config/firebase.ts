import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push, onValue, query, orderByChild, limitToLast, get, runTransaction } from "firebase/database";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from "firebase/auth";
import {
  normalizeLeaderboardEntries,
  toLeaderboardEntry,
  type LeaderboardEntry,
  type LeaderboardPeriod,
} from "../game/leaderboardModel";

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
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged, type User };

export type { LeaderboardEntry, LeaderboardPeriod };

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
  
  // Use UID as key to ensure one entry per player per period
  const leaderboardRef = ref(db, `leaderboards/${period}/${uid}`);
  await runTransaction(leaderboardRef, (current) => {
    const currentEntry = toLeaderboardEntry(current, uid, period);
    if (!currentEntry) return entry;
    if (currentEntry.score > score) return current;
    if (currentEntry.score === score) {
      return {
        ...currentEntry,
        name: safeName,
        timestamp: currentEntry.timestamp,
      };
    }
    return entry;
  });
  
  // Also update user profile
  const profileRef = ref(db, `users/${uid}`);
  await runTransaction(profileRef, (current) => {
    const existing = current as UserProfile | null;
    const profile: UserProfile = {
      uid,
      name: safeName,
      bestScore: existing ? Math.max(existing.bestScore, score) : score,
      // totalGames is managed by the App client to avoid multi-counting across periods
      totalGames: existing?.totalGames || 0,
      totalCoins: existing?.totalCoins || 0,
      level: existing?.level || 1,
      xp: existing?.xp || 0,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    return profile;
  });
}

export function subscribeLeaderboard(
  period: LeaderboardPeriod,
  callback: (entries: LeaderboardEntry[]) => void
): () => void {
  const leaderboardRef = ref(db, `leaderboards/${period}`);
  // Since we use UID keys now, we can just query the top scores
  const q = query(leaderboardRef, orderByChild("score"), limitToLast(100));
  
  const unsubscribe = onValue(q, (snapshot) => {
    const entries: LeaderboardEntry[] = [];
    snapshot.forEach((child) => {
      const entry = toLeaderboardEntry(child.val(), child.key, period);
      if (entry) entries.push(entry);
    });
    callback(normalizeLeaderboardEntries(entries, period));
  });
  
  return unsubscribe;
}

export function subscribeUserProfile(uid: string, callback: (profile: UserProfile | null) => void): () => void {
  const profileRef = ref(db, `users/${uid}`);
  
  const unsubscribe = onValue(profileRef, (snapshot) => {
    const profile = snapshot.val() as UserProfile | null;
    callback(profile);
  });
  
  return unsubscribe;
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

export async function addFriend(uid: string, friendUid: string): Promise<void> {
  if (uid === friendUid) return;
  const friendRef = ref(db, `friends/${uid}/${friendUid}`);
  await set(friendRef, true);
}

export async function removeFriend(uid: string, friendUid: string): Promise<void> {
  const friendRef = ref(db, `friends/${uid}/${friendUid}`);
  await set(friendRef, null);
}

export function subscribeFriends(uid: string, callback: (friendUids: string[]) => void): () => void {
  const friendsRef = ref(db, `friends/${uid}`);
  return onValue(friendsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    callback(Object.keys(data));
  });
}

export async function searchUserByUid(uid: string): Promise<UserProfile | null> {
  return getUserProfile(uid);
}

export interface ChatMessage {
  id: string;
  uid: string;
  name: string;
  text: string;
  timestamp: number;
}

export async function sendMessage(uid: string, name: string, text: string): Promise<void> {
  const chatRef = ref(db, "chat");
  const newMessageRef = push(chatRef);
  await set(newMessageRef, {
    uid,
    name,
    text,
    timestamp: Date.now(),
  });
}

export function subscribeChat(callback: (messages: ChatMessage[]) => void): () => void {
  const chatRef = query(ref(db, "chat"), orderByChild("timestamp"), limitToLast(50));
  return onValue(chatRef, (snapshot) => {
    const messages: ChatMessage[] = [];
    snapshot.forEach((child) => {
      messages.push({ id: child.key!, ...child.val() } as ChatMessage);
    });
    callback(messages);
  });
}

export function generateUID(): string {
  return "user_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

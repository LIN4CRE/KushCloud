import {
  LeaderboardPeriod, subscribeLeaderboard, submitScore, generateUID,
  getUserProfile, updateUserProfile, UserProfile, addFriend as addFriendDb,
  removeFriend as removeFriendDb, subscribeFriends as subscribeFriendsDb,
  searchUserByUid
} from "../config/firebase";
import type { LeaderboardEntry } from "../config/firebase";
import { calculateRank, normalizeLeaderboardEntries } from "./leaderboardModel";

let currentUID: string | null = null;
let unsubscribers: (() => void)[] = [];
let friendCache: string[] = [];
let authUidOverride: string | null = null;

/** Use the Firebase Auth UID (from Google sign-in) instead of the local random UID.
 *  Call this when auth state changes so the same identity is used across platforms. */
export function setAuthUid(uid: string | null) {
  authUidOverride = uid;
  if (uid) {
    currentUID = uid;
    localStorage.setItem("kushcloud_uid", uid);
  } else {
    currentUID = null;
  }
}

export function getUID(): string {
  if (authUidOverride) return authUidOverride;
  if (!currentUID) {
    try {
      const stored = localStorage.getItem("kushcloud_uid");
      if (stored) {
        currentUID = stored;
      } else {
        currentUID = generateUID();
        localStorage.setItem("kushcloud_uid", currentUID);
      }
    } catch {
      currentUID = generateUID();
    }
  }
  return currentUID;
}

export function setUID(uid: string) {
  currentUID = uid;
  localStorage.setItem("kushcloud_uid", uid);
}

export interface LeaderboardServiceEntry {
  uid?: string;
  name: string;
  score: number;
  you?: boolean;
  friend?: boolean;
  timestamp?: number;
}

function sortServiceEntries(entries: LeaderboardServiceEntry[]): LeaderboardServiceEntry[] {
  return entries.sort((a, b) => (
    b.score - a.score ||
    Number(Boolean(b.you)) - Number(Boolean(a.you)) ||
    (a.uid || "").localeCompare(b.uid || "") ||
    a.name.localeCompare(b.name)
  ));
}

export function subscribeToLeaderboard(
  period: LeaderboardPeriod,
  playerName: string,
  playerScore: number,
  friendsOnly: boolean,
  callback: (entries: LeaderboardServiceEntry[]) => void
): () => void {
  const uid = getUID();
  let lastEntries: LeaderboardEntry[] = [];

  const emit = (entries: LeaderboardEntry[], friendUids: string[]) => {
    lastEntries = entries;
    const mapped: LeaderboardServiceEntry[] = entries.map((e) => ({
      uid: e.uid,
      name: e.name,
      score: e.score,
      you: e.uid === uid,
      friend: friendUids.includes(e.uid),
    }));
    const myEntry = mapped.find((e) => e.you);
    if (myEntry) {
      if (playerScore > myEntry.score) {
        myEntry.score = playerScore;
        sortServiceEntries(mapped);
      }
      myEntry.friend = false;
    } else {
      mapped.push({ uid, name: playerName, score: playerScore, you: true, friend: false });
      sortServiceEntries(mapped);
    }
    const finalList = friendsOnly
      ? mapped.filter((e) => e.you || e.friend)
      : mapped;
    callback(finalList.slice(0, 50));
    
    try {
      const cache = finalList.map((e) => ({
        uid: e.uid,
        name: e.name,
        score: e.score,
        timestamp: Date.now(),
      }));
      localStorage.setItem("kushcloud_leaderboard_cache", JSON.stringify(cache));
    } catch { /* localStorage quota or permission error */ }
  };

  const friendUnsub = subscribeFriends((friendUids) => {
    friendCache = friendUids;
    if (lastEntries.length > 0) {
      emit(lastEntries, friendUids);
    }
  });

  const unsub = subscribeLeaderboard(period, (entries) => {
    emit(entries, friendCache);
  });

  unsubscribers.push(unsub, friendUnsub);
  return () => {
    unsub();
    friendUnsub();
    unsubscribers = unsubscribers.filter((u) => u !== unsub && u !== friendUnsub);
  };
}

export async function addFriend(friendUid: string): Promise<void> {
  const uid = getUID();
  await addFriendDb(uid, friendUid);
}

export async function removeFriend(friendUid: string): Promise<void> {
  const uid = getUID();
  await removeFriendDb(uid, friendUid);
}

export function subscribeFriends(callback: (friendUids: string[]) => void): () => void {
  const uid = getUID();
  const unsub = subscribeFriendsDb(uid, callback);
  unsubscribers.push(unsub);
  return () => {
    unsub();
    unsubscribers = unsubscribers.filter((u) => u !== unsub);
  };
}

export async function findUser(uid: string): Promise<UserProfile | null> {
  return searchUserByUid(uid);
}

export function cleanupSubscriptions() {
  unsubscribers.forEach((unsub) => unsub());
  unsubscribers = [];
}

export async function submitPlayerScore(
  playerName: string,
  score: number,
  period: LeaderboardPeriod
): Promise<void> {
  const uid = getUID();
  if (!uid) return;
  await submitScore(uid, playerName, score, period);
}

export async function loadUserProfile(): Promise<UserProfile | null> {
  const uid = getUID();
  return getUserProfile(uid);
}

export async function updateUserProfileData(updates: Partial<UserProfile>): Promise<void> {
  const uid = getUID();
  await updateUserProfile(uid, updates);
}

export async function getLeaderboard(
  period: LeaderboardPeriod,
  playerName: string,
  playerScore: number,
  friendsOnly: boolean
): Promise<LeaderboardServiceEntry[]> {
  try {
    return await new Promise<LeaderboardServiceEntry[]>((resolve) => {
      const timeout = setTimeout(() => {
        resolve(getLocalLeaderboard(period, playerName, playerScore, friendsOnly));
      }, 2000);

      const unsub = subscribeToLeaderboard(period, playerName, playerScore, friendsOnly, (list) => {
        clearTimeout(timeout);
        resolve(list);
        unsub();
      });
    });
  } catch {
    console.warn("[Leaderboard] getLeaderboard error");
    const localAll = getLocalAllLeaderboards();
    if (localAll.length > 0) {
      const mapped: LeaderboardServiceEntry[] = localAll.map((e) => ({
        uid: e.uid,
        name: e.name,
        score: e.score,
        you: e.uid === getUID(),
        friend: e.uid ? friendCache.includes(e.uid) : false,
      }));
      const myEntry = mapped.find((e) => e.you);
      if (myEntry) {
        if (playerScore > myEntry.score) {
          myEntry.score = playerScore;
          sortServiceEntries(mapped);
        }
        myEntry.friend = false;
      } else {
        mapped.push({ uid: getUID(), name: playerName, score: playerScore, you: true, friend: false });
        sortServiceEntries(mapped);
      }
      const finalList = friendsOnly
        ? mapped.filter((e) => e.you || e.friend)
        : mapped;
      return finalList.slice(0, 50);
    }
    return getLocalLeaderboard(period, playerName, playerScore, friendsOnly);
  }
}

export async function getRank(period: LeaderboardPeriod, playerScore: number): Promise<number> {
  const uid = getUID();
  try {
    return new Promise((resolve) => {
      const unsub = subscribeLeaderboard(period, (entries) => {
        resolve(calculateRank(entries, uid, playerScore));
        unsub();
      });
      setTimeout(() => resolve(getLocalRank(playerScore)), 1500);
    });
  } catch (error) {
    console.warn("[Leaderboard] getRank error:", error);
    const localAll = getLocalAllLeaderboards();
    if (localAll.length > 0) {
      const entries = localAll.filter((e): e is LeaderboardServiceEntry & { uid: string } => !!e.uid).map((e) => ({
        uid: e.uid,
        name: e.name,
        score: e.score,
        timestamp: e.timestamp || Date.now(),
        period,
      }));
      return calculateRank(entries, uid, playerScore);
    }
    return getLocalRank(playerScore);
  }
}

export async function bragAboutScore(
  period: LeaderboardPeriod,
  playerName: string,
  playerScore: number,
  playerRank: number,
): Promise<string> {
  const uid = getUID();
  const localAll = getLocalAllLeaderboards();
  
  let topThree: LeaderboardServiceEntry[] = [];
  if (localAll.length > 0) {
    const entries = localAll.map((e) => ({
      uid: e.uid,
      name: e.name,
      score: e.score,
      timestamp: e.timestamp || Date.now(),
      period,
    }));
    const normalized = normalizeLeaderboardEntries(entries, period);
    topThree = normalized.slice(0, 3);
  }
  
  const myEntry = topThree.find((e) => e.uid === uid);
  if (!myEntry) {
    topThree.push({
      uid,
      name: playerName,
      score: playerScore,
      timestamp: Date.now(),
    });
    topThree.sort((a, b) => b.score - a.score || (b.timestamp || 0) - (a.timestamp || 0));
    topThree = topThree.slice(0, 3);
  }
  
  const bragText = `🏆 I just made it to the #${playerRank} spot on the KushCloud leaderboard!

`;
  
  const topThreeText = topThree.map((e, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
    const isMe = e.uid === uid;
    const prefix = isMe ? "👤 " : "";
    return `${medal} ${prefix}${e.name}: ${e.score.toLocaleString()} points`;
  }).join("\n");
  
  const footer = `\nPlay KushCloud and challenge me! Use code: KU${Math.random().toString(36).substring(2, 8).toUpperCase()}\n`;
  
  return bragText + topThreeText + footer;
}

export async function copyBragToClipboard(
  period: LeaderboardPeriod,
  playerName: string,
  playerScore: number,
  playerRank: number,
): Promise<boolean> {
  try {
    const bragText = await bragAboutScore(period, playerName, playerScore, playerRank);
    
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(bragText);
      return true;
    } else {
      console.warn("[Leaderboard] Clipboard API not available, falling back to localStorage");
      localStorage.setItem("kushcloud_brag_text", bragText);
      return true;
    }
  } catch (error) {
    console.warn("[Leaderboard] Failed to copy brag to clipboard:", error);
    return false;
  }
}

export function getLocalLeaderboard(
  _period: LeaderboardPeriod,
  playerName: string,
  playerScore: number,
  friendsOnly: boolean
): LeaderboardServiceEntry[] {
  const all = [{ uid: getUID(), name: playerName, score: playerScore, you: true }];
  return friendsOnly
    ? all.filter((e) => e.you || friendCache.includes(e.uid!))
    : all;
}

function getLocalRank(playerScore: number): number {
  return playerScore > 0 ? 1 : 0;
}

function getLocalAllLeaderboards(): LeaderboardServiceEntry[] {
  try {
    const raw = localStorage.getItem("kushcloud_leaderboard_cache");
    if (!raw) return [];
    const cached: LeaderboardServiceEntry[] = JSON.parse(raw);
    if (!Array.isArray(cached)) return [];
    const now = Date.now();
    const validEntries = cached.filter((e) => {
      const age = now - (e.timestamp || 0);
      return age < 24 * 60 * 60 * 1000;
    });
    return validEntries.sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
}

export { getLocalAllLeaderboards, getLocalRank };

// ─── URL-based friend score sharing (no Firebase needed) ─────────────
// Encode a score into a URL. Friends open the link and the score is
// imported into their local leaderboard — no server required.
// Format: ?kc=<base64 of JSON {n, s, k, d}>

export function encodeScoreLink(name: string, score: number, skinEmoji: string): string {
  const payload = { n: name, s: score, k: skinEmoji, d: Date.now() };
  const encoded = encodeURIComponent(JSON.stringify(payload));
  const base = btoa(encoded);
  const origin = window.location.origin + window.location.pathname;
  return `${origin}?kc=${base}`;
}

export interface ImportedScore {
  name: string;
  score: number;
  skin: string;
  date: number;
}

export function decodeScoreFromURL(): ImportedScore | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const kc = params.get("kc");
    if (!kc) return null;

    const decoded = decodeURIComponent(atob(kc));
    const payload = JSON.parse(decoded);

    if (typeof payload.n !== "string" || payload.n.length === 0 || payload.n.length > 20) return null;
    if (typeof payload.s !== "number" || !Number.isFinite(payload.s) || payload.s < 0 || payload.s > 100000) return null;
    if (typeof payload.k !== "string") return null;

    return {
      name: payload.n.slice(0, 20),
      score: Math.floor(payload.s),
      skin: payload.k || "🌿",
      date: typeof payload.d === "number" ? payload.d : Date.now(),
    };
  } catch {
    return null;
  }
}

const FRIEND_SCORES_KEY = "kushcloud_friend_scores";

function loadFriendScores(): LeaderboardServiceEntry[] {
  try {
    const raw = localStorage.getItem(FRIEND_SCORES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFriendScores(scores: LeaderboardServiceEntry[]) {
  try {
    localStorage.setItem(FRIEND_SCORES_KEY, JSON.stringify(scores));
  } catch { /* storage full */ }
}

export function importFriendScore(imported: ImportedScore): boolean {
  const friends = loadFriendScores();
  const existing = friends.findIndex(f => f.name === imported.name);
  if (existing >= 0) {
    if (imported.score > friends[existing].score) {
      friends[existing] = { uid: `friend_${imported.name}`, name: imported.name, score: imported.score, friend: true, timestamp: imported.date };
      saveFriendScores(friends);
      return true;
    }
    return false;
  }
  friends.push({ uid: `friend_${imported.name}`, name: imported.name, score: imported.score, friend: true, timestamp: imported.date });
  saveFriendScores(friends);
  return true;
}

export function getFriendScores(): LeaderboardServiceEntry[] {
  return loadFriendScores();
}

export function cleanURL() {
  const url = new URL(window.location.href);
  url.searchParams.delete("kc");
  window.history.replaceState({}, "", url.pathname + url.hash);
}

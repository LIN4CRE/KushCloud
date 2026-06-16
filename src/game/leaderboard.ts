import {
  LeaderboardPeriod, subscribeLeaderboard, submitScore, generateUID,
  getUserProfile, updateUserProfile, UserProfile, addFriend as addFriendDb,
  removeFriend as removeFriendDb, subscribeFriends as subscribeFriendsDb,
  searchUserByUid
} from "../config/firebase";
import type { LeaderboardEntry } from "../config/firebase";
import { calculateRank } from "./leaderboardModel";

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

  const emit = (entries: LeaderboardEntry[], friendUids: string[]) => {
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
    } catch {}
  };

  const friendUnsub = subscribeFriends((friendUids) => {
    friendCache = friendUids;
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
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(getLocalLeaderboard(period, playerName, playerScore, friendsOnly));
      }, 2000);

      const unsub = subscribeToLeaderboard(period, playerName, playerScore, friendsOnly, (list) => {
        clearTimeout(timeout);
        callback(list);
        unsub();
      });
      function callback(list: LeaderboardServiceEntry[]) {
        resolve(list);
      }
    });
  } catch (error) {
    console.warn("[Leaderboard] getLeaderboard error:", error);
    const localAll = getLocalAllLeaderboards();
    if (localAll.length > 0) {
      const mapped: LeaderboardServiceEntry[] = localAll.map((e) => ({
        uid: e.uid,
        name: e.name,
        score: e.score,
        you: e.uid === getUID(),
        friend: friendCache.includes(e.uid),
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
      const entries = localAll.map((e) => ({
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
  friendCount: number = 0
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
      period,
    });
    topThree.sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);
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
  friendCount: number = 0
): Promise<boolean> {
  try {
    const bragText = await bragAboutScore(period, playerName, playerScore, playerRank, friendCount);
    
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
    const uid = getUID();
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

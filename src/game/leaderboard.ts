import {
  LeaderboardPeriod, subscribeLeaderboard, submitScore, generateUID,
  getUserProfile, updateUserProfile, UserProfile, addFriend as addFriendDb,
  removeFriend as removeFriendDb, subscribeFriends as subscribeFriendsDb,
  searchUserByUid
} from "../config/firebase";
import type { LeaderboardEntry } from "../config/firebase";
import { seededScores } from "./storage";
import { calculateRank } from "./leaderboardModel";

let currentUID: string | null = null;
let unsubscribers: (() => void)[] = [];
let friendCache: string[] = [];

export function getUID(): string {
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
  };

  const friendUnsub = subscribeFriends((friendUids) => {
    friendCache = friendUids;
  });

  const unsub = subscribeLeaderboard(period, (entries) => {
    if (entries.length > 0) {
      emit(entries, friendCache);
    } else {
      const localEntries: LeaderboardEntry[] = seededScores(period).map((s) => ({
        uid: s.name,
        name: s.name,
        score: s.score,
        timestamp: Date.now(),
        period,
      }));
      emit(localEntries, friendCache);
    }
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
  } catch {
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
      setTimeout(() => resolve(getLocalRank(period, playerScore)), 1500);
    });
  } catch {
    return getLocalRank(period, playerScore);
  }
}

export function getLocalLeaderboard(
  period: LeaderboardPeriod,
  playerName: string,
  playerScore: number,
  friendsOnly: boolean
): LeaderboardServiceEntry[] {
  const list = seededScores(period);
  const all = sortServiceEntries([...list, { uid: getUID(), name: playerName, score: playerScore, you: true }]);
  return friendsOnly
    ? all.filter((e) => e.you || friendCache.includes(e.uid!))
    : all;
}

function getLocalRank(period: LeaderboardPeriod, playerScore: number): number {
  const list = seededScores(period);
  const all = [...list.map((e) => e.score), playerScore].sort((a, b) => b - a);
  return all.indexOf(playerScore) + 1;
}

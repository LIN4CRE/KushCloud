import { LeaderboardPeriod, subscribeLeaderboard, submitScore, generateUID, getUserProfile, updateUserProfile, UserProfile } from "../config/firebase";
import { seededScores, FRIEND_NAMES } from "./storage";

let currentUID: string | null = null;
let unsubscribers: (() => void)[] = [];

export function getUID(): string {
  if (!currentUID) {
    const stored = localStorage.getItem("kushcloud_uid");
    if (stored) {
      currentUID = stored;
    } else {
      currentUID = generateUID();
      localStorage.setItem("kushcloud_uid", currentUID);
    }
  }
  return currentUID;
}

export function setUID(uid: string) {
  currentUID = uid;
  localStorage.setItem("kushcloud_uid", uid);
}

export interface LeaderboardServiceEntry {
  name: string;
  score: number;
  you?: boolean;
  friend?: boolean;
}

export function subscribeToLeaderboard(
  period: LeaderboardPeriod,
  playerName: string,
  playerScore: number,
  _friendsOnly: boolean,
  callback: (entries: LeaderboardServiceEntry[]) => void
): () => void {
  const uid = getUID();
  
  const unsub = subscribeLeaderboard(period, (entries) => {
    const list: LeaderboardServiceEntry[] = entries.map((e) => ({
      name: e.name,
      score: e.score,
      you: e.uid === uid,
      friend: false,
    }));
    
    // Add player if not in list
    if (!list.some((e) => e.you)) {
      list.push({ name: playerName, score: playerScore, you: true });
    }
    
    list.sort((a, b) => b.score - a.score);
    callback(list.slice(0, 50));
  });
  
  unsubscribers.push(unsub);
  return () => {
    unsub();
    unsubscribers = unsubscribers.filter((u) => u !== unsub);
  };
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
        resolve(list);
        unsub(); // One-time get for this function
      });
    });
  } catch {
    return getLocalLeaderboard(period, playerName, playerScore, friendsOnly);
  }
}

export async function getRank(period: LeaderboardPeriod, playerScore: number): Promise<number> {
  try {
    return new Promise((resolve) => {
      const unsub = subscribeLeaderboard(period, (entries) => {
        resolve(entries.findIndex((e) => e.score === playerScore) + 1 || 1);
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
  const all = [...list, { name: playerName, score: playerScore, you: true }]
    .sort((a, b) => b.score - a.score);
  return friendsOnly ? all.filter((e) => e.name === playerName || FRIEND_NAMES.includes(e.name)) : all;
}

function getLocalRank(period: LeaderboardPeriod, playerScore: number): number {
  const list = seededScores(period);
  const all = [...list.map((e) => e.score), playerScore].sort((a, b) => b - a);
  return all.indexOf(playerScore) + 1;
}

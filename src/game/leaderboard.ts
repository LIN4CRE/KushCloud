import { LeaderboardPeriod, subscribeLeaderboard, submitScore, generateUID, getUserProfile, updateUserProfile, UserProfile } from "../config/firebase";

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

export async function getLocalLeaderboard(
  period: LeaderboardPeriod,
  playerName: string,
  playerScore: number,
  friendsOnly: boolean
): Promise<LeaderboardServiceEntry[]> {
  // Fallback to local simulated leaderboard
  const { getLeaderboard: localLb } = await import("./storage");
  return localLb(period, playerName, playerScore, friendsOnly);
}
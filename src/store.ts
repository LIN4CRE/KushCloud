import { useCallback, useEffect, useRef, useState } from "react";
import { loadSave, writeSave, rollDaily, SaveData, migrateSave } from "./game/storage";
import { auth, onAuthStateChanged, type User, db, isFirebaseAvailable } from "./config/firebase";
import { ref, set, get } from "firebase/database";

export type Screen =
  | "menu" | "play" | "shop" | "leaderboard"
  | "achievements" | "missions" | "profile" | "statistics" | "settings" | "tutorial" | "friends" | "chat";

export function useSave() {
  const [save, setSave] = useState<SaveData>(() => rollDaily(loadSave()));
  const [user, setUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error" | "offline">("offline");

  const saveRef = useRef(save);
  saveRef.current = save;
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  // Cloud Sync: Push local to remote
  const pushToCloud = useCallback(async (data: SaveData, uid: string) => {
    if (!isFirebaseAvailable || !db) return data;
    try {
      setSyncStatus("syncing");
      const userRef = ref(db, `saves/${uid}`);
      const cloudData = { ...data, lastCloudSync: Date.now() };
      await set(userRef, cloudData);
      setSyncStatus("synced");
      return cloudData;
    } catch (err) {
      console.error("Cloud push failed:", err);
      setSyncStatus("error");
      return data;
    }
  }, []);

  // Auth Listener
  useEffect(() => {
    if (!isFirebaseAvailable || !auth) return;
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u && db) {
        setSyncStatus("syncing");
        try {
          const userRef = ref(db, `saves/${u.uid}`);
          const snapshot = await get(userRef);
          const cloudSave = snapshot.val() as SaveData | null;

          if (cloudSave) {
            // Auto-merge: Pick the one with more XP
            const migratedCloud = migrateSave(cloudSave);
            if (migratedCloud.xp > saveRef.current.xp) {
              if (import.meta.env.DEV) console.log("Using cloud save (more XP)");
              setSave(migratedCloud);
              writeSave(migratedCloud);
            } else if (saveRef.current.xp > migratedCloud.xp) {
              if (import.meta.env.DEV) console.log("Local save is ahead, pushing to cloud");
              pushToCloud(saveRef.current, u.uid);
            } else {
              setSyncStatus("synced");
            }
          } else {
            // New user or no cloud save, push local
            if (import.meta.env.DEV) console.log("No cloud save found, pushing local progress");
            pushToCloud(saveRef.current, u.uid);
          }
        } catch (err) {
          console.error("Cloud fetch failed:", err);
          setSyncStatus("error");
        }
      } else {
        setSyncStatus("offline");
      }
    });
  }, [pushToCloud]);

  // Periodic Local Maintenance
  useEffect(() => {
    const tick = () => {
      const today = Math.floor(Date.now() / 86400000);
      if (saveRef.current.lastDay !== today || saveRef.current.lastLoginDay !== today) {
        setSave((prev) => {
          const next: SaveData = JSON.parse(JSON.stringify(prev));
          rollDaily(next);
          writeSave(next);
          return next;
        });
      }

      // Auto-sync to cloud every 5 mins if logged in
      if (userRef.current) {
        pushToCloud(saveRef.current, userRef.current.uid);
      }
    };

    tick();
    const id = window.setInterval(tick, 300_000); // 5 mins
    const onVis = () => { if (document.visibilityState === "visible") tick(); };
    window.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("visibilitychange", onVis);
    };
  }, [pushToCloud]);

  const update = useCallback(<T,>(fn: (s: SaveData) => T): T => {
    const next: SaveData = JSON.parse(JSON.stringify(saveRef.current));
    const result = fn(next);
    writeSave(next);
    saveRef.current = next;
    setSave(next);

    // Immediate push to cloud on update if logged in
    if (userRef.current) {
      pushToCloud(next, userRef.current.uid);
    }

    return result;
  }, [pushToCloud]);

  useEffect(() => {
    const onHide = () => writeSave(saveRef.current);
    window.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      window.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onHide);
    };
  }, []);

  return { save, update, user, syncStatus };
}

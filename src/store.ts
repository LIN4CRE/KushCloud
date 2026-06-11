import { useCallback, useEffect, useRef, useState } from "react";
import { loadSave, writeSave, rollDaily, SaveData } from "./game/storage";

export type Screen =
  | "menu" | "play" | "shop" | "leaderboard"
  | "achievements" | "missions" | "profile" | "statistics" | "settings" | "tutorial";

export function useSave() {
  const [save, setSave] = useState<SaveData>(() => rollDaily(loadSave()));
  const ref = useRef(save);
  ref.current = save;

  useEffect(() => {
    const tick = () => {
      const today = Math.floor(Date.now() / 86400000);
      if (ref.current.lastDay !== today || ref.current.lastLoginDay !== today) {
        setSave((prev) => {
          const next: SaveData = JSON.parse(JSON.stringify(prev));
          rollDaily(next);
          writeSave(next);
          return next;
        });
      }
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    const onVis = () => { if (document.visibilityState === "visible") tick(); };
    window.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const update = useCallback((fn: (s: SaveData) => void) => {
    setSave((prev) => {
      const next: SaveData = JSON.parse(JSON.stringify(prev));
      fn(next);
      writeSave(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const onHide = () => writeSave(ref.current);
    window.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      window.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onHide);
    };
  }, []);

  return { save, update };
}

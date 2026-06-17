import { useCallback, useEffect, useRef, useState } from "react";
import { loadSave, writeSave, type SaveData } from "./game/storage";

export type Screen = "menu" | "play" | "shop" | "leaderboard" | "settings";

export function useSave() {
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    const onHide = () => writeSave(saveRef.current);
    window.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      window.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onHide);
    };
  }, []);

  const update = useCallback(<T,>(fn: (s: SaveData) => T): T => {
    const next = JSON.parse(JSON.stringify(saveRef.current)) as SaveData;
    const result = fn(next);
    writeSave(next);
    saveRef.current = next;
    setSave(next);
    return result;
  }, []);

  return { save, update };
}

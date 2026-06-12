import { useEffect } from "react";
import { audio } from "../game/audio";
import type { SaveData } from "../game/storage";

export function useAudio(save: SaveData) {
  const musicVol = save.musicVol;

  // Initialize audio on first user interaction
  useEffect(() => {
    const start = () => {
      audio.resume();
      if (musicVol > 0) audio.startMusic();
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
    window.addEventListener("pointerdown", start);
    window.addEventListener("keydown", start);
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
  }, [musicVol]);

  // Sync volume settings
  useEffect(() => {
    audio.setMusicVol(save.musicVol);
    audio.setSfxVol(save.sfxVol);
    if (save.musicVol === 0) audio.stopMusic();
    else if (audio.isStarted) audio.startMusic();
  }, [save.musicVol, save.sfxVol]);
}

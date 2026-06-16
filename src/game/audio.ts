// Web Audio synthesized music + SFX. No external files.

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private step = 0;
  private musicVol = 0.5;
  private sfxVol = 0.8;
  private musicPlaying = false;
  private started = false;
  private intensity = 0;
  private frenzyBoost = false;
  private activeWorld = "dispensary";

  init() {
    if (this.ctx) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 1;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVol * 0.35;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVol;
      this.sfxGain.connect(this.master);
      this.started = true;
    } catch {
      this.ctx = null;
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  setMusicVol(v: number) {
    this.musicVol = v;
    if (this.musicGain) this.musicGain.gain.value = v * 0.35;
  }
  setSfxVol(v: number) {
    this.sfxVol = v;
    if (this.sfxGain) this.sfxGain.gain.value = v;
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, dest: GainNode, slide?: number) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), this.ctx.currentTime + dur);
    g.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(gain, this.ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    o.connect(g);
    g.connect(dest);
    o.start();
    o.stop(this.ctx.currentTime + dur + 0.02);
    // Disconnect nodes after playback to prevent GC pressure
    const cleanup = () => { try { o.disconnect(); g.disconnect(); } catch { /* already cleaned up */ } };
    o.addEventListener("ended", cleanup);
    setTimeout(cleanup, (dur + 0.1) * 1000);
  }

  flap() { if (this.sfxGain) this.tone(420, 0.12, "sine", 0.25, this.sfxGain, 700); }
  score() { if (this.sfxGain) { this.tone(660, 0.12, "triangle", 0.3, this.sfxGain); setTimeout(() => this.tone(880, 0.12, "triangle", 0.25, this.sfxGain!), 70); } }
  coin() { if (this.sfxGain) { this.tone(988, 0.08, "square", 0.18, this.sfxGain); setTimeout(() => this.tone(1319, 0.1, "square", 0.16, this.sfxGain!), 60); } }
  nearMiss() { if (this.sfxGain) this.tone(1200, 0.06, "sine", 0.15, this.sfxGain, 1600); }
  hit() { if (this.sfxGain) this.tone(180, 0.3, "sawtooth", 0.35, this.sfxGain, 60); }
  shieldBreak() { if (this.sfxGain) { this.tone(800, 0.08, "square", 0.3, this.sfxGain, 400); setTimeout(() => this.tone(1200, 0.12, "sine", 0.25, this.sfxGain!), 60); } }
  levelUp() { if (this.sfxGain) [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.2, "triangle", 0.25, this.sfxGain!), i * 90)); }
  reward() { if (this.sfxGain) [659, 880, 1175].forEach((f, i) => setTimeout(() => this.tone(f, 0.15, "square", 0.2, this.sfxGain!), i * 80)); }
  click() { if (this.sfxGain) this.tone(520, 0.05, "sine", 0.12, this.sfxGain); }

  crateOpen() {
    if (!this.sfxGain) return;
    [400, 500, 600, 800, 1000].forEach((f, i) => setTimeout(() => this.tone(f, 0.1, "triangle", 0.2, this.sfxGain!), i * 50));
  }

  rareDrop() {
    if (!this.sfxGain) return;
    [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => this.tone(f, 0.18, "sine", 0.25, this.sfxGain!), i * 70));
  }

  epicDrop() {
    if (!this.sfxGain) return;
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, "triangle", 0.3, this.sfxGain!), i * 80));
  }

  legendaryDrop() {
    if (!this.sfxGain) return;
    [392, 523, 659, 784, 1047, 1319, 1568, 1976].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, "sine", 0.35, this.sfxGain!), i * 60));
  }

  mythicDrop() {
    if (!this.sfxGain) return;
    [330, 392, 523, 659, 784, 1047, 1319, 1568, 1976, 2637].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, "triangle", 0.4, this.sfxGain!), i * 50));
  }

  equip() { if (this.sfxGain) this.tone(880, 0.08, "sine", 0.2, this.sfxGain); }

  // Picking up a mid-flight power-up: bright rising arpeggio.
  powerUp() {
    if (!this.sfxGain) return;
    [659, 880, 1175, 1568].forEach((f, i) => setTimeout(() => this.tone(f, 0.1, "triangle", 0.22, this.sfxGain!), i * 45));
  }

  // FRENZY trigger: punchy, exciting fanfare.
  frenzy() {
    if (!this.sfxGain) return;
    [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => this.tone(f, 0.13, "square", 0.22, this.sfxGain!), i * 55));
    setTimeout(() => { if (this.sfxGain) this.tone(1568, 0.25, "triangle", 0.3, this.sfxGain); }, 300);
  }

  // CLUTCH near-death escape: tense whoosh that resolves upward.
  clutch() {
    if (!this.sfxGain) return;
    this.tone(1400, 0.1, "sine", 0.18, this.sfxGain, 600);
    setTimeout(() => { if (this.sfxGain) this.tone(900, 0.18, "triangle", 0.22, this.sfxGain); }, 90);
  }

  milestone() {
    if (!this.sfxGain) return;
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => setTimeout(() => this.tone(f, 0.15, "triangle", 0.3, this.sfxGain!), i * 60));
  }

  worldChange() {
    if (!this.sfxGain) return;
    [392, 523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.2, "sine", 0.25, this.sfxGain!), i * 80));
  }

  purchase() {
    if (!this.sfxGain) return;
    this.tone(660, 0.1, "triangle", 0.2, this.sfxGain);
    setTimeout(() => this.tone(880, 0.1, "triangle", 0.2, this.sfxGain!), 60);
  }

  error() {
    if (!this.sfxGain) return;
    this.tone(200, 0.15, "sawtooth", 0.15, this.sfxGain, 150);
    setTimeout(() => this.tone(150, 0.2, "sawtooth", 0.15, this.sfxGain!), 120);
  }

  private beds: Record<string, { bass: number[]; chord: number[][]; mel: number[] }> = {
    dispensary: {
      bass: [110, 110, 146.83, 130.81],
      chord: [[220, 261.63, 329.63], [220, 261.63, 329.63], [293.66, 349.23, 440], [261.63, 329.63, 392]],
      mel: [440, 523.25, 392, 440, 587.33, 523.25, 392, 329.63],
    },
    grow: {
      bass: [103.83, 103.83, 130.81, 116.54],
      chord: [[207.65, 261.63, 311.13], [207.65, 261.63, 311.13], [261.63, 329.63, 392], [233.08, 293.66, 349.23]],
      mel: [466.16, 554.37, 415.3, 466.16, 622.25, 554.37, 415.3, 349.23],
    },
    smoke: {
      bass: [98, 98, 130.81, 116.54],
      chord: [[196, 246.94, 293.66], [196, 246.94, 293.66], [261.63, 329.63, 392], [233.08, 293.66, 349.23]],
      mel: [392, 493.88, 369.99, 392, 554.37, 493.88, 369.99, 329.63],
    },
    festival: {
      bass: [110, 110, 146.83, 130.81],
      chord: [[220, 277.18, 329.63], [220, 277.18, 329.63], [293.66, 369.99, 440], [261.63, 329.63, 392]],
      mel: [523.25, 659.25, 493.88, 523.25, 698.46, 659.25, 493.88, 440],
    },
    cosmos: {
      bass: [103.83, 103.83, 146.83, 123.47],
      chord: [[207.65, 261.63, 311.13], [207.65, 261.63, 311.13], [293.66, 369.99, 440], [246.94, 311.13, 369.99]],
      mel: [587.33, 739.99, 554.37, 587.33, 830.61, 739.99, 554.37, 493.88],
    },
  };

  setMusicIntensity(score: number, isFrenzy: boolean) {
    const i = score < 10 ? 0 : score < 20 ? 1 : score < 40 ? 2 : score < 60 ? 3 : 4;
    if (i !== this.intensity || isFrenzy !== this.frenzyBoost) {
      this.intensity = i;
      this.frenzyBoost = isFrenzy;
    }
  }

  setWorld(id: string) {
    if (this.beds[id]) this.activeWorld = id;
  }

  startMusic() {
    this.init();
    if (!this.ctx || this.musicPlaying) return;
    this.musicPlaying = true;
    this.step = 0;
    const loop = () => {
      if (!this.musicPlaying || !this.ctx || !this.musicGain) return;
      const bed = this.beds[this.activeWorld] || this.beds.dispensary;
      const bar = Math.floor(this.step / 4) % 4;
      const beatInBar = this.step % 4;
      const effInt = this.frenzyBoost ? Math.min(4, this.intensity + 1) : this.intensity;
      const bpm = this.frenzyBoost ? 280 : 340;

      // Layer 0 — bass (always)
      this.tone(bed.bass[bar], 0.32, "sine", 0.5, this.musicGain, bed.bass[bar]);

      // Layer 1 — chords (intensity >= 1)
      if (effInt >= 1 && (beatInBar === 0 || beatInBar === 2)) {
        bed.chord[bar].forEach((f) => this.tone(f, 0.6, "triangle", 0.12, this.musicGain!));
      }

      // Layer 2 — melody (intensity >= 2)
      if (effInt >= 2) {
        const m = bed.mel[this.step % bed.mel.length];
        if (this.step % 2 === 0) this.tone(m, 0.25, "square", effInt >= 3 ? 0.09 : 0.06, this.musicGain);
      }

      // Layer 3 — counter-melody / harmony (intensity >= 3)
      if (effInt >= 3) {
        const h = bed.mel[(this.step + 4) % bed.mel.length] * 0.5;
        if (this.step % 2 === 1) this.tone(h, 0.2, "triangle", 0.05, this.musicGain!);
      }

      // Layer 4 — arpeggio rush (intensity >= 4 or frenzy)
      if (effInt >= 4) {
        this.tone(bed.chord[bar][this.step % 3], 0.08, "square", 0.04, this.musicGain!);
      }

      this.step++;
      this.musicTimer = window.setTimeout(loop, bpm);
    };
    loop();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  get isStarted() { return this.started; }
}

export const audio = new AudioEngine();

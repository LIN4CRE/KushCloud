// Web Audio synthesized music + SFX. No external files = instant load, tiny size.

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

  init() {
    if (this.ctx) return;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
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
  }

  // ---- SFX ----
  flap() {
    if (!this.sfxGain) return;
    this.tone(420, 0.12, "sine", 0.25, this.sfxGain, 700);
  }
  score() {
    if (!this.sfxGain) return;
    this.tone(660, 0.12, "triangle", 0.3, this.sfxGain);
    setTimeout(() => this.tone(880, 0.12, "triangle", 0.25, this.sfxGain!), 70);
  }
  coin() {
    if (!this.sfxGain) return;
    this.tone(988, 0.08, "square", 0.18, this.sfxGain);
    setTimeout(() => this.tone(1319, 0.1, "square", 0.16, this.sfxGain!), 60);
  }
  nearMiss() {
    if (!this.sfxGain) return;
    this.tone(1200, 0.06, "sine", 0.15, this.sfxGain, 1600);
  }
  hit() {
    if (!this.sfxGain) return;
    this.tone(180, 0.3, "sawtooth", 0.35, this.sfxGain, 60);
  }
  levelUp() {
    if (!this.sfxGain) return;
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.2, "triangle", 0.25, this.sfxGain!), i * 90));
  }
  reward() {
    if (!this.sfxGain) return;
    [659, 880, 1175].forEach((f, i) => setTimeout(() => this.tone(f, 0.15, "square", 0.2, this.sfxGain!), i * 80));
  }
  click() {
    if (!this.sfxGain) return;
    this.tone(520, 0.05, "sine", 0.12, this.sfxGain);
  }

  // ---- Music: mellow lo-fi loop ----
  private bass = [110, 110, 146.83, 130.81]; // A2 A2 D3 C3 (per bar)
  private chord = [
    [220, 261.63, 329.63], // Am
    [220, 261.63, 329.63],
    [293.66, 349.23, 440], // Dm
    [261.63, 329.63, 392], // C
  ];
  private mel = [440, 523.25, 392, 440, 587.33, 523.25, 392, 329.63];

  startMusic() {
    this.init();
    if (!this.ctx || this.musicPlaying) return;
    this.musicPlaying = true;
    const beat = 340; // ms per step
    const loop = () => {
      if (!this.musicPlaying || !this.ctx || !this.musicGain) return;
      const bar = Math.floor(this.step / 4) % 4;
      const beatInBar = this.step % 4;
      // bass on each beat
      this.tone(this.bass[bar], 0.32, "sine", 0.5, this.musicGain, this.bass[bar]);
      // chord pad on beat 0 & 2
      if (beatInBar === 0 || beatInBar === 2) {
        this.chord[bar].forEach((f) => this.tone(f, 0.6, "triangle", 0.12, this.musicGain!));
      }
      // melody plucks
      const m = this.mel[this.step % this.mel.length];
      if (this.step % 2 === 0) this.tone(m, 0.25, "square", 0.06, this.musicGain);
      this.step++;
      this.musicTimer = window.setTimeout(loop, beat);
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

  get isStarted() {
    return this.started;
  }
}

export const audio = new AudioEngine();

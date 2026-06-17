import { Skin, Trail, World, worldForScore, POWERUPS } from "./data";
import { audio } from "./audio";
import { PowerUpManager } from "./powerups";

// Power-ups that can spawn as mid-run pickups (the cosmetic/utility ones —
// no shields here so the dramatic shield save stays a deliberate shop purchase).
const PICKUP_POOL: { id: string; color: string }[] = [
  { id: "pu_coin", color: "#c084fc" },
  { id: "pu_coin2", color: "#f472b6" },
  { id: "pu_magnet", color: "#34d399" },
  { id: "pu_double", color: "#fbbf24" },
];

export interface RunResult {
  runId: string;
  score: number;
  coins: number;
  nearMiss: number;
  perfectPasses: number;
  bestCombo: number;
  durationMs: number;
  flaps: number;
  /** Number of extremely-tight "clutch" escapes during the run. */
  clutch?: number;
}

export type GameState = "ready" | "playing" | "dead";

type PipePattern = "standard" | "moving";

interface Pipe {
  x: number;
  gapY: number;
  gap: number;
  w: number;
  passed: boolean;
  nearChecked: boolean;
  coin?: { y: number; taken: boolean; bob: number };
  scored: boolean;
  pattern: PipePattern;
  baseGapY: number;
  oscAmp: number;
  oscPhase: number;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number; color: string; kind: string; rot: number; vr: number;
}

interface FloatText {
  x: number; y: number; vy: number; life: number; text: string; color: string; size: number;
}

// A power-up token that floats across the screen mid-run. Flying into it
// activates the corresponding effect via the PowerUpManager.
interface PowerUpPickup {
  x: number;
  y: number;
  bob: number;
  taken: boolean;
  id: string;
  icon: string;
  color: string;
}

export interface EngineCallbacks {
  onScore?: (score: number) => void;
  onCoin?: (runCoins: number) => void;
  onNearMiss?: (count: number) => void;
  onPerfectPass?: (count: number) => void;
  onCombo?: (mult: number) => void;
  onDeath?: (result: RunResult) => void;
  onWorld?: (world: World) => void;
  onStateChange?: (state: GameState) => void;
  /** Fired when the player flies into a mid-run power-up token. */
  onPowerUp?: (id: string, name: string) => void;
  /** Fired when FRENZY mode starts (true) or ends (false). */
  onFrenzy?: (active: boolean, remainingMs: number) => void;
  /** Fired on a clutch (very-near-death) escape, with the bonus awarded. */
  onClutch?: (count: number) => void;
}

export class GameEngine {
  private w = 360;
  private h = 640;
  private sc = 1;
  state: GameState = "ready";

  // bird
  private bx = 0; private by = 0; private vy = 0; private radius = 16; private rot = 0;
  private wingPhase = 0;

  // world physics — between original (brutal) and v3.3 (tighter)
  private gravity = 1450;
  private flapV = -495;
  private speed = 128;

  private pipes: Pipe[] = [];
  private particles: Particle[] = [];
  private floats: FloatText[] = [];
  private groundOffset = 0;
  private decor: { x: number; y: number; s: number; type: number; spd: number }[] = [];

  // parallax mountain layers
  private mountains: { x: number; h: number; w: number; layer: number }[] = [];
  // background stars (for cosmos world)
  private stars: { x: number; y: number; s: number; blink: number }[] = [];

  // scoring
  score = 0;
  runCoins = 0;
  nearMiss = 0;
  perfectPasses = 0;
  combo = 0; // consecutive successes
  bestCombo = 1;
  multiplier = 1;
  private flaps = 0;
  private startTime = 0;
  private runId = "";

  private skin: Skin;
  private trail: Trail;
  private world: World;
  private cb: EngineCallbacks;
  private reducedMotion = false;
  private highContrast = false;
  private practiceMode = false;
  private shake = 0;
  private flashAlpha = 0;
  private shieldInvuln = 0;
  private powerUpManager = new PowerUpManager();

  // squash & stretch
  private squashX = 1;
  private squashY = 1;

  // score milestone tracker
  private lastMilestone = 0;
  // speed lines
  private speedLines: { x: number; y: number; len: number; speed: number }[] = [];
  // new best indicator
  bestScoreBefore = 0;

  // --- mid-run power-up pickups ---
  private pickups: PowerUpPickup[] = [];
  private nextPickupScore = 8; // first pickup window

  // --- streak gate / FRENZY (double points after a perfect streak) ---
  private   perfectStreak = 0;
  frenzyTimer = 0;
  private readonly FRENZY_STREAK_GOAL = 3; // perfects in a row to trigger
  private readonly FRENZY_DURATION = 6; // seconds
  private readonly SPEED_CHALLENGE_SCORE = 30; // score threshold for speed challenges
  private readonly TIME_LIMIT = 90; // seconds for normal runs
  private readonly EXTREME_TIME_LIMIT = 45; // seconds for high scores
  private timeRemaining = 0;
  private timeWarningThreshold = 15; // seconds before showing warning
  clutch = 0; // count of clutch escapes this run
  // grace period — prevents instant death on first flap
  private graceTimer = 0;
  private readonly GRACE_PERIOD = 0.4;
  private lastIntensityScore = -1;
  private lastFrenzyActive = false;
  private lastIntensityFrenzy = false;

  constructor(skin: Skin, trail: Trail, world: World, cb: EngineCallbacks) {
    this.skin = skin;
    this.trail = trail;
    this.world = world;
    this.cb = cb;
    this.initDecor();
  }

  setCosmetics(skin: Skin, trail: Trail) {
    this.skin = skin;
    this.trail = trail;
  }
  setAccessibility(reducedMotion: boolean, highContrast: boolean) {
    this.reducedMotion = reducedMotion;
    this.highContrast = highContrast;
  }

  setPracticeMode(on: boolean) {
    this.practiceMode = on;
    if (on) {
      this.timeRemaining = 999999;
    } else {
      this.timeRemaining = this.score >= this.SPEED_CHALLENGE_SCORE ? this.EXTREME_TIME_LIMIT : this.TIME_LIMIT;
    }
  }

  getTimeRemaining() {
    return this.timeRemaining;
  }

  isTimeWarning() {
    return this.timeRemaining > 0 && this.timeRemaining <= this.timeWarningThreshold;
  }

  setPowerUpManager(m: PowerUpManager) {
    this.powerUpManager = m;
    this.powerUpManager.reset();
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.sc = Math.max(0.7, Math.min(1.8, h / 640));
    this.radius = 17 * this.sc;
    this.bx = w * 0.3;
    if (this.state === "ready") this.by = h * 0.45;
    this.initDecor();
  }

  private initDecor() {
    this.decor = [];
    this.mountains = [];
    this.stars = [];
    const n = 6;
    for (let i = 0; i < n; i++) {
      this.decor.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h * 0.6,
        s: 0.5 + Math.random() * 1.2,
        type: Math.floor(Math.random() * 3),
        spd: 0.15 + Math.random() * 0.3,
      });
    }
    // parallax mountain silhouettes (3 layers)
    for (let layer = 0; layer < 3; layer++) {
      const count = 4 + layer * 2;
      for (let i = 0; i < count; i++) {
        this.mountains.push({
          x: (i / count) * (this.w + 200) - 100,
          h: (60 + Math.random() * 80) * this.sc * (1 - layer * 0.25),
          w: (80 + Math.random() * 120) * this.sc,
          layer,
        });
      }
    }
    // stars for cosmos world
    for (let i = 0; i < 50; i++) {
      this.stars.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h * 0.7,
        s: 0.5 + Math.random() * 2,
        blink: Math.random() * Math.PI * 2,
      });
    }
  }

  setRunId(runId: string) {
    this.runId = runId;
  }

  reset(runId = this.runId) {
    this.runId = runId;
    this.state = "ready";
    this.by = this.h * 0.45;
    this.vy = 0;
    this.rot = 0;
    this.wingPhase = 0;
    this.pipes = [];
    this.particles = [];
    this.floats = [];
    this.score = 0;
    this.runCoins = 0;
    this.nearMiss = 0;
    this.perfectPasses = 0;
    this.combo = 0;
    this.bestCombo = 1;
    this.multiplier = 1;
    this.flaps = 0;
    this.speed = 128;
    this.shake = 0;
    this.flashAlpha = 0;
    this.shieldInvuln = 0;
    this.powerUpManager.reset();
    this.world = worldForScore(0);
    this.squashX = 1;
    this.squashY = 1;
    this.lastMilestone = 0;
    this.speedLines = [];
    this.bestScoreBefore = 0;
    this.pickups = [];
    this.nextPickupScore = 8;
    this.perfectStreak = 0;
    this.frenzyTimer = 0;
    this.clutch = 0;
    this.graceTimer = 0;
    this.lastFrenzyActive = false;
    this.cb.onWorld?.(this.world);
    this.cb.onStateChange?.(this.state);
    this.cb.onFrenzy?.(false, 0);
  }

  /**
   * Resurrect the bird mid-run after a crash, preserving score/coins/stats.
   * Clears nearby pipes and grants brief invulnerability so the player gets a
   * fair restart from where they died. Used by the paid Revive flow.
   */
  revive(newRunId?: string) {
    if (this.state !== "dead") return;
    // The post-revive segment is scored as a fresh run (new id) so its eventual
    // death is still recorded and not deduped against the pre-revive death.
    if (newRunId) this.runId = newRunId;
    // NOTE: startTime is intentionally preserved so durationMs reflects total
    // elapsed run time (pre + post revive), keeping anti-cheat validation honest.
    this.state = "playing";
    // lift the bird back into a safe central position with a gentle upward boost
    this.by = this.h * 0.45;
    this.vy = this.flapV * this.sc * 0.6;
    this.rot = 0;
    // clear any pipes near the bird so the player isn't instantly re-killed
    this.pipes = this.pipes.filter((p) => p.x > this.bx + this.w * 0.45);
    this.pickups = [];
    // generous invulnerability window + visual cue
    this.shieldInvuln = 1.4;
    this.shake = 8;
    this.flashAlpha = 0.6;
    // reset the death-fall squash
    this.squashX = 1;
    this.squashY = 1;
    this.burst(this.bx, this.by, "#fde047", 24, 260, "spark");
    this.burst(this.bx, this.by, "#ffffff", 12, 160, "puff");
    this.addFloat(this.w / 2, this.h * 0.3, "💛 REVIVED!", "#fde047", 24);
    audio.levelUp();
    navigator.vibrate?.([20, 40, 20]);
    this.cb.onStateChange?.(this.state);
  }

  flap() {
    if (this.state === "dead") return;
    if (this.state === "ready") {
      this.state = "playing";
      this.startTime = performance.now();
      this.graceTimer = this.GRACE_PERIOD;
      this.cb.onStateChange?.(this.state);
    }
    if (this.vy > 0 && this.powerUpManager.isDoubleJumpAvailable()) {
      this.powerUpManager.useDoubleJump();
      this.vy = this.flapV * this.sc;
      this.flaps++;
      this.wingPhase = 0;
      this.squashX = 0.75;
      this.squashY = 1.3;
      audio.flap();
      this.emitFlapPuff();
      navigator.vibrate?.(8);
      return;
    }
    this.vy = this.flapV * this.sc;
    this.flaps++;
    this.wingPhase = 0;
    // squash & stretch: stretch vertically on flap
    this.squashX = 0.8;
    this.squashY = 1.25;
    audio.flap();
    this.powerUpManager.resetDoubleJump();
    this.emitFlapPuff();
    navigator.vibrate?.(8);
  }

  private emitFlapPuff() {
    for (let i = 0; i < (this.reducedMotion ? 2 : 5); i++) {
      this.particles.push({
        x: this.bx - this.radius,
        y: this.by + this.radius * 0.4,
        vx: -40 - Math.random() * 40,
        vy: 20 + Math.random() * 30,
        life: 0.5, maxLife: 0.5,
        size: (3 + Math.random() * 4) * this.sc,
        color: "rgba(230,240,230,0.7)",
        kind: "puff", rot: 0, vr: 0,
      });
    }
  }

  private spawnPipe() {
    // gradual gap tightening from 175 to 130 over score, like speed version
    const baseGap = 175 * this.sc;
    const minGap = 130 * this.sc;
    const gapReduction = Math.min(this.score * 1.0, (baseGap - minGap) / this.sc) * this.sc;
    const gap = baseGap - gapReduction;
    const margin = 70 * this.sc * 0.5;
    const usable = Math.max(0, this.h - this.groundH - gap - margin * 2);
    const top = margin + (usable > 0 ? Math.random() * usable : margin);
    const gapY = Math.max(gap / 2 + margin, Math.min(top + gap / 2, this.h - this.groundH - gap / 2 - margin));

    // Choose pipe pattern based on score (moving pipes from score 20 onward)
    let pattern: PipePattern = "standard";
    let oscAmp = 0;
    const oscPhase = Math.random() * Math.PI * 2;
    if (this.score >= 20 && Math.random() < 0.3) {
      pattern = "moving";
      oscAmp = (15 + Math.random() * 20) * this.sc;
    }

    const pipe: Pipe = {
      x: this.w + 40,
      gapY,
      gap,
      w: 66 * this.sc,
      passed: false,
      nearChecked: false,
      scored: false,
      pattern,
      baseGapY: gapY,
      oscAmp,
      oscPhase,
    };
    // 38% chance of a coin (50% for moving to reward the extra challenge)
    const coinChance = pattern === "moving" ? 0.50 : 0.38;
    if (Math.random() < coinChance) {
      pipe.coin = { y: gapY + (Math.random() - 0.5) * gap * 0.4, taken: false, bob: Math.random() * Math.PI * 2 };
    }
    this.pipes.push(pipe);
  }

  private spawnPickup() {
    const pick = PICKUP_POOL[Math.floor(Math.random() * PICKUP_POOL.length)];
    const def = POWERUPS.find((p) => p.id === pick.id);
    if (!def) return;
    // Spawn in a safe vertical band so it's always reachable.
    const minY = this.h * 0.2;
    const maxY = this.h - this.groundH - this.h * 0.2;
    this.pickups.push({
      x: this.w + 50,
      y: minY + Math.random() * Math.max(1, maxY - minY),
      bob: Math.random() * Math.PI * 2,
      taken: false,
      id: pick.id,
      icon: def.icon,
      color: pick.color,
    });
  }

  private collectPickup(pu: PowerUpPickup, py: number) {
    const def = POWERUPS.find((p) => p.id === pu.id);
    this.powerUpManager.activate(pu.id);
    audio.powerUp();
    this.shake = Math.max(this.shake, 5);
    this.flashAlpha = Math.max(this.flashAlpha, 0.25);
    this.burst(pu.x, py, pu.color, 18, 220, "spark");
    this.burst(pu.x, py, "#ffffff", 8, 130, "puff");
    this.addFloat(pu.x, py - 26 * this.sc, `${pu.icon} ${def?.name ?? "Power-Up"}!`, pu.color, 17);
    navigator.vibrate?.([12, 20, 12]);
    this.cb.onPowerUp?.(pu.id, def?.name ?? "Power-Up");
  }

  private triggerFrenzy() {
    this.frenzyTimer = this.FRENZY_DURATION;
    this.perfectStreak = 0;
    this.shake = 12;
    this.flashAlpha = 0.6;
    audio.frenzy();
    this.burst(this.w / 2, this.h * 0.35, "#ff6b6b", 26, 280, "spark");
    this.burst(this.w / 2, this.h * 0.35, "#fbbf24", 22, 260, "spark");
    this.burst(this.w / 2, this.h * 0.35, "#60a5fa", 18, 240, "spark");
    this.addFloat(this.w / 2, this.h * 0.3, "🔥 FRENZY! 2× POINTS", "#fbbf24", 24);
    navigator.vibrate?.([30, 30, 30, 30, 60]);
    this.lastFrenzyActive = true;
    this.cb.onFrenzy?.(true, this.frenzyTimer * 1000);
  }

  private get groundH() {
    return 70 * this.sc;
  }

  private addFloat(x: number, y: number, text: string, color: string, size = 18) {
    this.floats.push({ x, y, vy: -50, life: 1, text, color, size: size * this.sc });
  }

  private burst(x: number, y: number, color: string, n: number, speed: number, kind = "spark") {
    if (this.reducedMotion) n = Math.ceil(n / 2);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = speed * (0.4 + Math.random() * 0.8);
      this.particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1,
        size: (2 + Math.random() * 3) * this.sc,
        color, kind, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10,
      });
    }
  }

  private updateMultiplier() {
    const m = Math.min(10, 1 + Math.floor(this.combo / 4));
    if (m !== this.multiplier) {
      this.multiplier = m;
      this.cb.onCombo?.(m);
    }
    this.bestCombo = Math.max(this.bestCombo, m);
  }

  private emitTrail(dt: number) {
    if (this.trail.kind === "none" || this.reducedMotion) return;
    if (Math.random() > dt * 40) return;
    const k = this.trail.kind;
    if (k === "puff") {
      this.particles.push({ x: this.bx - this.radius, y: this.by, vx: -30, vy: (Math.random() - 0.5) * 20, life: 0.6, maxLife: 0.6, size: 4 * this.sc, color: "rgba(220,235,220,0.55)", kind: "puff", rot: 0, vr: 0 });
    } else if (k === "spark") {
      this.particles.push({ x: this.bx - this.radius, y: this.by, vx: -50, vy: (Math.random() - 0.5) * 30, life: 0.5, maxLife: 0.5, size: 2.5 * this.sc, color: this.trail.glow, kind: "spark", rot: 0, vr: 0 });
    } else if (k === "leaf") {
      this.particles.push({ x: this.bx - this.radius, y: this.by, vx: -40, vy: (Math.random() - 0.5) * 20, life: 0.9, maxLife: 0.9, size: 5 * this.sc, color: this.trail.color, kind: "leaf", rot: Math.random() * 6, vr: (Math.random() - 0.5) * 6 });
    } else if (k === "rainbow" || k === "aurora") {
      const hue = (performance.now() / 6) % 360;
      this.particles.push({ x: this.bx - this.radius, y: this.by, vx: -40, vy: (Math.random() - 0.5) * 20, life: 0.6, maxLife: 0.6, size: 4 * this.sc, color: `hsl(${hue},90%,65%)`, kind: "spark", rot: 0, vr: 0 });
    } else if (k === "star") {
      this.particles.push({ x: this.bx - this.radius, y: this.by, vx: -30, vy: (Math.random() - 0.5) * 15, life: 0.7, maxLife: 0.7, size: 3 * this.sc, color: this.trail.color, kind: "spark", rot: 0, vr: 0 });
    } else if (k === "flame") {
      this.particles.push({ x: this.bx - this.radius, y: this.by, vx: -20, vy: -50 - Math.random() * 30, life: 0.4, maxLife: 0.4, size: 3 * this.sc, color: this.trail.color, kind: "spark", rot: 0, vr: 0 });
    } else if (k === "crystal") {
      this.particles.push({ x: this.bx - this.radius, y: this.by, vx: -30 + Math.random() * 10, vy: (Math.random() - 0.5) * 20, life: 0.5, maxLife: 0.5, size: 2 * this.sc, color: this.trail.color, kind: "puff", rot: 0, vr: 0 });
    } else if (k === "ghost") {
      this.particles.push({ x: this.bx - this.radius, y: this.by, vx: -25, vy: (Math.random() - 0.5) * 10, life: 0.8, maxLife: 0.8, size: 4 * this.sc, color: this.trail.color + "60", kind: "puff", rot: 0, vr: 0 });
    }
  }

  update(dt: number) {
    dt = Math.min(dt, 0.033); // clamp for stability

    this.groundOffset = (this.groundOffset + this.speed * dt) % (40 * this.sc);
    this.wingPhase += dt * 18;

    // squash & stretch recovery
    this.squashX += (1 - this.squashX) * Math.min(1, dt * 12);
    this.squashY += (1 - this.squashY) * Math.min(1, dt * 12);

    // parallax mountains scroll
    for (const m of this.mountains) {
      m.x -= this.speed * (0.05 + m.layer * 0.06) * dt;
      if (m.x + m.w < -20) m.x = this.w + 20 + Math.random() * 80;
    }

    // decor parallax
    for (const d of this.decor) {
      d.x -= this.speed * d.spd * dt;
      if (d.x < -40) {
        d.x = this.w + 40;
        d.y = Math.random() * this.h * 0.6;
        d.s = 0.5 + Math.random() * 1.2;
      }
    }

    if (this.state === "ready") {
      // gentle bob
      this.by = this.h * 0.45 + Math.sin(performance.now() / 400) * 10 * this.sc;
      this.rot = Math.sin(performance.now() / 400) * 0.1;
      this.updateParticles(dt);
      return;
    }

    if (this.state === "dead") {
      // bird falls
      this.vy += this.gravity * this.sc * dt;
      this.by += this.vy * dt;
      const floorY = this.h - this.groundH - this.radius;
      if (this.by > floorY) { this.by = floorY; this.vy = 0; }
      this.rot = Math.min(this.rot + dt * 4, 1.4);
      this.updateParticles(dt);
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 40);
      if (this.flashAlpha > 0) this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.5);
      return;
    }

    // playing
    const mods = this.powerUpManager.getModifiers();
    this.powerUpManager.update();
    if (this.shieldInvuln > 0) this.shieldInvuln = Math.max(0, this.shieldInvuln - dt);
    if (this.graceTimer > 0) this.graceTimer = Math.max(0, this.graceTimer - dt);

    // Time management - countdown for competitive play
    if (!this.practiceMode) {
      this.timeRemaining -= dt;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.die();
        return;
      }
    }

    // smooth speed ramp: starts brisk, accelerates mid-game, tapers at max
    const baseSpeed = 128;
    const maxSpeed = 220;
    const rampScore = 50;
    const t = Math.min(this.score / rampScore, 1);
    this.speed = (baseSpeed + (maxSpeed - baseSpeed) * (t * t * (3 - 2 * t))) * this.sc;

    const effGravity = this.gravity * this.sc;
    this.vy += effGravity * dt;
    this.by += this.vy * dt;
    this.rot = Math.max(-0.5, Math.min(1.2, this.vy / (700 * this.sc)));

    // squash when falling fast (stretch horizontally, compress vertically)
    if (this.vy > 300 * this.sc && this.squashX >= 0.99) {
      const fallFactor = Math.min(0.12, (this.vy - 300 * this.sc) / 3000);
      this.squashX = 1 + fallFactor;
      this.squashY = 1 - fallFactor * 0.7;
    }

    // speed lines at high speed
    if (this.score > 15 && !this.reducedMotion && Math.random() < dt * (this.score > 40 ? 25 : 10)) {
      this.speedLines.push({
        x: this.w + 10,
        y: Math.random() * this.h * 0.8 + this.h * 0.1,
        len: (30 + Math.random() * 60) * this.sc,
        speed: this.speed * (1.5 + Math.random()),
      });
    }
    // update speed lines
    for (let i = this.speedLines.length - 1; i >= 0; i--) {
      this.speedLines[i].x -= this.speedLines[i].speed * dt;
      if (this.speedLines[i].x + this.speedLines[i].len < 0) this.speedLines.splice(i, 1);
    }

    this.emitTrail(dt);

    // spawn pipes by spacing (skip in practice mode)
    if (!this.practiceMode) {
      const spacing = Math.max(190 * this.sc, this.w * (0.55 - Math.min(this.score / 150, 1) * 0.1));
      const last = this.pipes[this.pipes.length - 1];
      if (!last || last.x < this.w - spacing) this.spawnPipe();

      // Mid-run power-up pickups: once the player passes a score threshold,
      // spawn a floating token, then schedule the next one ~12-20 points later.
      if (this.score >= this.nextPickupScore && this.pickups.length === 0) {
        this.spawnPickup();
        this.nextPickupScore = this.score + 12 + Math.floor(Math.random() * 8);
      }
    }

    // FRENZY countdown — signal only on state change
    if (this.frenzyTimer > 0) {
      this.frenzyTimer = Math.max(0, this.frenzyTimer - dt);
      const wasActive = this.lastFrenzyActive;
      const nowActive = this.frenzyTimer > 0;
      if (nowActive !== wasActive) {
        this.cb.onFrenzy?.(nowActive, nowActive ? this.frenzyTimer * 1000 : 0);
        this.lastFrenzyActive = nowActive;
      }
    }

    // Music intensity — update when score or FRENZY changes
    const isFrenzy = this.frenzyTimer > 0;
    if (this.score !== this.lastIntensityScore || isFrenzy !== this.lastIntensityFrenzy) {
      audio.setMusicIntensity(this.score, isFrenzy);
      this.lastIntensityScore = this.score;
      this.lastIntensityFrenzy = isFrenzy;
    }

    // Update pipe patterns (moving pipes — oscillate gap)
    for (const p of this.pipes) {
      if (p.pattern === "moving") {
        const age = (this.w + 40 - p.x) / (60 * this.sc);
        p.gapY = p.baseGapY + Math.sin(age * 2.5 + p.oscPhase) * p.oscAmp;
      }
    }

    // move & collect power-up pickups
    for (const pu of this.pickups) {
      if (pu.taken) continue;
      pu.x -= this.speed * dt;
      pu.bob += dt * 4;
      const py = pu.y + Math.sin(pu.bob) * 7 * this.sc;
      const pr = 16 * this.sc;
      if (Math.hypot(pu.x - this.bx, py - this.by) < this.radius + pr) {
        pu.taken = true;
        this.collectPickup(pu, py);
      }
    }
    // cull off-screen pickups
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      if (this.pickups[i].x < -40 || this.pickups[i].taken) this.pickups.splice(i, 1);
    }

    const floorY = this.h - this.groundH - this.radius;
    const ceil = this.radius;

    for (const p of this.pipes) {
      p.x -= this.speed * dt;
      // coin — magnet auto-collect
      if (p.coin && !p.coin.taken) {
        p.coin.bob += dt * 4;
        const cx = p.x + p.w / 2;
        const cy = p.coin.y + Math.sin(p.coin.bob) * 6 * this.sc;
        const cr = 13 * this.sc;
        const coinDist = Math.hypot(cx - this.bx, cy - this.by);
        // magnet pull
        if (mods.magnetRadius > 0 && coinDist < mods.magnetRadius * this.sc) {
          p.coin.taken = true;
          this.runCoins += Math.round(mods.coinMult);
          this.combo++;
          this.updateMultiplier();
          audio.coin();
          this.burst(cx, cy, "#a78bfa", 8, 120, "spark");
          this.burst(cx, cy, "#ffd24a", 4, 80, "spark");
          this.addFloat(cx, cy - 10, mods.coinMult > 1 ? `+${mods.coinMult}×` : "+coin", "#c084fc", 14);
          this.cb.onCoin?.(this.runCoins);
        } else if (coinDist < this.radius + cr) {
          p.coin.taken = true;
          this.runCoins += Math.round(mods.coinMult);
          this.combo++;
          this.updateMultiplier();
          audio.coin();
          this.burst(cx, cy, "#ffd24a", 12, 180, "spark");
          this.addFloat(cx, cy - 10, mods.coinMult > 1 ? `+${mods.coinMult}×` : "+coin", "#ffd24a", 14);
          this.cb.onCoin?.(this.runCoins);
        }
      }
      // scoring on pass
      if (!p.scored && p.x + p.w < this.bx) {
        p.scored = true;
        this.combo++;

        // Perfect pass check
        const distFromCenter = Math.abs(this.by - p.gapY);
        const isPerfect = distFromCenter < p.gap * 0.12;

        const frenzyMult = this.frenzyTimer > 0 ? 2 : 1;
        if (isPerfect) {
          this.perfectPasses++;
          this.combo++; // Bonus combo
          this.score += this.multiplier * 2 * frenzyMult;
          audio.score(); // Could add a special sound
          this.burst(this.bx, this.by, "#60a5fa", 15, 200, "spark");
          this.addFloat(this.bx, this.by - 40 * this.sc, "PERFECT!", "#60a5fa", 22);
          this.cb.onPerfectPass?.(this.perfectPasses);
          this.shake = 5;
          navigator.vibrate?.([10, 30, 10]);

          // streak gate: chain perfects to trigger FRENZY
          this.perfectStreak++;
          if (this.frenzyTimer <= 0 && this.perfectStreak >= this.FRENZY_STREAK_GOAL) {
            this.triggerFrenzy();
          }
        } else {
          this.score += this.multiplier * frenzyMult;
          audio.score();
          // a non-perfect pass breaks the perfect streak (combo is untouched)
          this.perfectStreak = 0;
        }

        this.updateMultiplier();
        this.addFloat(this.bx + 20 * this.sc, this.by - 30 * this.sc, `+${isPerfect ? this.multiplier * 2 : this.multiplier}`, "#ffffff", 18);
        this.cb.onScore?.(this.score);
        // score milestone celebrations
        const milestones = [10, 25, 50, 75, 100, 150, 200];
        for (const m of milestones) {
          if (this.score >= m && this.lastMilestone < m) {
            this.lastMilestone = m;
            this.shake = 8;
            this.flashAlpha = 0.5;
            this.burst(this.w / 2, this.h / 2, "#ffd24a", 30, 300, "spark");
            this.burst(this.w / 2, this.h / 2, "#ff6b6b", 20, 250, "spark");
            this.burst(this.w / 2, this.h / 2, "#60a5fa", 20, 250, "spark");
            this.addFloat(this.w / 2, this.h * 0.3, `🎉 ${m}!`, "#ffd24a", 28);
            audio.milestone();
            navigator.vibrate?.([20, 40, 20]);
          }
        }
        // new best indicator
        if (this.bestScoreBefore > 0 && this.score > this.bestScoreBefore && this.score === this.bestScoreBefore + 1) {
          this.addFloat(this.w / 2, this.h * 0.22, "🏆 NEW BEST!", "#ffd24a", 24);
          this.burst(this.w / 2, this.h * 0.22, "#ffd24a", 15, 200, "spark");
        }
        // world transition
        const nw = worldForScore(this.score);
        if (nw.id !== this.world.id) {
          this.world = nw;
          this.flashAlpha = 0.6;
          this.cb.onWorld?.(nw);
          this.addFloat(this.w / 2, this.h * 0.35, nw.name + "!", nw.accent, 22);
          audio.setWorld(nw.id);
          audio.worldChange();
        }
      }
      // near miss check (once, as pipe edge passes bird)
      if (!p.nearChecked && p.x + p.w < this.bx + this.radius) {
        p.nearChecked = true;
        const topEdge = p.gapY - p.gap / 2;
        const botEdge = p.gapY + p.gap / 2;
        const distTop = this.by - this.radius - topEdge;
        const distBot = botEdge - (this.by + this.radius);
        const near = Math.min(distTop, distBot);
        if (near >= 0 && near < 16 * this.sc) {
          this.nearMiss++;
          this.combo++;
          this.updateMultiplier();
          const frenzyMult = this.frenzyTimer > 0 ? 2 : 1;
          // A "clutch" is an extremely tight escape — bigger reward & drama.
          const isClutch = near < 6 * this.sc;
          if (isClutch) {
            this.clutch++;
            this.score += this.multiplier * 3 * frenzyMult;
            audio.clutch();
            this.shake = 9;
            this.flashAlpha = Math.max(this.flashAlpha, 0.35);
            navigator.vibrate?.([10, 25, 10, 25, 40]);
            this.burst(this.bx + this.radius, this.by, "#fbbf24", 16, 220, "spark");
            this.burst(this.bx + this.radius, this.by, "#ffffff", 10, 130, "puff");
            this.addFloat(this.bx, this.by + 24 * this.sc, "⚡ CLUTCH! +" + this.multiplier * 3 * frenzyMult, "#fbbf24", 18);
            this.cb.onClutch?.(this.clutch);
          } else {
            this.score += this.multiplier * frenzyMult;
            audio.nearMiss();
            this.shake = 4;
            navigator.vibrate?.(15);
            this.burst(this.bx + this.radius, this.by, "#7dffb0", 10, 170, "spark");
            this.burst(this.bx + this.radius, this.by, "#ffffff", 6, 100, "puff");
            this.addFloat(this.bx, this.by + 24 * this.sc, "NEAR MISS!", "#7dffb0", 15);
          }
          this.cb.onNearMiss?.(this.nearMiss);
        }
      }
    }
    // cull pipes off-screen
    let write = 0;
    for (let i = 0; i < this.pipes.length; i++) {
      if (this.pipes[i].x + this.pipes[i].w > -20) this.pipes[write++] = this.pipes[i];
    }
    this.pipes.length = write;

    // collisions — grace period prevents instant death on first flap
    let dead = false;
    if (this.by >= floorY) {
      if (this.graceTimer > 0) { this.by = floorY; this.vy = -Math.abs(this.vy) * 0.3; }
      else { dead = true; this.by = floorY; }
    }
    if (!this.practiceMode && this.shieldInvuln <= 0 && this.graceTimer <= 0) {
      if (this.by <= ceil) { this.by = ceil; this.vy = 0; }
      for (const p of this.pipes) {
        if (p.x > this.bx + this.radius || p.x + p.w < this.bx - this.radius) continue;
        const topEdge = p.gapY - p.gap / 2;
        const botEdge = p.gapY + p.gap / 2;
        if (this.circleRect(this.bx, this.by, this.radius, p.x, 0, p.w, topEdge) ||
            this.circleRect(this.bx, this.by, this.radius, p.x, botEdge, p.w, this.h - this.groundH - botEdge)) {
          dead = true;
          break;
        }
      }
    }

    if (dead) {
      if (mods.shieldHits > 0 && this.shieldInvuln <= 0) {
        this.powerUpManager.consumeShield();
        this.vy = this.flapV * this.sc * 0.7;
        this.shieldInvuln = 0.6;
        this.shake = 6;
        this.flashAlpha = 0.4;
        this.burst(this.bx, this.by, "#60a5fa", 20, 250, "spark");
        audio.shieldBreak();
        dead = false;
        navigator.vibrate?.(30);
      } else {
        this.die();
      }
    }

    this.updateParticles(dt);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 40);
    if (this.flashAlpha > 0) this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.5);
  }

  private circleRect(cx: number, cy: number, r: number, rx: number, ry: number, rw: number, rh: number) {
    const nx = Math.max(rx, Math.min(cx, rx + rw));
    const ny = Math.max(ry, Math.min(cy, ry + rh));
    return (cx - nx) ** 2 + (cy - ny) ** 2 <= r * r;
  }

  private die() {
    if (this.state !== "playing") return;
    this.state = "dead";
    this.vy = -200 * this.sc;
    this.squashX = 1.4;
    this.squashY = 0.6;
    audio.hit();
    this.shake = 14;
    this.flashAlpha = 0.8;
    navigator.vibrate?.([30, 30, 50]);
    // dramatic death burst — many colored fragments
    this.burst(this.bx, this.by, "#ff6b6b", 25, 320, "spark");
    this.burst(this.bx, this.by, "#ffd24a", 18, 260, "spark");
    this.burst(this.bx, this.by, this.skin.accent, 15, 200, "leaf");
    this.burst(this.bx, this.by, "#ffffff", 10, 180, "puff");
    // ring burst effect
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const sp = 200;
      this.particles.push({
        x: this.bx, y: this.by,
        vx: Math.cos(angle) * sp, vy: Math.sin(angle) * sp,
        life: 0.8, maxLife: 0.8,
        size: 3 * this.sc, color: this.skin.body,
        kind: "spark", rot: 0, vr: 0,
      });
    }

    const result: RunResult = {
      runId: this.runId,
      score: this.score,
      coins: this.runCoins,
      nearMiss: this.nearMiss,
      perfectPasses: this.perfectPasses,
      bestCombo: this.bestCombo,
      durationMs: performance.now() - this.startTime,
      flaps: this.flaps,
      clutch: this.clutch,
    };
    this.cb.onStateChange?.(this.state);
    this.cb.onDeath?.(result);
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === "leaf") { p.vy += 60 * dt; p.rot += p.vr * dt; }
      else if (p.kind === "spark") { p.vy += 220 * dt; }
      else { p.vy -= 15 * dt; }
      p.life -= dt;
    }
    // In-place removal to avoid array allocation churn at 60fps
    let write = 0;
    for (let i = 0; i < this.particles.length; i++) {
      if (this.particles[i].life > 0) this.particles[write++] = this.particles[i];
    }
    this.particles.length = write;

    for (const f of this.floats) { f.y += f.vy * dt; f.life -= dt * 1.1; }
    write = 0;
    for (let i = 0; i < this.floats.length; i++) {
      if (this.floats[i].life > 0) this.floats[write++] = this.floats[i];
    }
    this.floats.length = write;
  }

  // ============ RENDER ============
  render(ctx: CanvasRenderingContext2D) {
    const w = this.w, h = this.h;
    ctx.save();
    if (this.shake > 0 && !this.reducedMotion) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    }

    this.drawBackground(ctx);
    this.drawMountains(ctx);
    this.drawStars(ctx);
    this.drawDecor(ctx);

    // speed lines
    if (this.speedLines.length > 0) {
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5 * this.sc;
      for (const sl of this.speedLines) {
        ctx.beginPath();
        ctx.moveTo(sl.x, sl.y);
        ctx.lineTo(sl.x + sl.len, sl.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // pipes
    for (const p of this.pipes) this.drawPipe(ctx, p);

    // mid-run power-up pickups
    this.drawPickups(ctx);

    this.drawGround(ctx);

    // particles behind bird
    this.drawParticles(ctx);

    // bird
    this.drawBird(ctx);

    // floats
    for (const f of this.floats) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, f.life);
      ctx.font = `900 ${f.size}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }

    // FRENZY vignette — warm pulsing edge glow while active
    if (this.frenzyTimer > 0 && !this.reducedMotion) {
      const pulse = 0.35 + Math.sin(performance.now() / 90) * 0.15;
      const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.75);
      vg.addColorStop(0, "rgba(251,191,36,0)");
      vg.addColorStop(1, `rgba(255,107,53,${pulse})`);
      ctx.fillStyle = vg;
      ctx.fillRect(-20, -20, w + 40, h + 40);
    }

    // grace period indicator — green pulsing ring while invulnerable
    if (this.graceTimer > 0 && this.state === "playing") {
      ctx.save();
      const pulse = 0.3 + 0.3 * Math.sin(performance.now() / 100);
      ctx.strokeStyle = `rgba(74,222,128,${pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.bx, this.by, this.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // world flash
    if (this.flashAlpha > 0 && !this.reducedMotion) {
      ctx.fillStyle = `rgba(255,255,255,${this.flashAlpha * 0.5})`;
      ctx.fillRect(-20, -20, w + 40, h + 40);
    }
    ctx.restore();

    // big score (only when playing/dead)
    if (this.state !== "ready") {
      ctx.save();
      ctx.font = `900 ${44 * this.sc}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.strokeText(String(this.score), w / 2, 64 * this.sc);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(String(this.score), w / 2, 64 * this.sc);
      if (this.multiplier > 1) {
        ctx.font = `800 ${20 * this.sc}px system-ui, sans-serif`;
        ctx.fillStyle = this.world.accent;
        ctx.strokeText(`x${this.multiplier} COMBO`, w / 2, 92 * this.sc);
        ctx.fillText(`x${this.multiplier} COMBO`, w / 2, 92 * this.sc);
      }
      ctx.restore();
    }
  }

  private drawPickups(ctx: CanvasRenderingContext2D) {
    for (const pu of this.pickups) {
      if (pu.taken) continue;
      const py = pu.y + Math.sin(pu.bob) * 7 * this.sc;
      const r = 16 * this.sc;
      ctx.save();
      // pulsing halo so the token reads as collectable
      const pulse = 0.5 + Math.sin(pu.bob * 1.5) * 0.5;
      if (!this.highContrast) {
        ctx.shadowColor = pu.color;
        ctx.shadowBlur = 18;
        ctx.fillStyle = pu.color + "33";
        ctx.beginPath();
        ctx.arc(pu.x, py, r * (1.5 + pulse * 0.3), 0, 7);
        ctx.fill();
      }
      // disc
      ctx.fillStyle = pu.color;
      ctx.beginPath();
      ctx.arc(pu.x, py, r, 0, 7);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(pu.x, py, r * 0.78, 0, 7);
      ctx.fill();
      // icon
      ctx.font = `${18 * this.sc}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(pu.icon, pu.x, py + 1);
      ctx.restore();
      ctx.textBaseline = "alphabetic";
    }
  }

  private drawBackground(ctx: CanvasRenderingContext2D) {
    const g = ctx.createLinearGradient(0, 0, 0, this.h);
    if (this.highContrast) {
      g.addColorStop(0, "#101020");
      g.addColorStop(1, "#202035");
    } else {
      g.addColorStop(0, this.world.sky[0]);
      g.addColorStop(1, this.world.sky[1]);
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);
  }

  private drawMountains(ctx: CanvasRenderingContext2D) {
    if (this.highContrast) return;
    const groundY = this.h - this.groundH;
    // Draw 3 layers of mountain silhouettes, back to front
    for (let layer = 0; layer < 3; layer++) {
      const alpha = 0.08 + layer * 0.06;
      const layerMountains = this.mountains.filter(m => m.layer === layer);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.world.accent;
      for (const m of layerMountains) {
        ctx.beginPath();
        ctx.moveTo(m.x, groundY);
        ctx.quadraticCurveTo(m.x + m.w * 0.5, groundY - m.h, m.x + m.w, groundY);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawStars(ctx: CanvasRenderingContext2D) {
    if (this.highContrast || this.world.id !== "cosmos") return;
    const now = performance.now();
    ctx.save();
    for (const s of this.stars) {
      const blink = 0.3 + Math.sin(now / 600 + s.blink) * 0.4;
      ctx.globalAlpha = blink;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.s, 0, 7);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawDecor(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = this.highContrast ? 0.15 : 0.45;
    for (const d of this.decor) {
      const s = 22 * d.s * this.sc;
      ctx.save();
      ctx.translate(d.x, d.y);
      if (d.type === 0) {
        // cloud
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, 7);
        ctx.arc(s * 0.8, s * 0.1, s * 0.7, 0, 7);
        ctx.arc(-s * 0.8, s * 0.1, s * 0.7, 0, 7);
        ctx.fill();
      } else if (d.type === 1) {
        // leaf
        ctx.fillStyle = this.world.accent;
        ctx.rotate(d.x / 100);
        for (let i = 0; i < 7; i++) {
          ctx.save();
          ctx.rotate((i / 7) * Math.PI * 2);
          ctx.beginPath();
          ctx.ellipse(0, -s * 0.5, s * 0.18, s * 0.5, 0, 0, 7);
          ctx.fill();
          ctx.restore();
        }
      } else {
        // smoke swirl
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = 3 * this.sc;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.6, 0, Math.PI * 1.5);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  private drawPipe(ctx: CanvasRenderingContext2D, p: Pipe) {
    const topEdge = p.gapY - p.gap / 2;
    const botEdge = p.gapY + p.gap / 2;
    const main = this.highContrast ? "#00d0a0" : this.world.pipe;
    const dark = this.highContrast ? "#008060" : this.world.pipeDark;
    const lipH = 18 * this.sc;
    const lipOver = 6 * this.sc;

    const drawSeg = (y: number, height: number, lipY: number) => {
      const g = ctx.createLinearGradient(p.x, 0, p.x + p.w, 0);
      g.addColorStop(0, dark);
      g.addColorStop(0.3, main);
      g.addColorStop(0.65, main);
      g.addColorStop(1, dark);
      ctx.fillStyle = g;
      ctx.fillRect(p.x, y, p.w, height);
      // jar/bong glass highlight — wider, more visible
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.fillRect(p.x + p.w * 0.18, y, p.w * 0.14, height);
      // secondary highlight on right
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(p.x + p.w * 0.7, y, p.w * 0.08, height);
      // inner glass reflection stripe
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(p.x + p.w * 0.35, y, p.w * 0.3, height);
      // lip
      ctx.fillStyle = dark;
      ctx.fillRect(p.x - lipOver, lipY, p.w + lipOver * 2, lipH);
      ctx.fillStyle = main;
      ctx.fillRect(p.x - lipOver + 3 * this.sc, lipY + 3 * this.sc, p.w + lipOver * 2 - 6 * this.sc, lipH - 6 * this.sc);
      // lip highlight
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(p.x - lipOver + 3 * this.sc, lipY + 3 * this.sc, p.w + lipOver * 2 - 6 * this.sc, 2 * this.sc);
    };
    // top pipe (lip at bottom)
    drawSeg(0, topEdge - lipH, topEdge - lipH);
    // bottom pipe (lip at top)
    drawSeg(botEdge + lipH, this.h - this.groundH - botEdge - lipH, botEdge);

    // gap edge glow — subtle light along the jar opening edges
    if (!this.highContrast) {
      ctx.save();
      const glowGrad = ctx.createLinearGradient(p.x, topEdge - 4 * this.sc, p.x, topEdge + 8 * this.sc);
      glowGrad.addColorStop(0, "rgba(255,255,255,0)");
      glowGrad.addColorStop(0.5, "rgba(255,255,255,0.08)");
      glowGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(p.x - lipOver, topEdge - 4 * this.sc, p.w + lipOver * 2, 12 * this.sc);
      const glowGrad2 = ctx.createLinearGradient(p.x, botEdge - 8 * this.sc, p.x, botEdge + 4 * this.sc);
      glowGrad2.addColorStop(0, "rgba(255,255,255,0)");
      glowGrad2.addColorStop(0.5, "rgba(255,255,255,0.08)");
      glowGrad2.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glowGrad2;
      ctx.fillRect(p.x - lipOver, botEdge - 8 * this.sc, p.w + lipOver * 2, 12 * this.sc);
      ctx.restore();
    }

    // coin
    if (p.coin && !p.coin.taken) {
      const cx = p.x + p.w / 2;
      const cy = p.coin.y + Math.sin(p.coin.bob) * 6 * this.sc;
      const cr = 13 * this.sc;
      // spinning coin effect — squash horizontally over time
      const spinScale = Math.abs(Math.cos(p.coin.bob * 1.5));
      ctx.save();
      ctx.shadowColor = "#ffd24a";
      ctx.shadowBlur = 16;
      // outer glow ring
      ctx.fillStyle = "rgba(255,210,74,0.15)";
      ctx.beginPath();
      ctx.arc(cx, cy, cr * 1.6, 0, 7);
      ctx.fill();
      // main coin
      ctx.translate(cx, cy);
      ctx.scale(Math.max(0.3, spinScale), 1);
      ctx.fillStyle = "#ffd24a";
      ctx.beginPath();
      ctx.arc(0, 0, cr, 0, 7);
      ctx.fill();
      // coin highlight
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.beginPath();
      ctx.arc(-cr * 0.2, -cr * 0.2, cr * 0.5, 0, 7);
      ctx.fill();
      // leaf emoji on coin face
      ctx.scale(Math.max(0.3, 1 / Math.max(0.3, spinScale)), 1);
      ctx.fillStyle = "#c98a16";
      ctx.font = `900 ${15 * this.sc}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🍁", 0, 1);
      ctx.restore();
      ctx.textBaseline = "alphabetic";
    }
  }

  private drawGround(ctx: CanvasRenderingContext2D) {
    const gy = this.h - this.groundH;
    ctx.fillStyle = this.highContrast ? "#303040" : this.world.ground;
    ctx.fillRect(0, gy, this.w, this.groundH);
    // texture stripes
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    const step = 40 * this.sc;
    for (let x = -this.groundOffset; x < this.w; x += step) {
      ctx.fillRect(x, gy, step / 2, this.groundH);
    }
    // world-specific ground decorations
    if (!this.highContrast) {
      if (this.world.id === "dispensary" || this.world.id === "grow") {
        // grass tufts
        ctx.fillStyle = "rgba(34,197,94,0.3)";
        for (let x = -this.groundOffset % 30; x < this.w; x += 30 * this.sc) {
          ctx.beginPath();
          ctx.moveTo(x, gy);
          ctx.lineTo(x + 3 * this.sc, gy - 6 * this.sc);
          ctx.lineTo(x + 6 * this.sc, gy);
          ctx.fill();
        }
      } else if (this.world.id === "smoke" || this.world.id === "festival") {
        // smoke wisps along ground
        ctx.save();
        ctx.globalAlpha = 0.15;
        for (let x = -this.groundOffset % 60; x < this.w; x += 60 * this.sc) {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(x, gy + 8 * this.sc, 12 * this.sc, 0, 7);
          ctx.fill();
        }
        ctx.restore();
      } else if (this.world.id === "cosmos") {
        // glowing ground line
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = "#a78bfa";
        ctx.fillRect(0, gy, this.w, 2 * this.sc);
        ctx.restore();
      }
    }
    // top highlight
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(0, gy, this.w, 4 * this.sc);
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = a;
      if (p.kind === "leaf") {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, 7);
        ctx.fill();
      } else if (p.kind === "puff") {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1.5 - a * 0.5), 0, 7);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, 7);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawBird(ctx: CanvasRenderingContext2D) {
    const r = this.radius;
    ctx.save();
    ctx.translate(this.bx, this.by);
    ctx.rotate(this.rot);
    // apply squash & stretch
    ctx.scale(this.squashX, this.squashY);

    // combo aura — expands with multiplier, gets fiery at high combos
    if (this.multiplier > 1 && !this.highContrast) {
      const intensity = Math.min(0.5, this.multiplier * 0.05);
      const auraR = r * (1.2 + this.multiplier * 0.08);
      const ag = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, auraR);
      const auraColor = this.multiplier >= 5 ? "255,107,53" : this.multiplier >= 3 ? "251,191,36" : "74,222,128";
      ag.addColorStop(0, `rgba(${auraColor},0)`);
      ag.addColorStop(0.4 + Math.sin(performance.now() / 500) * 0.1, `rgba(${auraColor},${intensity * 0.3})`);
      ag.addColorStop(1, `rgba(${auraColor},0)`);
      ctx.fillStyle = ag;
      ctx.beginPath();
      ctx.arc(0, 0, auraR, 0, 7);
      ctx.fill();
    }

    // glow
    if (!this.highContrast) {
      ctx.shadowColor = this.skin.accent;
      ctx.shadowBlur = 12;
    }
    // body
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r);
    g.addColorStop(0, this.skin.body);
    g.addColorStop(1, this.skin.accent);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, 7);
    ctx.fill();
    ctx.shadowBlur = 0;

    // leaf points on top (cannabis vibe)
    ctx.fillStyle = this.skin.accent;
    for (let i = -1; i <= 1; i++) {
      ctx.save();
      ctx.translate(i * r * 0.45, -r * 0.7);
      ctx.rotate(i * 0.3);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.25, r * 0.16, r * 0.4, 0, 0, 7);
      ctx.fill();
      ctx.restore();
    }

    // wing (flaps)
    const wingY = Math.sin(this.wingPhase) * r * 0.3;
    ctx.fillStyle = this.skin.accent;
    ctx.beginPath();
    ctx.ellipse(-r * 0.2, r * 0.1 + wingY, r * 0.5, r * 0.32, -0.3, 0, 7);
    ctx.fill();

    // eye with periodic blink
    const blinkCycle = (performance.now() / 100) % 40;
    const isBlinking = blinkCycle > 38.5; // brief blink every ~4 seconds
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    if (isBlinking) {
      // closed eye — thin line
      ctx.strokeStyle = this.skin.eye;
      ctx.lineWidth = 2.5 * this.sc;
      ctx.moveTo(r * 0.1, -r * 0.2);
      ctx.lineTo(r * 0.7, -r * 0.2);
      ctx.stroke();
    } else {
      ctx.arc(r * 0.4, -r * 0.2, r * 0.32, 0, 7);
      ctx.fill();
      ctx.fillStyle = this.skin.eye;
      ctx.beginPath();
      ctx.arc(r * 0.5, -r * 0.2, r * 0.16, 0, 7);
      ctx.fill();
      // eye highlight
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.arc(r * 0.42, -r * 0.28, r * 0.08, 0, 7);
      ctx.fill();
      // chill half-lids
      ctx.strokeStyle = this.skin.eye;
      ctx.lineWidth = 2 * this.sc;
      ctx.beginPath();
      ctx.arc(r * 0.4, -r * 0.2, r * 0.32, Math.PI * 1.05, Math.PI * 1.9);
      ctx.stroke();
    }

    // smile
    ctx.strokeStyle = this.skin.eye;
    ctx.lineWidth = 2.2 * this.sc;
    ctx.beginPath();
    ctx.arc(r * 0.25, r * 0.25, r * 0.35, 0.1, Math.PI - 0.4);
    ctx.stroke();

    // cheek blush (cute!)
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = "#ff9999";
    ctx.beginPath();
    ctx.ellipse(r * 0.5, r * 0.15, r * 0.2, r * 0.12, 0, 0, 7);
    ctx.fill();
    ctx.restore();

    // shield visual — pulsing ring
    const shieldActive = this.powerUpManager.getShieldHits() > 0 || this.shieldInvuln > 0;
    if (shieldActive) {
      const pulse = 1 + Math.sin(performance.now() / 180) * 0.06;
      const alpha = this.shieldInvuln > 0
        ? 0.3 + Math.sin(performance.now() / 60) * 0.2
        : 0.35 + Math.sin(performance.now() / 300) * 0.15;
      ctx.save();
      ctx.strokeStyle = `rgba(96,165,250,${alpha})`;
      ctx.lineWidth = 3 * this.sc * pulse;
      ctx.shadowColor = "#60a5fa";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.35, 0, 7);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }
}

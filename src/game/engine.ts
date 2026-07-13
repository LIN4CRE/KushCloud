import { Skin, Trail, World, worldForScore, POWERUPS } from "./data";
import { audio } from "./audio";
import { PowerUpManager } from "./powerups";
import {
  type EffectParticle, type ScreenOverlay,
  createBurst, createRing, createPuff, createConfetti, createTrailSegment,
  updateParticles as updateEffectParticles, drawParticles, drawOverlays, updateOverlays,
} from "./effects";

const SPAWN_RATE_MULTIPLIER = 1.2;

// Power-ups that can spawn as mid-run pickups. Shields stay shop/loadout-only,
// but utility pickups are now 20% more frequent and include the new set.
const PICKUP_POOL: { id: string; color: string }[] = [
  { id: "magnet",   color: "#34d399" },
  { id: "supermag", color: "#d946ef" },
  { id: "double",   color: "#fbbf24" },
  { id: "coinrush", color: "#f59e0b" },
  { id: "slow",     color: "#60a5fa" },
  { id: "focus",    color: "#22d3ee" },
  { id: "ghost",    color: "#f472b6" },
  { id: "dash",     color: "#a3e635" },
  { id: "wide",     color: "#2dd4bf" },
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
  /** Number of smoke clouds collected for Red Eye bonuses. */
  redEye?: number;
}

export type GameState = "ready" | "playing" | "dead";

type PipePattern = "standard" | "moving" | "tight" | "triple";

interface Pipe {
  x: number;
  gapY: number;
  gap: number;
  w: number;
  passed: boolean;
  nearChecked: boolean;
  coin?: { y: number; taken: boolean; bob: number };
  smoke?: { offset: number; taken: boolean; bob: number };
  scored: boolean;
  pattern: PipePattern;
  baseGapY: number;
  oscAmp: number;
  oscPhase: number;
  oscSpeed: number;
  gapTighten: number;
  /** For triple pattern, index 0=top, 1=middle, 2=bottom */
  tripleIndex?: number;
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
  /** Fired when smoke is collected for a Red Eye bonus. */
  onRedEye?: (count: number) => void;
  /** Fired when combo fire level changes (0-4). */
  onComboFireLevel?: (level: number) => void;
}

export class GameEngine {
  private w = 360;
  private h = 640;
  private sc = 1;
  state: GameState = "ready";

  // bird
  private bx = 0; private by = 0; private vy = 0; private radius = 16; private rot = 0;
  private wingPhase = 0;

  // world physics — tuned for addictive feel: lighter gravity, responsive flaps
  private gravity = 1380;
  private flapV = -485;
  private speed = 115;

  private pipes: Pipe[] = [];
  private particles: EffectParticle[] = [];
  private floats: FloatText[] = [];
  private groundOffset = 0;
  private decor: { x: number; y: number; s: number; type: number; spd: number }[] = [];

  // parallax mountain layers
  private mountains: { x: number; h: number; w: number; layer: number }[] = [];
  // background stars (for cosmos world)
  private stars: { x: number; y: number; s: number; blink: number }[] = [];

  // Screen overlay stack
  private overlays: ScreenOverlay[] = [];

  // --- Enhanced background layers ---
  // Parallax clouds (3 layers at different speeds)
  private cloudLayers: { x: number; y: number; w: number; h: number; speed: number; alpha: number }[][] = [[], [], []];
  // Ground detail elements (grass tufts, rocks, smoke wisps per world)
  private groundDetails: { x: number; y: number; w: number; h: number; color: string; sway: number }[] = [];

  // --- Player animation ---
  private wingFrame = 0;
  private wingTimer = 0;
  private readonly WING_FRAME_DUR = 0.06; // seconds per wing frame
  private deathTimer = 0;
  private invincibilityTimer = 0;
  private invincibilityFlash = false;

  // --- Combo fire meter ---
  private comboFireTimer = 0;
  private comboFireLevel = 0; // 0-4

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
  private nextPickupScore = 6; // first pickup window (20% earlier than before)

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
  redEye = 0; // count of Red Eye smoke bonuses this run
  private redEyeTimer = 0;
  // grace period — prevents instant death on first flap
  private graceTimer = 0;
  private readonly GRACE_PERIOD = 0.4;
  private lastIntensityScore = -1;
  private lastFrenzyActive = false;
  private lastIntensityFrenzy = false;
  private starterPowerUpIds: string[] = [];
  private starterPowerUpsApplied = false;

  constructor(skin: Skin, trail: Trail, world: World, cb: EngineCallbacks) {
    this.skin = skin;
    this.trail = trail;
    this.world = world;
    this.cb = cb;
    this.initBackgroundLayers();
    this.initDecor();
  }

  private initBackgroundLayers() {
    // Cloud layers: far (slow), mid, near (fast)
    const cloudColors = [
      "rgba(255,255,255,0.06)", // far — faint
      "rgba(255,255,255,0.12)", // mid
      "rgba(255,255,255,0.18)", // near
    ];
    for (let layer = 0; layer < 3; layer++) {
      this.cloudLayers[layer] = [];
      const count = layer === 0 ? 5 : layer === 1 ? 4 : 3;
      for (let i = 0; i < count; i++) {
        this.cloudLayers[layer].push({
          x: (this.w / count) * i + (Math.random() - 0.5) * 60,
          y: this.h * (0.05 + Math.random() * 0.35),
          w: 60 + Math.random() * 90 * (this.sc || 1),
          h: 20 + Math.random() * 30 * (this.sc || 1),
          speed: (0.2 + layer * 0.2) * (this.sc || 1),
          alpha: parseFloat(cloudColors[layer].match(/[\d.]+(?=\))/)?.[0] ?? "0.1"),
        });
      }
    }
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

  setStarterPowerUps(ids: string[]) {
    const valid = new Set(POWERUPS.map((p) => p.id));
    this.starterPowerUpIds = [...new Set(ids)].filter((id) => valid.has(id)).slice(0, 2);
    if (this.state === "ready") this.starterPowerUpsApplied = false;
  }

  private applyStarterPowerUps() {
    if (this.starterPowerUpsApplied) return;
    this.starterPowerUpsApplied = true;
    if (this.starterPowerUpIds.length === 0) return;

    this.starterPowerUpIds.forEach((id, i) => {
      const def = POWERUPS.find((p) => p.id === id);
      if (!def || !this.powerUpManager.activate(id)) return;
      const x = this.bx + (i - (this.starterPowerUpIds.length - 1) / 2) * 44 * this.sc;
      const y = this.by - 44 * this.sc;
      this.addFloat(x, y, `${def.icon} READY`, "#a7f3d0", 14);
      this.burst(x, y, "#34d399", 8, 130, "spark");
      this.cb.onPowerUp?.(id, `${def.name} ready`);
    });
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.sc = Math.max(0.7, Math.min(1.8, h / 640));
    this.radius = 17 * this.sc;
    this.bx = w * 0.3;
    if (this.state === "ready") this.by = h * 0.45;
    this.initBackgroundLayers();
    this.initDecor();
    this.initGroundDetails();
  }

  private initGroundDetails() {
    this.groundDetails = [];
    const gy = this.h - this.groundH;
    const id = this.world.id;
    const isGrass = id === "dispensary" || id === "grow";
    const isSmoke = id === "smoke" || id === "festival";
    const isCosmos = id === "cosmos";
    const count = Math.ceil(this.w / 25);
    for (let i = 0; i < count; i++) {
      const x = (this.w / count) * i + Math.random() * 10;
      if (isGrass) {
        this.groundDetails.push({
          x, y: gy + 2, w: 3 + Math.random() * 4, h: 5 + Math.random() * 8,
          color: `rgba(34,197,94,${0.2 + Math.random() * 0.2})`,
          sway: Math.random() * 10,
        });
      } else if (isSmoke) {
        this.groundDetails.push({
          x, y: gy + 4 + Math.random() * 4, w: 8 + Math.random() * 10, h: 5 + Math.random() * 4,
          color: `rgba(255,255,255,${0.05 + Math.random() * 0.08})`,
          sway: Math.random() * 5,
        });
      } else if (isCosmos) {
        this.groundDetails.push({
          x, y: gy, w: 1 + Math.random() * 2, h: 1 + Math.random() * 2,
          color: `rgba(167,139,250,${0.3 + Math.random() * 0.4})`,
          sway: 0,
        });
      } else {
        this.groundDetails.push({
          x, y: gy + 4, w: 4 + Math.random() * 6, h: 3 + Math.random() * 3,
          color: `rgba(0,0,0,${0.08 + Math.random() * 0.08})`,
          sway: 0,
        });
      }
    }
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
    this.wingFrame = 0;
    this.wingTimer = 0;
    this.pipes = [];
    this.particles = [];
    this.floats = [];
    this.overlays = [];
    this.score = 0;
    this.runCoins = 0;
    this.nearMiss = 0;
    this.perfectPasses = 0;
    this.combo = 0;
    this.bestCombo = 1;
    this.multiplier = 1;
    this.flaps = 0;
    this.speed = 115;
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
    this.nextPickupScore = 6;
    this.perfectStreak = 0;
    this.frenzyTimer = 0;
    this.clutch = 0;
    this.redEye = 0;
    this.redEyeTimer = 0;
    this.graceTimer = 0;
    this.deathTimer = 0;
    this.invincibilityTimer = 0;
    this.invincibilityFlash = false;
    this.comboFireTimer = 0;
    this.comboFireLevel = 0;
    this.timeRemaining = this.practiceMode ? 999999 : this.TIME_LIMIT;
    this.starterPowerUpsApplied = false;
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
      if (!this.practiceMode && this.timeRemaining <= 0) this.timeRemaining = this.TIME_LIMIT;
      this.applyStarterPowerUps();
      audio.startMusic();
      this.cb.onStateChange?.(this.state);
    }

    const mods = this.powerUpManager.getModifiers();
    const baseLift = this.flapV * this.sc * mods.flapBoost;
    const rescueHop = this.vy > 120 * this.sc && this.powerUpManager.isDoubleJumpAvailable();

    if (rescueHop && this.powerUpManager.useDoubleJump()) {
      this.vy = baseLift * 1.14;
      this.shieldInvuln = Math.max(this.shieldInvuln, 0.26);
      this.flashAlpha = Math.max(this.flashAlpha, 0.18);
      this.burst(this.bx, this.by, "#c084fc", 12, 170, "spark");
      this.addFloat(this.bx + 8 * this.sc, this.by - 28 * this.sc, "👻 HOP SAVE", "#f0abfc", 15);
      this.flaps++;
      this.wingPhase = 0;
      this.squashX = 0.72;
      this.squashY = 1.35;
      audio.flap();
      this.emitFlapPuff();
      navigator.vibrate?.([8, 18, 8]);
      return;
    }

    this.vy = baseLift;
    this.flaps++;
    this.wingPhase = 0;
    this.wingFrame = 3; // snap to max up-stroke
    this.wingTimer = 0;
    // squash & stretch: stretch vertically on flap
    this.squashX = mods.flapBoost > 1 ? 0.76 : 0.8;
    this.squashY = mods.flapBoost > 1 ? 1.3 : 1.25;
    audio.flap();
    this.emitFlapPuff();
    // Trail particles on flap
    if (!this.reducedMotion && this.trail.id !== "none") {
      createTrailSegment(this.particles, this.bx - this.radius * 0.5, this.by,
        this.trail.color, this.trail.size * this.sc, 3);
    }
    navigator.vibrate?.(8);
  }

  private emitFlapPuff() {
    const count = this.reducedMotion ? 2 : 5;
    createPuff(this.particles,
      this.bx - this.radius,
      this.by + this.radius * 0.4,
      "rgba(230,240,230,0.7)", count, 3 * this.sc);
  }

  private spawnPipe() {
    const mods = this.powerUpManager.getModifiers();
    const baseGap = 195 * this.sc;
    const skillTightening = Math.min(this.score * 0.65, 36) * this.sc;
    const speedPressure = Math.max(0, Math.min(1, ((this.speed / this.sc) - 150) / 60));
    const speedRelief = speedPressure * 30 * this.sc;
    const minGap = (150 + speedPressure * 10) * this.sc;
    const gap = Math.max(minGap, baseGap - skillTightening + speedRelief + mods.gapBonus * this.sc);
    // Apply gap tightening for tight/triple patterns
    let pattern: PipePattern = "standard";
    let oscAmp = 0;
    let oscSpeed = 2;
    let gapTighten = 0;
    const oscPhase = Math.random() * Math.PI * 2;
    const r = Math.random();
    if (this.score >= 10 && r < 0.25) {
      pattern = "tight";
      gapTighten = (15 + Math.random() * 20) * this.sc;
    } else if (this.score >= 20 && r < 0.45) {
      pattern = "moving";
      oscAmp = (20 + Math.random() * 25) * this.sc;
      oscSpeed = 2.5 + Math.random() * 1.5;
    } else if (this.score >= 35 && r < 0.55) {
      pattern = "triple";
      gapTighten = 35 * this.sc; // much tighter gaps through triple gauntlet
    } else if (this.score >= 50 && r < 0.60) {
      pattern = "moving";
      oscAmp = (35 + Math.random() * 30) * this.sc;
      oscSpeed = 3 + Math.random() * 2;
    }

    const effectiveGap = Math.max(minGap, gap - gapTighten);
    const margin = 70 * this.sc * 0.5;
    const usable = Math.max(0, this.h - this.groundH - effectiveGap - margin * 2);
    const top = margin + (usable > 0 ? Math.random() * usable : margin);
    const gapY = Math.max(effectiveGap / 2 + margin, Math.min(top + effectiveGap / 2, this.h - this.groundH - effectiveGap / 2 - margin));

    const pipe: Pipe = {
      x: this.w + 40,
      gapY,
      gap: effectiveGap,
      w: 66 * this.sc,
      passed: false,
      nearChecked: false,
      scored: false,
      pattern,
      baseGapY: gapY,
      oscAmp,
      oscPhase,
      oscSpeed,
      gapTighten,
    };
    // 20% more coin spawns than before (moving bongs still reward extra risk).
    const baseCoinChance = pattern === "moving" ? 0.50 : 0.38;
    const coinChance = Math.min(0.85, baseCoinChance * SPAWN_RATE_MULTIPLIER);
    if (Math.random() < coinChance) {
      pipe.coin = { y: gapY + (Math.random() - 0.5) * gap * 0.4, taken: false, bob: Math.random() * Math.PI * 2 };
    }
    // Every bong exhales a collectible smoke cloud near the gap. Flying through
    // the haze grants Red Eye Bonus without changing the collision shape.
    pipe.smoke = {
      offset: (Math.random() - 0.5) * gap * 0.24,
      taken: false,
      bob: Math.random() * Math.PI * 2,
    };
    this.pipes.push(pipe);

    // For triple pattern, add two more pipes offset vertically
    if (pattern === "triple") {
      const tripleStep = (this.h - this.groundH) / 3;
      const triplePipe1: Pipe = { ...pipe, gapY: tripleStep, tripleIndex: 0 };
      const triplePipe2: Pipe = { ...pipe, gapY: tripleStep * 2, tripleIndex: 1 };
      // Offset x slightly so they stagger visually
      triplePipe1.x += 20 * this.sc;
      triplePipe2.x += 40 * this.sc;
      this.pipes.push(triplePipe1, triplePipe2);
    }
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

  private collectRedEye(x: number, y: number) {
    const mods = this.powerUpManager.getModifiers();
    const frenzyMult = this.frenzyTimer > 0 ? 2 : 1;
    const gain = Math.max(1, Math.round(this.multiplier * 2 * frenzyMult * mods.scoreMult));
    this.redEye++;
    this.combo += 2;
    this.score += gain;
    this.runCoins += Math.max(1, Math.round(mods.coinMult));
    this.updateMultiplier();
    this.addRushTime(0.9, "+0.9s");
    this.redEyeTimer = Math.min(6, Math.max(this.redEyeTimer, 3.4) + 0.35);
    this.shake = Math.max(this.shake, 4);
    this.flashAlpha = Math.max(this.flashAlpha, 0.18);
    this.burst(x, y, "rgba(255,120,140,0.95)", 16, 180, "puff");
    this.burst(x, y, "#a7f3d0", 12, 150, "spark");
    this.addFloat(x, y - 22 * this.sc, `👁 RED EYE +${gain}`, "#fda4af", 18);
    audio.nearMiss();
    navigator.vibrate?.([8, 18, 8]);
    this.cb.onScore?.(this.score);
    this.cb.onCoin?.(this.runCoins);
    this.cb.onRedEye?.(this.redEye);
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

  private addRushTime(seconds: number, label?: string) {
    if (this.practiceMode) return;
    const before = this.timeRemaining;
    this.timeRemaining = Math.min(this.TIME_LIMIT, this.timeRemaining + seconds);
    if (label && this.timeRemaining > before + 0.05) {
      this.addFloat(this.bx - 20 * this.sc, this.by - 56 * this.sc, label, "#67e8f9", 14);
    }
  }

  private burst(x: number, y: number, color: string, n: number, speed: number, kind = "spark") {
    const count = this.reducedMotion ? Math.ceil(n / 2) : n;
    createBurst(this.particles, x, y, color, count, speed, kind, { size: 3 * this.sc });
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
    if (this.trail.id === "none" || this.reducedMotion) return;
    if (Math.random() > dt * 40) return;
    const id = this.trail.id;
    const c = this.trail.color;
    const def = { decay: 1, gravity: 0 };
    if (id === "puff") {
      createPuff(this.particles, this.bx - this.radius, this.by, c || "rgba(220,235,220,0.55)", 1, 4 * this.sc);
    } else if (id === "spark" || id === "cosmic" || id === "gold" || id === "glow" || id === "embers" || id === "holy") {
      createBurst(this.particles, this.bx - this.radius, this.by, c || "#fbbf24", 1, 50, "spark", def);
    } else if (id === "leaf") {
      this.particles.push({ x: this.bx - this.radius, y: this.by, vx: -40, vy: (Math.random() - 0.5) * 20, life: 0.9, maxLife: 0.9, size: 5 * this.sc, color: c || "#84cc16", kind: "leaf", rot: Math.random() * 6, vr: (Math.random() - 0.5) * 6, decay: 1, gravity: 80 });
    } else if (id === "rainbow" || id === "nebula") {
      const hue = (performance.now() / 6) % 360;
      this.particles.push({ x: this.bx - this.radius, y: this.by, vx: -40, vy: (Math.random() - 0.5) * 20, life: 0.6, maxLife: 0.6, size: 4 * this.sc, color: `hsl(${hue},90%,65%)`, kind: "spark", rot: 0, vr: 0, decay: 1, gravity: 220 });
    } else if (id === "frost") {
      this.particles.push({ x: this.bx - this.radius, y: this.by, vx: -30, vy: (Math.random() - 0.5) * 15, life: 0.7, maxLife: 0.7, size: 3 * this.sc, color: c || "#67e8f9", kind: "spark", rot: 0, vr: 0, decay: 1, gravity: 220 });
    } else if (id === "flame") {
      this.particles.push({ x: this.bx - this.radius, y: this.by, vx: -20, vy: -50 - Math.random() * 30, life: 0.4, maxLife: 0.4, size: 3 * this.sc, color: c || "#ef4444", kind: "spark", rot: 0, vr: 0, decay: 1, gravity: -15 });
    } else if (id === "shadow" || id === "void") {
      createPuff(this.particles, this.bx - this.radius, this.by, (c || "#6b7280") + "60", 1, 4 * this.sc);
    } else {
      createBurst(this.particles, this.bx - this.radius, this.by, c || "#a3e635", 1, 35, "spark", def);
    }
  }

  update(dt: number) {
    dt = Math.min(dt, 0.05); // clamp for stability (20fps floor)

    this.groundOffset = (this.groundOffset + this.speed * dt) % (40 * this.sc);
    this.wingPhase += dt * 18;

    // Wing animation cycle (4 frames)
    this.wingTimer += dt;
    if (this.wingTimer >= this.WING_FRAME_DUR) {
      this.wingTimer = 0;
      if (this.state === "playing" && this.vy < 0) {
        // Flapping upward: cycle through frames
        this.wingFrame = (this.wingFrame + 1) % 4;
      } else if (this.state === "playing") {
        // Falling: return to neutral
        this.wingFrame = this.wingFrame > 2 ? 2 : Math.max(0, this.wingFrame - 1);
      }
    }

    // squash & stretch recovery
    this.squashX += (1 - this.squashX) * Math.min(1, dt * 12);
    this.squashY += (1 - this.squashY) * Math.min(1, dt * 12);

    // parallax mountains scroll
    for (const m of this.mountains) {
      m.x -= this.speed * (0.05 + m.layer * 0.06) * dt;
      if (m.x + m.w < -20) m.x = this.w + 20 + Math.random() * 80;
    }

    // Cloud layers parallax scroll
    for (let layer = 0; layer < this.cloudLayers.length; layer++) {
      const clouds = this.cloudLayers[layer];
      for (const c of clouds) {
        c.x -= this.speed * c.speed * dt;
        if (c.x + c.w < -20) {
          c.x = this.w + 20 + Math.random() * 60;
          c.y = this.h * (0.05 + Math.random() * 0.35);
        }
      }
    }

    // Ground detail animation (sway)
    for (const gd of this.groundDetails) {
      if (gd.sway > 0) {
        gd.y = (this.h - this.groundH + 2) + Math.sin(performance.now() / 800 + gd.sway) * 2;
      }
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
      updateEffectParticles(this.particles, dt);
      updateOverlays(this.overlays, dt);
      return;
    }

    if (this.state === "dead") {
      this.deathTimer += dt;
      this.invincibilityTimer = 0;
      // bird falls
      this.vy += this.gravity * this.sc * dt;
      this.by += this.vy * dt;
      const floorY = this.h - this.groundH - this.radius;
      if (this.by > floorY) { this.by = floorY; this.vy = 0; }
      this.rot = Math.min(this.rot + dt * 4, 1.4);
      updateEffectParticles(this.particles, dt);
      updateOverlays(this.overlays, dt);
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 40);
      if (this.flashAlpha > 0) this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.5);
      return;
    }

    // playing
    this.powerUpManager.update();
    const mods = this.powerUpManager.getModifiers();
    const worldDt = dt * mods.timeScale;
    const birdDt = dt * Math.max(0.86, mods.timeScale);
    if (this.shieldInvuln > 0) this.shieldInvuln = Math.max(0, this.shieldInvuln - dt);
    if (this.redEyeTimer > 0) this.redEyeTimer = Math.max(0, this.redEyeTimer - dt);
    if (this.graceTimer > 0) this.graceTimer = Math.max(0, this.graceTimer - dt);

    // Rush clock: visible pressure, but perfect/clutch play earns time back.
    // Slow-mo now slows the clock too, so it feels like control rather than a debuff.
    if (!this.practiceMode) {
      this.timeRemaining -= dt * mods.clockScale;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.addFloat(this.w / 2, this.h * 0.28, "⏰ RUSH OVER!", "#f87171", 24);
        this.die();
        return;
      }
    }

    // smooth speed ramp: easy start, gradual climb, early plateau
    const baseSpeed = 115;
    const maxSpeed = 205;
    const rampScore = 55;
    const t = Math.min(this.score / rampScore, 1);
    this.speed = (baseSpeed + (maxSpeed - baseSpeed) * (t * t * (3 - 2 * t))) * this.sc;

    const effGravity = this.gravity * this.sc * mods.gravityMult;
    this.vy += effGravity * birdDt;
    this.by += this.vy * birdDt;
    this.rot = Math.max(-0.5, Math.min(1.2, this.vy / (700 * this.sc)));

    // squash when falling fast (stretch horizontally, compress vertically)
    if (this.vy > 300 * this.sc && this.squashX >= 0.99) {
      const fallFactor = Math.min(0.12, (this.vy - 300 * this.sc) / 3000);
      this.squashX = 1 + fallFactor;
      this.squashY = 1 - fallFactor * 0.7;
    }

    // speed lines at high speed
    if (this.score > 15 && !this.reducedMotion && Math.random() < worldDt * (this.score > 40 ? 25 : 10)) {
      this.speedLines.push({
        x: this.w + 10,
        y: Math.random() * this.h * 0.8 + this.h * 0.1,
        len: (30 + Math.random() * 60) * this.sc,
        speed: this.speed * (1.5 + Math.random()),
      });
    }
    // update speed lines
    for (let i = this.speedLines.length - 1; i >= 0; i--) {
      this.speedLines[i].x -= this.speedLines[i].speed * worldDt;
      if (this.speedLines[i].x + this.speedLines[i].len < 0) this.speedLines.splice(i, 1);
    }

    this.emitTrail(worldDt);

    // spawn pipes by spacing (skip in practice mode)
    if (!this.practiceMode) {
      const spacing = Math.max(200 * this.sc, this.w * (0.58 - Math.min(this.score / 150, 1) * 0.1));
      const last = this.pipes[this.pipes.length - 1];
      if (!last || last.x < this.w - spacing) this.spawnPipe();

      // Mid-run power-up pickups: 20% more frequent than before.
      if (this.score >= this.nextPickupScore && this.pickups.length === 0) {
        this.spawnPickup();
        this.nextPickupScore = this.score + 10 + Math.floor(Math.random() * 7);
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
        p.gapY = p.baseGapY + Math.sin(age * p.oscSpeed + p.oscPhase) * p.oscAmp;
      }
    }

    // move & collect power-up pickups
    for (const pu of this.pickups) {
      if (pu.taken) continue;
      pu.x -= this.speed * worldDt;
      pu.bob += worldDt * 4;
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
      p.x -= this.speed * worldDt;
      // coin — magnet auto-collect
      if (p.coin && !p.coin.taken) {
        p.coin.bob += worldDt * 4;
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
      // smoke cloud — Red Eye Bonus target in the gap
      if (p.smoke && !p.smoke.taken) {
        p.smoke.bob += worldDt * 2.8;
        const sx = p.x + p.w / 2 + Math.sin(p.smoke.bob * 0.7) * 5 * this.sc;
        const sy = p.gapY + p.smoke.offset + Math.sin(p.smoke.bob) * 7 * this.sc;
        const sr = 23 * this.sc;
        if (Math.hypot(sx - this.bx, sy - this.by) < this.radius + sr) {
          p.smoke.taken = true;
          this.collectRedEye(sx, sy);
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
        const scoreMult = frenzyMult * mods.scoreMult;
        const passGain = Math.round(this.multiplier * (isPerfect ? 2 : 1) * scoreMult);
        if (isPerfect) {
          this.perfectPasses++;
          this.combo++; // Bonus combo
          this.score += passGain;
          this.addRushTime(1.5, "+1.5s");
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
          this.score += passGain;
          this.addRushTime(0.8, "+0.8s");
          audio.score();
          // a non-perfect pass breaks the perfect streak (combo is untouched)
          this.perfectStreak = 0;
        }

        this.updateMultiplier();
        this.addFloat(this.bx + 20 * this.sc, this.by - 30 * this.sc, `+${passGain}`, "#ffffff", 18);
        this.cb.onScore?.(this.score);
        // score milestone celebrations
        const milestones = [10, 25, 50, 75, 100, 150, 200, 300, 500];
        for (const m of milestones) {
          if (this.score >= m && this.lastMilestone < m) {
            this.lastMilestone = m;
            this.shake = 10;
            this.flashAlpha = 0.5;
            this.burst(this.w / 2, this.h / 2, "#ffd24a", 30, 300, "spark");
            this.burst(this.w / 2, this.h / 2, "#ff6b6b", 20, 250, "spark");
            this.burst(this.w / 2, this.h / 2, "#60a5fa", 20, 250, "spark");
            this.burst(this.w / 2, this.h / 2, "#a855f7", 15, 200, "spark");
            // Confetti burst at big milestones
            if (m >= 50) {
              createConfetti(this.particles, this.w / 2, this.h * 0.3, 30,
                ["#ffd24a", "#ff6b6b", "#60a5fa", "#a855f7", "#34d399"], 200);
            }
            this.addFloat(this.w / 2, this.h * 0.3, `🎉 ${m}!`, "#ffd24a", 28);
            // Vignette flash at every milestone
            this.overlays.push({
              kind: "flash", alpha: 0.2, decay: 1.5, color: "#ffffff", intensity: 1,
            });
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
          this.flashAlpha = 0.7;
          this.shake = 10;
          this.cb.onWorld?.(nw);
          this.burst(this.w / 2, this.h * 0.35, nw.accent, 40, 350, "spark");
          createConfetti(this.particles, this.w / 2, this.h * 0.35, 40,
            [nw.accent, "#ffffff", "#ffd24a", nw.sky[0]], 250);
          // World entry overlay
          this.overlays.push({
            kind: "worldEntry", alpha: 0.3, decay: 0.8, color: nw.accent, intensity: 20,
          });
          this.overlays.push({
            kind: "flash", alpha: 0.3, decay: 1.5, color: nw.sky[0], intensity: 1,
          });
          this.addFloat(this.w / 2, this.h * 0.35, "✦ " + nw.name + " ✦", nw.accent, 26);
          audio.setWorld(nw.id);
          audio.worldChange();
          this.initGroundDetails();
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
          const scoreMult = frenzyMult * mods.scoreMult;
          // A "clutch" is an extremely tight escape — bigger reward & drama.
          const isClutch = near < 6 * this.sc;
          if (isClutch) {
            this.clutch++;
            const clutchGain = Math.round(this.multiplier * 3 * scoreMult);
            this.score += clutchGain;
            this.addRushTime(1.2, "+1.2s");
            audio.clutch();
            this.shake = 9;
            this.flashAlpha = Math.max(this.flashAlpha, 0.35);
            navigator.vibrate?.([10, 25, 10, 25, 40]);
            this.burst(this.bx + this.radius, this.by, "#fbbf24", 16, 220, "spark");
            this.burst(this.bx + this.radius, this.by, "#ffffff", 10, 130, "puff");
            this.addFloat(this.bx, this.by + 24 * this.sc, "⚡ CLUTCH! +" + clutchGain, "#fbbf24", 18);
            this.cb.onClutch?.(this.clutch);
          } else {
            const nearMissGain = Math.round(this.multiplier * scoreMult);
            this.score += nearMissGain;
            this.addRushTime(0.5, "+0.5s");
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

    // Update comb fire level
    const prevFireLevel = this.comboFireLevel;
    if (this.combo >= 20) this.comboFireLevel = 4;
    else if (this.combo >= 12) this.comboFireLevel = 3;
    else if (this.combo >= 6) this.comboFireLevel = 2;
    else if (this.combo >= 3) this.comboFireLevel = 1;
    else this.comboFireLevel = 0;
    if (this.comboFireLevel !== prevFireLevel) {
      this.cb.onComboFireLevel?.(this.comboFireLevel);
    }
    if (this.comboFireLevel > 0) {
      this.comboFireTimer += dt;
    } else {
      this.comboFireTimer = 0;
    }

    updateEffectParticles(this.particles, dt);
    updateOverlays(this.overlays, dt);
    this.updateFloats(dt);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 40);
    if (this.flashAlpha > 0) this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.5);
  }

  // Float-text lifetime. Text pops in fully then fades out fast (~0.5s total) so
  // it never lingers over the play area. `life` is used directly as alpha at draw.
  private static readonly FLOAT_LIFETIME = 0.5; // seconds on screen before gone
  private updateFloats(dt: number) {
    if (this.floats.length === 0) return;
    let write = 0;
    for (let i = 0; i < this.floats.length; i++) {
      const f = this.floats[i];
      f.y += f.vy * dt;                 // drift upward
      f.vy *= 1 - Math.min(1, dt * 3);  // ease the drift
      // Fade over FLOAT_LIFETIME: hold near-full for the first ~30%, then fade out.
      f.life -= dt / GameEngine.FLOAT_LIFETIME;
      if (f.life > 0) this.floats[write++] = f;
    }
    this.floats.length = write;
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
    this.deathTimer = 0;
    audio.hit();
    audio.deathExplosion();
    this.shake = 18;
    this.flashAlpha = 1;
    navigator.vibrate?.([30, 30, 50]);
    // dramatic death burst — many colored fragments
    createBurst(this.particles, this.bx, this.by, "#ff6b6b", 30, 350, "spark");
    createBurst(this.particles, this.bx, this.by, "#ffd24a", 22, 280, "spark");
    createBurst(this.particles, this.bx, this.by, this.skin.wingColor, 18, 220, "leaf");
    createBurst(this.particles, this.bx, this.by, "#ffffff", 14, 200, "puff");
    createRing(this.particles, this.bx, this.by, this.skin.bodyColor, 16, 220, "spark");
    createConfetti(this.particles, this.bx, this.by, 25,
      [this.skin.bodyColor, this.skin.wingColor, "#ff6b6b", "#ffd24a", "#a78bfa"], 200);
    // Red overlay flash
    this.overlays.push({
      kind: "flash", alpha: 0.5, decay: 1.5, color: "#ff4444", intensity: 1,
    });
    this.overlays.push({
      kind: "vignette", alpha: 0.6, decay: 1, color: "", intensity: 0.8,
    });

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
      redEye: this.redEye,
    };
    this.cb.onStateChange?.(this.state);
    this.cb.onDeath?.(result);
  }


  // ============ RENDER ============
  render(ctx: CanvasRenderingContext2D) {
    const w = this.w, h = this.h;
    ctx.save();
    if (this.shake > 0 && !this.reducedMotion) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    }

    this.drawBackground(ctx);
    this.drawClouds(ctx);
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
    this.drawGroundDetails(ctx);

    // particles behind bird
    this.drawParticles(ctx);

    // bird
    this.drawBird(ctx);

    // floats — hold readable briefly, then fade out fast (life: 1 → 0 over ~0.5s)
    for (const f of this.floats) {
      ctx.save();
      // Full opacity while life > 0.6 (~first 0.2s), then smooth fade to 0.
      ctx.globalAlpha = f.life >= 0.6 ? 1 : Math.max(0, f.life / 0.6);
      ctx.font = `900 ${f.size}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }

    // Combo fire effect — flame particles around bird at high combo
    if (this.comboFireLevel >= 2 && !this.highContrast && !this.reducedMotion && this.state === "playing") {
      this.drawComboFire(ctx);
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

    // Red Eye glaze — pale red stoned effect after flying through bong smoke.
    if (this.redEyeTimer > 0) this.drawRedEyeGlaze(ctx);

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

    // Shield indicator when invulnerable after revive
    if (this.shieldInvuln > 0 && this.state === "playing" && this.graceTimer <= 0) {
      ctx.save();
      const alpha = 0.25 + Math.sin(performance.now() / 60) * 0.15;
      ctx.strokeStyle = `rgba(96,165,250,${alpha})`;
      ctx.lineWidth = 2.5 * this.sc;
      ctx.shadowColor = "#60a5fa";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(this.bx, this.by, this.radius * 1.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Invincibility flash after shield break
    if (this.shieldInvuln > 0.01 && this.shieldInvuln < 0.5 && !this.highContrast) {
      const flashOn = Math.sin(performance.now() / 50) > 0;
      if (flashOn) {
        ctx.fillStyle = "rgba(96,165,250,0.12)";
        ctx.fillRect(-20, -20, w + 40, h + 40);
      }
    }

    // Screen overlays (flash, vignette, scanline, world entry)
    drawOverlays(ctx, this.overlays, w, h);

    // world flash
    if (this.flashAlpha > 0 && !this.reducedMotion) {
      ctx.fillStyle = `rgba(255,255,255,${this.flashAlpha * 0.5})`;
      ctx.fillRect(-20, -20, w + 40, h + 40);
    }
    ctx.restore();

    // Scanline overlay (subtle CRT effect)
    if (!this.highContrast && !this.reducedMotion) {
      ctx.save();
      ctx.globalAlpha = 0.03;
      ctx.fillStyle = "#000000";
      for (let y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1);
      }
      ctx.restore();
    }

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
        // Combo label with fire color at high combos
        const comboColor = this.combo >= 10 ? "#ff6b53" : this.combo >= 5 ? "#fbbf24" : this.world.accent;
        ctx.font = `800 ${20 * this.sc}px system-ui, sans-serif`;
        ctx.fillStyle = comboColor;
        const pulse = this.combo >= 10 ? 1 + Math.sin(performance.now() / 150) * 0.1 : 1;
        ctx.save();
        ctx.globalAlpha = Math.min(1, pulse);
        ctx.strokeText(`x${this.multiplier} COMBO`, w / 2, 92 * this.sc);
        ctx.fillText(`x${this.multiplier} COMBO`, w / 2, 92 * this.sc);
        ctx.restore();
      }
      ctx.restore();
      this.drawRushTimer(ctx);
    }
  }

  private drawClouds(ctx: CanvasRenderingContext2D) {
    if (this.highContrast) return;
    ctx.save();
    for (let layer = 0; layer < this.cloudLayers.length; layer++) {
      const clouds = this.cloudLayers[layer];
      const alphaBase = 0.04 + layer * 0.04;
      ctx.fillStyle = `rgba(255,255,255,${alphaBase})`;
      for (const c of clouds) {
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(c.x + c.w * 0.3, c.y - c.h * 0.2, c.w * 0.35, c.h * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(c.x - c.w * 0.25, c.y + c.h * 0.1, c.w * 0.3, c.h * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private drawGroundDetails(ctx: CanvasRenderingContext2D) {
    if (this.highContrast) return;
    const gy = this.h - this.groundH;
    ctx.save();
    for (const gd of this.groundDetails) {
      ctx.fillStyle = gd.color;
      const sway = gd.sway > 0 ? Math.sin(performance.now() / 800 + gd.sway) * 3 : 0;
      if (gd.w < 5) {
        // small dots (cosmos stars, rocks)
        ctx.beginPath();
        ctx.arc(gd.x + sway, gd.y, gd.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (gd.h > gd.w) {
        // grass tufts
        ctx.beginPath();
        ctx.moveTo(gd.x + sway, gy);
        ctx.lineTo(gd.x + gd.w / 2 + sway, gy - gd.h);
        ctx.lineTo(gd.x + gd.w + sway, gy);
        ctx.fill();
      } else {
        // smoke wisps
        ctx.beginPath();
        ctx.arc(gd.x + sway, gd.y, gd.w / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private drawComboFire(ctx: CanvasRenderingContext2D) {
    const now = performance.now();
    const count = this.comboFireLevel >= 3 ? 8 : 5;
    const colors = this.comboFireLevel >= 4
      ? ["#ef4444", "#f97316", "#fbbf24", "#ffffff", "#a855f7"]
      : this.comboFireLevel >= 3
        ? ["#f97316", "#fbbf24", "#ef4444", "#ffffff"]
        : ["#fbbf24", "#f97316", "#ffffff"];
    ctx.save();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + now / 500;
      const dist = this.radius * (1.1 + 0.15 * Math.sin(now / 300 + i));
      const fx = this.bx + Math.cos(angle) * dist;
      const fy = this.by + Math.sin(angle) * dist * 0.6;
      const fs = (2 + Math.sin(now / 200 + i * 2) * 1.5) * this.sc;
      const alpha = 0.4 + 0.3 * Math.sin(now / 400 + i * 1.5);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = colors[i % colors.length];
      ctx.shadowColor = colors[i % colors.length];
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(fx, fy, fs, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawRedEyeGlaze(ctx: CanvasRenderingContext2D) {
    const pulse = this.reducedMotion ? 0 : Math.sin(performance.now() / 260) * 0.04;
    const alpha = Math.min(0.24, 0.10 + this.redEyeTimer * 0.025 + pulse);
    ctx.save();
    ctx.fillStyle = `rgba(255,105,125,${alpha})`;
    ctx.fillRect(-20, -20, this.w + 40, this.h + 40);

    const vg = ctx.createRadialGradient(this.w / 2, this.h * 0.45, this.h * 0.1, this.w / 2, this.h / 2, this.h * 0.82);
    vg.addColorStop(0, "rgba(255,210,210,0)");
    vg.addColorStop(0.62, `rgba(255,120,140,${alpha * 0.16})`);
    vg.addColorStop(1, `rgba(120,0,30,${alpha * 0.92})`);
    ctx.fillStyle = vg;
    ctx.fillRect(-20, -20, this.w + 40, this.h + 40);

    ctx.globalAlpha = Math.min(0.22, alpha * 0.9);
    ctx.strokeStyle = "rgba(255,230,230,0.7)";
    ctx.lineWidth = 1.2 * this.sc;
    const drift = this.reducedMotion ? 0 : performance.now() / 420;
    for (let y = 50 * this.sc; y < this.h; y += 58 * this.sc) {
      ctx.beginPath();
      for (let x = -20; x <= this.w + 20; x += 18 * this.sc) {
        const waveY = y + Math.sin(x / 34 + drift + y / 90) * 3 * this.sc;
        if (x <= -19) ctx.moveTo(x, waveY);
        else ctx.lineTo(x, waveY);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawRushTimer(ctx: CanvasRenderingContext2D) {
    if (this.practiceMode || this.timeRemaining <= 0) return;
    const warning = this.isTimeWarning();
    const label = `${Math.ceil(this.timeRemaining)}s`;
    const x = this.w - 56 * this.sc;
    const y = 52 * this.sc;
    const pulse = warning ? 0.75 + Math.sin(performance.now() / 80) * 0.25 : 1;

    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = warning ? "rgba(127,29,29,0.72)" : "rgba(15,23,42,0.58)";
    ctx.strokeStyle = warning ? "#f87171" : "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1.5 * this.sc;
    ctx.beginPath();
    ctx.roundRect(x - 42 * this.sc, y - 20 * this.sc, 84 * this.sc, 32 * this.sc, 14 * this.sc);
    ctx.fill();
    ctx.stroke();
    ctx.font = `900 ${16 * this.sc}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = warning ? "#fecaca" : "#e0f2fe";
    ctx.fillText(`⏱ ${label}`, x, y - 4 * this.sc);
    ctx.restore();
    ctx.textBaseline = "alphabetic";
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
    const groundY = this.h - this.groundH;

    this.drawBlunt(ctx, p, topEdge, Math.max(0, topEdge));
    this.drawBong(ctx, p, botEdge, Math.max(0, groundY - botEdge), 1);
    this.drawBongSmoke(ctx, p, topEdge, botEdge);
    this.drawPipeCoin(ctx, p);
  }

  private drawBlunt(ctx: CanvasRenderingContext2D, p: Pipe, mouthY: number, length: number) {
    if (length < 18 * this.sc) return;

    const x = p.x;
    const w = p.w;
    const cx = x + w / 2;
    const safeLength = Math.max(18 * this.sc, length);

    const paper = this.highContrast ? "#d4a574" : "#c9956b";
    const paperDark = this.highContrast ? "#a07850" : "#a07850";
    const outline = this.highContrast ? "#fff" : "rgba(160,120,80,0.65)";
    const glow = this.highContrast ? "#ffd700" : this.world.accent;

    ctx.save();
    if (!this.highContrast) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = 8;
    }

    const bodyW = w * 0.88;
    const bodyX = x + (w - bodyW) / 2;

    // Crutch (filter tip) at the mouth end — visible at the gap edge
    const crutchH = Math.min(14 * this.sc, safeLength * 0.12);
    const crutchY = mouthY - crutchH;

    ctx.fillStyle = "#f0dbb8";
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.5 * this.sc;
    ctx.beginPath();
    ctx.roundRect(bodyX, crutchY, bodyW, crutchH, 3 * this.sc);
    ctx.fill();
    ctx.stroke();

    // Crutch texture lines
    ctx.strokeStyle = "rgba(160,120,80,0.25)";
    ctx.lineWidth = 1 * this.sc;
    for (let i = 0; i < 3; i++) {
      const ly = crutchY + (i + 1) * crutchH / 4;
      ctx.beginPath();
      ctx.moveTo(bodyX + 2 * this.sc, ly);
      ctx.lineTo(bodyX + bodyW - 2 * this.sc, ly);
      ctx.stroke();
    }

    // Main paper body — solid brown cylinder filling the space
    const bodyTop = 0;
    const bodyH = safeLength - crutchH;

    const bodyGrad = ctx.createLinearGradient(x, 0, x + w, 0);
    bodyGrad.addColorStop(0, "rgba(0,0,0,0.20)");
    bodyGrad.addColorStop(0.35, "rgba(255,255,255,0.12)");
    bodyGrad.addColorStop(0.65, "rgba(0,0,0,0.06)");
    bodyGrad.addColorStop(1, "rgba(0,0,0,0.20)");

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2 * this.sc;
    ctx.beginPath();
    ctx.roundRect(bodyX, bodyTop, bodyW, bodyH, 4 * this.sc);
    ctx.fill();
    ctx.stroke();

    // Warm paper overlay
    const paperGrad = ctx.createLinearGradient(0, bodyTop, 0, bodyTop + bodyH);
    paperGrad.addColorStop(0, paperDark);
    paperGrad.addColorStop(0.15, paper);
    paperGrad.addColorStop(0.85, paper);
    paperGrad.addColorStop(1, paperDark);
    ctx.fillStyle = paperGrad;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(bodyX + 1, bodyTop + 1, bodyW - 2, bodyH - 2);
    ctx.globalAlpha = 1;

    // Rolling seam spiral line
    ctx.strokeStyle = "rgba(140,100,60,0.35)";
    ctx.lineWidth = 1.8 * this.sc;
    const seamMid = bodyH * 0.45;
    ctx.beginPath();
    ctx.moveTo(bodyX + bodyW * 0.12, bodyTop);
    ctx.lineTo(bodyX + bodyW * 0.88, bodyTop + seamMid);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bodyX + bodyW * 0.12, bodyTop + seamMid + bodyH * 0.06);
    ctx.lineTo(bodyX + bodyW * 0.88, bodyTop + bodyH);
    ctx.stroke();

    // Leaf accent
    ctx.fillStyle = "rgba(80,180,60,0.55)";
    ctx.font = `900 ${bodyW * 0.38}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🍃", cx, mouthY - safeLength * 0.40);

    // Ember glow at the cut end
    if (!this.highContrast) {
      ctx.shadowColor = "#ff9944";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "rgba(255,180,80,0.08)";
      ctx.beginPath();
      ctx.arc(cx, mouthY - 3 * this.sc, w * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 8;
    }

    ctx.restore();
    ctx.textBaseline = "alphabetic";
  }

  private drawBong(ctx: CanvasRenderingContext2D, p: Pipe, mouthY: number, length: number, direction: 1 | -1) {
    if (length < 18 * this.sc) return;

    const main = this.highContrast ? "#00d0a0" : this.world.pipe;
    const dark = this.highContrast ? "#008060" : this.world.pipeDark;
    const outline = this.highContrast ? "#eaffff" : "rgba(219,255,219,0.78)";
    const glass = this.highContrast ? "rgba(0,208,160,0.36)" : "rgba(183,255,210,0.20)";
    const glassHL = "rgba(255,255,255,0.32)";
    const liquid = this.highContrast ? "#7cff9b" : main;
    const glow = this.highContrast ? "#00ffd5" : this.world.accent;
    const x = p.x;
    const w = p.w;
    const cx = x + w / 2;
    const yAt = (offset: number) => mouthY + direction * offset;
    const rectY = (offset: number, h: number) => direction === 1 ? mouthY + offset : mouthY - offset - h;
    const safeLength = Math.max(18 * this.sc, length);
    const neckW = w * 0.43;
    const neckX = x + (w - neckW) / 2;
    const neckH = Math.min(Math.max(54 * this.sc, safeLength * 0.42), Math.max(22 * this.sc, safeLength - 16 * this.sc));
    const bulbR = Math.min(w * 0.62, Math.max(24 * this.sc, safeLength * 0.18));
    const bulbOffset = Math.min(Math.max(neckH + bulbR * 0.55, 48 * this.sc), safeLength - bulbR * 0.42);
    const bulbY = yAt(bulbOffset);

    ctx.save();
    if (!this.highContrast) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = 10;
    }

    // Brighter glass gradient for banner-style look.
    const backGrad = ctx.createLinearGradient(x, 0, x + w, 0);
    backGrad.addColorStop(0, "rgba(0,0,0,0.24)");
    backGrad.addColorStop(0.25, glass);
    backGrad.addColorStop(0.55, "rgba(255,255,255,0.18)");
    backGrad.addColorStop(1, "rgba(0,0,0,0.26)");

    // Mouthpiece rim at the playable gap edge.
    const rimH = 12 * this.sc;
    const rimY = rectY(-rimH * 0.25, rimH);
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.roundRect(x - w * 0.14, rimY, w * 1.28, rimH, 7 * this.sc);
    ctx.fill();
    ctx.fillStyle = glassHL;
    ctx.beginPath();
    ctx.roundRect(x - w * 0.08, rimY + 2 * this.sc, w * 1.16, rimH * 0.42, 5 * this.sc);
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.6 * this.sc;
    ctx.stroke();

    // Tall glass neck with inner liquid and highlights.
    const neckY = rectY(0, neckH);
    ctx.fillStyle = backGrad;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2.2 * this.sc;
    ctx.beginPath();
    ctx.roundRect(neckX, neckY, neckW, neckH, 9 * this.sc);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(neckX + 3 * this.sc, neckY + 3 * this.sc, neckW - 6 * this.sc, neckH - 6 * this.sc, 7 * this.sc);
    ctx.clip();
    const liquidY = direction === 1 ? neckY + neckH * 0.56 : neckY + neckH * 0.12;
    const liquidH = neckH * 0.34;
    const lg = ctx.createLinearGradient(0, liquidY, 0, liquidY + liquidH);
    lg.addColorStop(0, "rgba(190,255,120,0.58)");
    lg.addColorStop(1, liquid);
    ctx.fillStyle = lg;
    ctx.fillRect(neckX, liquidY, neckW, liquidH);
    ctx.fillStyle = glassHL;
    ctx.fillRect(neckX + neckW * 0.18, neckY, neckW * 0.16, neckH);
    ctx.fillStyle = "rgba(255,255,255,0.50)";
    ctx.fillRect(neckX + neckW * 0.05, neckY + neckH * 0.2, neckW * 0.06, neckH * 0.6);
    ctx.restore();

    // Chamber glow (banner-style pulsing aura).
    if (!this.highContrast) {
      const pulse = 0.08 + 0.04 * Math.sin(performance.now() / 600 + p.oscPhase);
      ctx.fillStyle = `rgba(74,222,128,${pulse})`;
      ctx.beginPath();
      ctx.arc(cx, bulbY, bulbR * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Round chamber / beaker base like the banner art.
    ctx.fillStyle = backGrad;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2.4 * this.sc;
    ctx.beginPath();
    ctx.ellipse(cx, bulbY, bulbR * 0.92, bulbR * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Green liquid in the chamber, clipped to the bulb.
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, bulbY, bulbR * 0.86, bulbR * 0.72, 0, 0, Math.PI * 2);
    ctx.clip();
    const fillTop = direction === 1 ? bulbY + bulbR * 0.02 : bulbY - bulbR * 0.56;
    const fillHeight = bulbR * 0.62;
    const chamberGrad = ctx.createLinearGradient(0, fillTop, 0, fillTop + fillHeight);
    chamberGrad.addColorStop(0, "rgba(216,255,120,0.80)");
    chamberGrad.addColorStop(0.5, "rgba(74,222,128,0.75)");
    chamberGrad.addColorStop(1, liquid);
    ctx.fillStyle = chamberGrad;
    ctx.fillRect(cx - bulbR, fillTop, bulbR * 2, fillHeight);
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 1.6 * this.sc;
    ctx.beginPath();
    const waveY = direction === 1 ? fillTop + 2 * this.sc : fillTop + fillHeight - 2 * this.sc;
    ctx.moveTo(cx - bulbR, waveY);
    ctx.quadraticCurveTo(cx - bulbR * 0.25, waveY - direction * 7 * this.sc, cx + bulbR * 0.25, waveY);
    ctx.quadraticCurveTo(cx + bulbR * 0.65, waveY + direction * 7 * this.sc, cx + bulbR, waveY);
    ctx.stroke();
    ctx.restore();

    // Bulge specular highlight on the chamber glass.
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.beginPath();
    ctx.ellipse(cx - bulbR * 0.3, bulbY - bulbR * 0.25, bulbR * 0.22, bulbR * 0.18, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Bubbles inside chamber - more and flashier.
    for (let i = 0; i < 7; i++) {
      const bx = cx + Math.sin(p.oscPhase + i * 1.7 + performance.now() / 800) * bulbR * 0.48;
      const by = bulbY + direction * ((i - 3) * bulbR * 0.14 + Math.sin(performance.now() / 400 + i * 2) * 3 * this.sc);
      const br = (2 + (i % 4) * 1.5) * this.sc;
      ctx.fillStyle = i % 2 === 0 ? "rgba(220,255,160,0.85)" : "rgba(180,255,220,0.70)";
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.arc(bx - br * 0.25, by - br * 0.25, br * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // Side stem and bowl.
    ctx.shadowBlur = 0;
    const stemStartX = neckX + neckW * 0.78;
    const stemStartY = yAt(neckH * 0.58);
    const stemEndX = x + w * 1.12;
    const stemEndY = yAt(neckH * 0.84);
    ctx.strokeStyle = outline;
    ctx.lineWidth = 5 * this.sc;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(stemStartX, stemStartY);
    ctx.lineTo(stemEndX, stemEndY);
    ctx.stroke();
    ctx.strokeStyle = "rgba(74,222,128,0.72)";
    ctx.lineWidth = 2.2 * this.sc;
    ctx.beginPath();
    ctx.moveTo(stemStartX, stemStartY);
    ctx.lineTo(stemEndX, stemEndY);
    ctx.stroke();
    ctx.fillStyle = dark;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.5 * this.sc;
    ctx.beginPath();
    ctx.ellipse(stemEndX + 4 * this.sc, stemEndY, 8 * this.sc, 6 * this.sc, direction * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Extra white-glass gleams and a cork ring detail.
    ctx.strokeStyle = "rgba(255,255,255,0.50)";
    ctx.lineWidth = 1.6 * this.sc;
    ctx.beginPath();
    ctx.moveTo(neckX + neckW * 0.23, neckY + neckH * 0.12);
    ctx.lineTo(neckX + neckW * 0.23, neckY + neckH * 0.86);
    ctx.stroke();
    ctx.strokeStyle = "rgba(120,70,30,0.65)";
    ctx.lineWidth = 3 * this.sc;
    const corkY = rectY(neckH * 0.18, 1 * this.sc);
    ctx.beginPath();
    ctx.moveTo(neckX - 2 * this.sc, corkY);
    ctx.lineTo(neckX + neckW + 2 * this.sc, corkY);
    ctx.stroke();

    if (p.pattern === "moving") {
      ctx.fillStyle = "rgba(255,255,255,0.36)";
      ctx.font = `900 ${11 * this.sc}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillText("↕", cx, yAt(Math.min(safeLength - 12 * this.sc, bulbOffset + bulbR * 0.88)));
    }

    ctx.restore();
    ctx.textBaseline = "alphabetic";
  }

  private drawBongSmoke(ctx: CanvasRenderingContext2D, p: Pipe, topEdge: number, botEdge: number) {
    if (!p.smoke) return;
    const bob = p.smoke.bob + performance.now() / 900;
    const targetX = p.x + p.w / 2 + Math.sin(bob * 0.7) * 5 * this.sc;
    const targetY = p.gapY + p.smoke.offset + Math.sin(bob) * 7 * this.sc;

    const drawWisp = (mouthY: number, direction: 1 | -1) => {
      const baseAlpha = this.highContrast ? 0.18 : 0.42;
      for (let i = 0; i < 4; i++) {
        const drift = Math.sin(bob + i * 1.1) * 8 * this.sc;
        const sx = p.x + p.w / 2 + drift + (i - 1.5) * 5 * this.sc;
        const sy = mouthY + direction * (13 + i * 11) * this.sc;
        const r = (8 + i * 3) * this.sc;
        ctx.fillStyle = i % 2 === 0
          ? `rgba(210,255,160,${baseAlpha - i * 0.055})`
          : `rgba(216,180,254,${baseAlpha - i * 0.06})`;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    ctx.save();
    if (!this.highContrast) {
      ctx.shadowColor = p.smoke.taken ? "#d8b4fe" : "#fb7185";
      ctx.shadowBlur = p.smoke.taken ? 8 : 16;
    }
    drawWisp(topEdge, 1);
    drawWisp(botEdge, -1);

    // Gameplay smoke target — visible red-eyed cloud in the center of the gap.
    const targetAlpha = p.smoke.taken ? 0.18 : 0.68;
    const cloudColors = ["rgba(217,249,157,", "rgba(216,180,254,", "rgba(254,205,211,"];
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2 + bob * 0.18;
      const sx = targetX + Math.cos(angle) * 13 * this.sc;
      const sy = targetY + Math.sin(angle) * 8 * this.sc;
      const r = (11 + (i % 3) * 2) * this.sc;
      ctx.fillStyle = `${cloudColors[i % cloudColors.length]}${targetAlpha * (p.smoke.taken ? 0.45 : 0.78)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!p.smoke.taken) {
      ctx.fillStyle = "rgba(255,110,130,0.20)";
      ctx.beginPath();
      ctx.arc(targetX, targetY, 27 * this.sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,210,215,0.78)";
      ctx.lineWidth = 1.8 * this.sc;
      ctx.beginPath();
      ctx.ellipse(targetX, targetY, 15 * this.sc, 8 * this.sc, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(225,29,72,0.82)";
      ctx.beginPath();
      ctx.arc(targetX, targetY, 3.2 * this.sc, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawPipeCoin(ctx: CanvasRenderingContext2D, p: Pipe) {
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
    drawParticles(ctx, this.particles);
  }

  private drawBird(ctx: CanvasRenderingContext2D) {
    // Invincibility flash — skip draw every other frame
    if (this.invincibilityTimer > 0 && this.invincibilityFlash && Math.sin(performance.now() / 50) < 0) {
      return;
    }

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
      ctx.shadowColor = this.skin.wingColor;
      ctx.shadowBlur = 12;
    }
    // body
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r);
    g.addColorStop(0, this.skin.bodyColor);
    g.addColorStop(1, this.skin.wingColor);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, 7);
    ctx.fill();
    ctx.shadowBlur = 0;

    // leaf points on top (cannabis vibe)
    ctx.fillStyle = this.skin.wingColor;
    for (let i = -1; i <= 1; i++) {
      ctx.save();
      ctx.translate(i * r * 0.45, -r * 0.7);
      ctx.rotate(i * 0.3);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.25, r * 0.16, r * 0.4, 0, 0, 7);
      ctx.fill();
      ctx.restore();
    }

    // Wing animation based on frame keyframe selection
    //   frame 0: neutral (idle)
    //   frame 1: slight lift
    //   frame 2: mid-upstroke
    //   frame 3: full upstroke (peak flap)
    if (this.wingFrame >= 3) {
      // Full upstroke — wing pulled up tight
      ctx.fillStyle = this.skin.wingColor;
      ctx.beginPath();
      ctx.ellipse(-r * 0.15, -r * 0.55, r * 0.45, r * 0.3, -0.5, 0, 7);
      ctx.fill();
    } else if (this.wingFrame >= 2) {
      // Mid upstroke
      ctx.fillStyle = this.skin.wingColor;
      ctx.beginPath();
      ctx.ellipse(-r * 0.18, -r * 0.3, r * 0.48, r * 0.3, -0.4, 0, 7);
      ctx.fill();
    } else if (this.wingFrame >= 1) {
      // Slight lift
      ctx.fillStyle = this.skin.wingColor;
      ctx.beginPath();
      ctx.ellipse(-r * 0.2, -r * 0.1, r * 0.5, r * 0.3, -0.3, 0, 7);
      ctx.fill();
    } else {
      // Neutral / idle frame 0 — wing down
      const wingY = Math.sin(this.wingPhase) * r * 0.3;
      ctx.fillStyle = this.skin.wingColor;
      ctx.beginPath();
      ctx.ellipse(-r * 0.2, r * 0.1 + wingY, r * 0.5, r * 0.32, -0.3, 0, 7);
      ctx.fill();
    }

    // eye with periodic blink
    const blinkCycle = (performance.now() / 100) % 40;
    const isBlinking = blinkCycle > 38.5; // brief blink every ~4 seconds
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    if (isBlinking) {
      // closed eye — thin line
      ctx.strokeStyle = this.skin.crestColor;
      ctx.lineWidth = 2.5 * this.sc;
      ctx.moveTo(r * 0.1, -r * 0.2);
      ctx.lineTo(r * 0.7, -r * 0.2);
      ctx.stroke();
    } else {
      ctx.arc(r * 0.4, -r * 0.2, r * 0.32, 0, 7);
      ctx.fill();
      ctx.fillStyle = this.skin.crestColor;
      ctx.beginPath();
      ctx.arc(r * 0.5, -r * 0.2, r * 0.16, 0, 7);
      ctx.fill();
      // eye highlight
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.arc(r * 0.42, -r * 0.28, r * 0.08, 0, 7);
      ctx.fill();
      // chill half-lids
      ctx.strokeStyle = this.skin.crestColor;
      ctx.lineWidth = 2 * this.sc;
      ctx.beginPath();
      ctx.arc(r * 0.4, -r * 0.2, r * 0.32, Math.PI * 1.05, Math.PI * 1.9);
      ctx.stroke();
    }

    // smile
    ctx.strokeStyle = this.skin.crestColor;
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

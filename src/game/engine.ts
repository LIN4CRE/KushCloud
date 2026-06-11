import { Skin, Trail, World, worldForScore } from "./data";
import { audio } from "./audio";
import { PowerUpManager } from "./powerups";
import { SharedPreferencesHelper } from "./persistence/SharedPreferencesHelper";

export interface RunResult {
  runId: string;
  score: number;
  coins: number;
  nearMiss: number;
  perfectPasses: number;
  bestCombo: number;
  durationMs: number;
  flaps: number;
}

type GameState = "ready" | "playing" | "dead";

interface Pipe {
  x: number;
  gapY: number;
  gap: number;
  w: number;
  passed: boolean;
  nearChecked: boolean;
  coin?: { y: number; taken: boolean; bob: number };
  scored: boolean;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number; color: string; kind: string; rot: number; vr: number;
}

interface FloatText {
  x: number; y: number; vy: number; life: number; text: string; color: string; size: number;
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
}

export class GameEngine {
  private w = 360;
  private h = 640;
  private sc = 1;
  state: GameState = "ready";

  // bird
  private bx = 0; private by = 0; private vy = 0; private radius = 16; private rot = 0;
  private wingPhase = 0;

  // world physics
  private gravity = 1750;
  private flapV = -520;
  private speed = 165;

  private pipes: Pipe[] = [];
  private particles: Particle[] = [];
  private floats: FloatText[] = [];
  private groundOffset = 0;
  private decor: { x: number; y: number; s: number; type: number; spd: number }[] = [];

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
  private powerUpManager: PowerUpManager | null = null;

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
  }

  setPowerUpManager(m: PowerUpManager) {
    this.powerUpManager = m;
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.sc = Math.max(0.7, Math.min(1.4, h / 640));
    this.radius = 17 * this.sc;
    this.bx = w * 0.3;
    if (this.state === "ready") this.by = h * 0.45;
    this.initDecor();
  }

  private initDecor() {
    this.decor = [];
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
    this.speed = 165;
    this.shake = 0;
    this.flashAlpha = 0;
    this.world = worldForScore(0);
    this.cb.onWorld?.(this.world);
    this.cb.onStateChange?.(this.state);
  }

  flap() {
    if (this.state === "dead") return;
    if (this.state === "ready") {
      this.state = "playing";
      this.startTime = performance.now();
      this.cb.onStateChange?.(this.state);
    }
    if (this.vy > 0 && this.powerUpManager?.isDoubleJumpAvailable()) {
      this.powerUpManager.useDoubleJump();
      this.vy = this.flapV * this.sc;
      this.wingPhase = 0;
      audio.flap();
      this.emitFlapPuff();
      return;
    }
    this.vy = this.flapV * this.sc;
    this.flaps++;
    this.wingPhase = 0;
    audio.flap();
    this.powerUpManager?.resetDoubleJump();
    this.emitFlapPuff();
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

  private get difficulty() {
    return Math.min(1, this.score / 50);
  }

  private spawnPipe() {
    const d = this.difficulty;
    let gap = (200 - d * 62) * this.sc;
    gap = Math.max(90 * this.sc, gap);
    const margin = 70 * this.sc * 0.5;
    const usable = this.h - this.groundH - gap - margin * 2;
    const top = margin + (usable > 0 ? Math.random() * usable : this.h * 0.25);
    const gapY = top + gap / 2;
    const pipe: Pipe = {
      x: this.w + 40,
      gapY,
      gap,
      w: 66 * this.sc,
      passed: false,
      nearChecked: false,
      scored: false,
    };
    // 38% chance of a coin in the gap
    if (Math.random() < 0.38) {
      pipe.coin = { y: gapY + (Math.random() - 0.5) * gap * 0.4, taken: false, bob: Math.random() * Math.PI * 2 };
    }
    this.pipes.push(pipe);
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
    this.speed = (165 + this.difficulty * 120) * this.sc;
    this.vy += this.gravity * this.sc * dt;
    this.by += this.vy * dt;
    this.rot = Math.max(-0.5, Math.min(1.2, this.vy / (700 * this.sc)));

    this.emitTrail(dt);

    // spawn pipes by spacing (skip in practice mode)
    if (!this.practiceMode) {
      const spacing = Math.max(180 * this.sc, this.w * 0.52);
      const last = this.pipes[this.pipes.length - 1];
      if (!last || last.x < this.w - spacing) this.spawnPipe();
    }

    const floorY = this.h - this.groundH - this.radius;
    const ceil = this.radius;

    for (const p of this.pipes) {
      p.x -= this.speed * dt;
      // coin
      if (p.coin && !p.coin.taken) {
        p.coin.bob += dt * 4;
        const cx = p.x + p.w / 2;
        const cy = p.coin.y + Math.sin(p.coin.bob) * 6 * this.sc;
        const cr = 13 * this.sc;
        if (Math.hypot(cx - this.bx, cy - this.by) < this.radius + cr) {
          p.coin.taken = true;
          this.runCoins++;
          this.combo++;
          this.updateMultiplier();
          audio.coin();
          this.burst(cx, cy, "#ffd24a", 12, 180, "spark");
          this.addFloat(cx, cy - 10, "+coin", "#ffd24a", 14);
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

        if (isPerfect) {
          this.perfectPasses++;
          this.combo++; // Bonus combo
          this.score += this.multiplier * 2;
          audio.score(); // Could add a special sound
          this.burst(this.bx, this.by, "#60a5fa", 15, 200, "spark");
          this.addFloat(this.bx, this.by - 40 * this.sc, "PERFECT!", "#60a5fa", 22);
          this.cb.onPerfectPass?.(this.perfectPasses);
          this.shake = 5;
        } else {
          this.score += this.multiplier;
          audio.score();
        }

        this.updateMultiplier();
        this.addFloat(this.bx + 20 * this.sc, this.by - 30 * this.sc, `+${isPerfect ? this.multiplier * 2 : this.multiplier}`, "#ffffff", 18);
        this.cb.onScore?.(this.score);
        // world transition
        const nw = worldForScore(this.score);
        if (nw.id !== this.world.id) {
          this.world = nw;
          this.flashAlpha = 0.6;
          this.cb.onWorld?.(nw);
          this.addFloat(this.w / 2, this.h * 0.35, nw.name + "!", nw.accent, 22);
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
          this.score += this.multiplier;
          audio.nearMiss();
          this.burst(this.bx + this.radius, this.by, "#7dffb0", 8, 150, "spark");
          this.addFloat(this.bx, this.by + 24 * this.sc, "NEAR MISS!", "#7dffb0", 15);
          this.cb.onNearMiss?.(this.nearMiss);
        }
      }
    }
    // cull
    this.pipes = this.pipes.filter((p) => p.x + p.w > -20);

    // collisions
    let dead = false;
    if (this.by >= floorY) { dead = true; this.by = floorY; }
    if (!this.practiceMode) {
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

    if (dead) this.die();

    this.updateParticles(dt);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 40);
    if (this.flashAlpha > 0) this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.5);
  }

  private circleRect(cx: number, cy: number, r: number, rx: number, ry: number, rw: number, rh: number) {
    const nx = Math.max(rx, Math.min(cx, rx + rw));
    const ny = Math.max(ry, Math.min(cy, ry + rh));
    return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
  }

  private die() {
    if (this.state !== "playing") return;
    this.state = "dead";
    this.vy = -200 * this.sc;
    audio.hit();
    this.shake = 12;
    this.flashAlpha = 0.7;
    this.burst(this.bx, this.by, "#ff6b6b", 22, 280, "spark");
    this.burst(this.bx, this.by, "#ffd24a", 14, 220, "spark");

    // Save high score using the helper class as requested
    SharedPreferencesHelper.saveHighScore(this.score);

    const result: RunResult = {
      runId: this.runId,
      score: this.score,
      coins: this.runCoins,
      nearMiss: this.nearMiss,
      perfectPasses: this.perfectPasses,
      bestCombo: this.bestCombo,
      durationMs: performance.now() - this.startTime,
      flaps: this.flaps,
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
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const f of this.floats) { f.y += f.vy * dt; f.life -= dt * 1.1; }
    this.floats = this.floats.filter((f) => f.life > 0);
  }

  // ============ RENDER ============
  render(ctx: CanvasRenderingContext2D) {
    const w = this.w, h = this.h;
    ctx.save();
    if (this.shake > 0 && !this.reducedMotion) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    }

    this.drawBackground(ctx);
    this.drawDecor(ctx);

    // pipes
    for (const p of this.pipes) this.drawPipe(ctx, p);

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
      // jar/bong glass highlight
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(p.x + p.w * 0.2, y, p.w * 0.12, height);
      // lip
      ctx.fillStyle = dark;
      ctx.fillRect(p.x - lipOver, lipY, p.w + lipOver * 2, lipH);
      ctx.fillStyle = main;
      ctx.fillRect(p.x - lipOver + 3 * this.sc, lipY + 3 * this.sc, p.w + lipOver * 2 - 6 * this.sc, lipH - 6 * this.sc);
    };
    // top pipe (lip at bottom)
    drawSeg(0, topEdge - lipH, topEdge - lipH);
    // bottom pipe (lip at top)
    drawSeg(botEdge + lipH, this.h - this.groundH - botEdge - lipH, botEdge);

    // coin
    if (p.coin && !p.coin.taken) {
      const cx = p.x + p.w / 2;
      const cy = p.coin.y + Math.sin(p.coin.bob) * 6 * this.sc;
      const cr = 13 * this.sc;
      ctx.save();
      ctx.shadowColor = "#ffd24a";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#ffd24a";
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#c98a16";
      ctx.font = `900 ${15 * this.sc}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🍁", cx, cy + 1);
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

    // eye
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(r * 0.4, -r * 0.2, r * 0.32, 0, 7);
    ctx.fill();
    ctx.fillStyle = this.skin.eye;
    ctx.beginPath();
    ctx.arc(r * 0.5, -r * 0.2, r * 0.16, 0, 7);
    ctx.fill();
    // chill half-lids
    ctx.strokeStyle = this.skin.eye;
    ctx.lineWidth = 2 * this.sc;
    ctx.beginPath();
    ctx.arc(r * 0.4, -r * 0.2, r * 0.32, Math.PI * 1.05, Math.PI * 1.9);
    ctx.stroke();

    // smile
    ctx.strokeStyle = this.skin.eye;
    ctx.lineWidth = 2.2 * this.sc;
    ctx.beginPath();
    ctx.arc(r * 0.25, r * 0.25, r * 0.35, 0.1, Math.PI - 0.4);
    ctx.stroke();

    ctx.restore();
  }
}

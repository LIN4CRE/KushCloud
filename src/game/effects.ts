// Standalone visual effects layer — particles, overlays, screen shaders.
// Keeps engine.ts clean while enabling rich dynamic visuals.

export interface EffectParticle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number; color: string; kind: string; rot: number; vr: number;
  decay: number; // how fast to shrink (1 = normal, 0.5 = slow, 2 = fast)
  gravity: number; // per-particle gravity override
}

export type EffectLayer = "ground" | "mid" | "top";

export interface ScreenOverlay {
  kind: "flash" | "vignette" | "scanline" | "worldEntry";
  alpha: number; decay: number; color: string;
  intensity: number;
}

// Creates a burst of particles with varied velocities and colors.
export function createBurst(
  pool: EffectParticle[], x: number, y: number,
  color: string, count: number, speed: number, kind: string,
  opts?: { gravity?: number; spread?: number; size?: number; decay?: number },
): void {
  const spread = opts?.spread ?? 1;
  const baseSize = opts?.size ?? 3;
  const grav = opts?.gravity ?? (kind === "leaf" ? 60 : kind === "spark" ? 220 : -15);
  const dec = opts?.decay ?? 1;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = (speed * 0.4 + Math.random() * speed * 0.6) * spread;
    pool.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 50,
      life: 1, maxLife: 1,
      size: (baseSize * 0.5 + Math.random() * baseSize * 0.5),
      color, kind, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 6,
      decay: dec, gravity: grav,
    });
  }
}

// Creates a ring of particles expanding outward.
export function createRing(
  pool: EffectParticle[], x: number, y: number,
  color: string, count: number, speed: number, kind: string,
  opts?: { gravity?: number; size?: number },
): void {
  const grav = opts?.gravity ?? 0;
  const baseSize = opts?.size ?? 2;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const spd = speed * (0.7 + Math.random() * 0.3);
    pool.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 0.8, maxLife: 0.8,
      size: baseSize, color, kind,
      rot: 0, vr: 0, decay: 1, gravity: grav,
    });
  }
}

// Creates a small localized puff effect.
export function createPuff(
  pool: EffectParticle[], x: number, y: number,
  color: string, count: number, size: number,
): void {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = 20 + Math.random() * 40;
    pool.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 20,
      life: 0.5, maxLife: 0.5,
      size: size * (0.6 + Math.random() * 0.4),
      color, kind: "puff",
      rot: 0, vr: 0, decay: 1, gravity: -10,
    });
  }
}

// Creates confetti particles (multi-colored rectangles).
export function createConfetti(
  pool: EffectParticle[], x: number, y: number, count: number,
  colors: string[], speed: number,
): void {
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
    const spd = speed * (0.5 + Math.random() * 0.5);
    pool.push({
      x, y,
      vx: Math.cos(angle) * spd * 2,
      vy: Math.sin(angle) * spd,
      life: 1.5, maxLife: 1.5,
      size: 3 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      kind: "confetti",
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10,
      decay: 0.8, gravity: 100,
    });
  }
}

// Creates a trail of fading circles behind an entity.
export function createTrailSegment(
  pool: EffectParticle[], x: number, y: number,
  color: string, size: number, count: number,
): void {
  for (let i = 0; i < count; i++) {
    pool.push({
      x: x + (Math.random() - 0.5) * 4,
      y: y + (Math.random() - 0.5) * 4,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      life: 0.4, maxLife: 0.4,
      size: size * (0.5 + Math.random() * 0.5),
      color, kind: "trail",
      rot: 0, vr: 0, decay: 1.5, gravity: -5,
    });
  }
}

// Creates a power-up collect flash ring.
export function createCollectFlash(
  pool: EffectParticle[], x: number, y: number, color: string,
): void {
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    pool.push({
      x, y,
      vx: Math.cos(angle) * 80,
      vy: Math.sin(angle) * 80,
      life: 0.4, maxLife: 0.4,
      size: 3, color, kind: "spark",
      rot: 0, vr: 0, decay: 2, gravity: 0,
    });
  }
}

// Updates all effect particles — replaces engine's updateParticles.
export function updateParticles(pool: EffectParticle[], dt: number): void {
  for (const p of pool) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === "leaf") { p.vy += 60 * dt; p.rot += p.vr * dt; }
    else if (p.kind === "spark") { p.vy += 220 * dt; }
    else if (p.kind === "confetti") { p.vy += 100 * dt; p.rot += p.vr * dt; }
    else { p.vy -= 15 * dt; }
    p.life -= dt * (p.decay ?? 1);
  }
  // In-place compaction
  let write = 0;
  for (let i = 0; i < pool.length; i++) {
    if (pool[i].life > 0) pool[write++] = pool[i];
  }
  pool.length = write;
}

// Draws all effect particles — replaces engine's drawParticles.
export function drawParticles(ctx: CanvasRenderingContext2D, pool: EffectParticle[]): void {
  for (const p of pool) {
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
    } else if (p.kind === "confetti") {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    } else if (p.kind === "trail") {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = a * 0.3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, 7);
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

// Draws screen overlays (flash, vignette, scanline, world entry).
export function drawOverlays(ctx: CanvasRenderingContext2D, overlays: ScreenOverlay[], w: number, h: number): void {
  for (const o of overlays) {
    if (o.alpha <= 0) continue;
    if (o.kind === "flash") {
      ctx.fillStyle = o.color;
      ctx.globalAlpha = o.alpha;
      ctx.fillRect(-20, -20, w + 40, h + 40);
    } else if (o.kind === "vignette") {
      const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.75);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, `rgba(0,0,0,${o.alpha * o.intensity})`);
      ctx.fillStyle = vg;
      ctx.fillRect(-20, -20, w + 40, h + 40);
    } else if (o.kind === "scanline") {
      ctx.fillStyle = o.color;
      ctx.globalAlpha = o.alpha * 0.03;
      for (let y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1);
      }
    } else if (o.kind === "worldEntry") {
      // Vertical wipe bars
      const barW = Math.ceil(w / 12);
      ctx.globalAlpha = o.alpha;
      for (let i = 0; i < 12; i++) {
        const offset = Math.sin(i * 0.8 + performance.now() / 300) * o.intensity;
        ctx.fillStyle = o.color;
        ctx.fillRect(i * barW + offset, 0, barW - 1, h);
      }
    }
    ctx.globalAlpha = 1;
  }
}

// Updates overlays with decay.
export function updateOverlays(overlays: ScreenOverlay[], dt: number): void {
  for (const o of overlays) {
    o.alpha -= dt * o.decay;
  }
  // Remove dead overlays
  let write = 0;
  for (let i = 0; i < overlays.length; i++) {
    if (overlays[i].alpha > 0) overlays[write++] = overlays[i];
  }
  overlays.length = write;
}

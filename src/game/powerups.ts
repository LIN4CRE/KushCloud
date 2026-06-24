import { POWERUPS } from "./data";

export interface ActivePowerUp {
  id: string;
  startTime: number;
  duration: number;
}

export interface PowerUpModifiers {
  coinMult: number;
  scoreMult: number;
  timeScale: number;
  clockScale: number;
  gravityMult: number;
  flapBoost: number;
  magnetRadius: number;
  gapBonus: number;
  shieldHits: number;
  doubleJumpAvailable: boolean;
  doubleJumpCharges: number;
}

export class PowerUpManager {
  private active: ActivePowerUp[] = [];
  private shieldHitsRemaining = 0;
  private doubleJumpChargesRemaining = 0;

  activate(id: string): boolean {
    const def = POWERUPS.find((p) => p.id === id);
    if (!def) return false;
    if (this.active.find((a) => a.id === id)) return false;

    if (def.effect === "shield") {
      this.shieldHitsRemaining += id === "guardian" ? 2 : 1;
      return true;
    }

    if (def.effect === "doubleJump") {
      this.doubleJumpChargesRemaining += id === "dash" ? 4 : 3;
    }

    this.active.push({
      id,
      startTime: performance.now(),
      duration: def.duration * 1000,
    });
    return true;
  }

  update(): void {
    const now = performance.now();
    this.active = this.active.filter((a) => now - a.startTime < a.duration);
    if (!this.hasActiveDoubleJump()) this.doubleJumpChargesRemaining = 0;
  }

  getModifiers(): PowerUpModifiers {
    const result: PowerUpModifiers = {
      coinMult: 1,
      scoreMult: 1,
      timeScale: 1,
      clockScale: 1,
      gravityMult: 1,
      flapBoost: 1,
      magnetRadius: 0,
      gapBonus: 0,
      shieldHits: this.shieldHitsRemaining,
      doubleJumpAvailable: this.isDoubleJumpAvailable(),
      doubleJumpCharges: this.doubleJumpChargesRemaining,
    };

    for (const a of this.active) {
      const def = POWERUPS.find((p) => p.id === a.id);
      if (!def) continue;

      switch (def.effect) {
        case "coinMultiplier":
          if (a.id === "coinrush") {
            result.coinMult = Math.max(result.coinMult, 3);
            result.scoreMult = Math.max(result.scoreMult, 1.35);
          } else {
            result.coinMult = Math.max(result.coinMult, 2);
            result.scoreMult = Math.max(result.scoreMult, 2);
          }
          break;
        case "magnet":
          result.magnetRadius = Math.max(result.magnetRadius, a.id === "supermag" ? 170 : 132);
          break;
        case "slowMotion":
          // Obstacles slow down more than the bird, and the rush clock slows too.
          // This makes slow-mo feel like control/precision instead of a timer debuff.
          result.timeScale = Math.min(result.timeScale, a.id === "focus" ? 0.60 : 0.68);
          result.clockScale = Math.min(result.clockScale, a.id === "focus" ? 0.50 : 0.60);
          result.gravityMult = Math.min(result.gravityMult, a.id === "focus" ? 0.78 : 0.84);
          result.flapBoost = Math.max(result.flapBoost, a.id === "focus" ? 1.08 : 1.05);
          break;
        case "doubleJump":
          result.flapBoost = Math.max(result.flapBoost, a.id === "dash" ? 1.12 : 1.08);
          result.gravityMult = Math.min(result.gravityMult, a.id === "dash" ? 0.9 : 0.92);
          break;
        case "gapWiden":
          result.gapBonus = Math.max(result.gapBonus, 28);
          break;
      }
    }
    return result;
  }

  private hasActiveDoubleJump(): boolean {
    return this.active.some((a) => {
      const def = POWERUPS.find((p) => p.id === a.id);
      return def?.effect === "doubleJump";
    });
  }

  consumeShield(): boolean {
    if (this.shieldHitsRemaining > 0) {
      this.shieldHitsRemaining--;
      return true;
    }
    return false;
  }

  useDoubleJump(): boolean {
    if (this.isDoubleJumpAvailable()) {
      this.doubleJumpChargesRemaining--;
      return true;
    }
    return false;
  }

  isDoubleJumpAvailable(): boolean {
    return this.hasActiveDoubleJump() && this.doubleJumpChargesRemaining > 0;
  }

  resetDoubleJump(): void {
    // Kept for backwards compatibility with older engine/tests. Charges are no
    // longer reset by normal flaps; active Ghost/Dash Hop grants finite saves.
  }

  reset(): void {
    this.active = [];
    this.shieldHitsRemaining = 0;
    this.doubleJumpChargesRemaining = 0;
  }

  getActive(): ActivePowerUp[] {
    return [...this.active];
  }

  getShieldHits(): number {
    return this.shieldHitsRemaining;
  }

  getDoubleJumpCharges(): number {
    return this.doubleJumpChargesRemaining;
  }

  getRemainingTime(id: string): number {
    const active = this.active.find((a) => a.id === id);
    if (!active) return 0;
    const remaining = active.duration - (performance.now() - active.startTime);
    return Math.max(0, remaining);
  }
}

import { POWERUPS } from "./data";

export interface ActivePowerUp {
  id: string;
  startTime: number;
  duration: number;
}

export interface PowerUpModifiers {
  coinMult: number;
  magnetRadius: number;
  shieldHits: number;
  doubleJumpAvailable: boolean;
}

export class PowerUpManager {
  private active: ActivePowerUp[] = [];
  private shieldHitsRemaining = 0;
  private doubleJumpUsed = false;

  activate(id: string): boolean {
    const def = POWERUPS.find((p) => p.id === id);
    if (!def) return false;
    if (this.active.find((a) => a.id === id)) return false;

    if (def.effect === "shield") {
      this.shieldHitsRemaining += def.id === "pu_mega" ? 3 : 1;
      return true;
    }

    if (def.effect === "doubleJump") {
      this.active.push({
        id,
        startTime: performance.now(),
        duration: def.duration * 1000,
      });
      return true;
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
  }

  getModifiers(): PowerUpModifiers {
    const result: PowerUpModifiers = {
      coinMult: 1,
      magnetRadius: 0,
      shieldHits: this.shieldHitsRemaining,
      doubleJumpAvailable: this.hasActiveDoubleJump(),
    };

    for (const a of this.active) {
      const def = POWERUPS.find((p) => p.id === a.id);
      if (!def) continue;

      switch (def.effect) {
        case "coinMultiplier":
          result.coinMult = Math.max(result.coinMult, def.id === "pu_coin" ? 2 : 3);
          break;
        case "magnet":
          result.magnetRadius = 80;
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
      this.doubleJumpUsed = true;
      return true;
    }
    return false;
  }

  isDoubleJumpAvailable(): boolean {
    return this.hasActiveDoubleJump() && !this.doubleJumpUsed;
  }

  resetDoubleJump(): void {
    this.doubleJumpUsed = false;
  }

  reset(): void {
    this.active = [];
    this.shieldHitsRemaining = 0;
    this.doubleJumpUsed = false;
  }

  getActive(): ActivePowerUp[] {
    return [...this.active];
  }

  getShieldHits(): number {
    return this.shieldHitsRemaining;
  }

  getRemainingTime(id: string): number {
    const active = this.active.find((a) => a.id === id);
    if (!active) return 0;
    const remaining = active.duration - (performance.now() - active.startTime);
    return Math.max(0, remaining);
  }
}

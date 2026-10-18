import type { Command } from "@robolab/backend/domain/game/program";

export type GestureSample = { name: string; score: number; hands: number };
export type GestureAction = Command | "confirm";
export type GestureFeedback = {
  action: GestureAction | null;
  candidate: GestureAction | null;
  progress: number;
  releaseRequired: boolean;
};

export const GESTURES = [
  { name: "Pointing_Up", action: "FORWARD", emoji: "☝️", label: "Avanzar", prompt: "Apunta arriba" },
  { name: "Pointing_Down", action: "BACKWARD", emoji: "👇", label: "Retroceder", prompt: "Apunta abajo" },
  { name: "Pointing_Left", action: "TURN_LEFT", emoji: "👈", label: "Girar a la izquierda", prompt: "Apunta a la izquierda" },
  { name: "Pointing_Right", action: "TURN_RIGHT", emoji: "👉", label: "Girar a la derecha", prompt: "Apunta a la derecha" },
  { name: "Thumb_Up", action: "confirm", emoji: "👍", label: "Confirmar y ejecutar", prompt: "Mantén el pulgar arriba" },
] as const;

/** Filtra la entrada de cámara; las reglas del programa siguen en el dominio. */
export class GestureGate {
  private locked = true;
  private releasedAt: number | null = null;
  private candidate: GestureAction | null = null;
  private since = 0;
  private previous = -Infinity;

  reset() {
    this.locked = true;
    this.releasedAt = null;
    this.candidate = null;
    this.previous = -Infinity;
  }

  update(sample: GestureSample, now: number): GestureFeedback {
    if (now - this.previous > 350 || now < this.previous) {
      this.candidate = null;
      this.releasedAt = null;
    }
    this.previous = now;
    // El pulgar conserva su espera larga; el modelo baja a ~0,69 después de un giro.
    const threshold = sample.name === "Thumb_Up" ? 0.65 : 0.7;
    const action = sample.hands === 1 && sample.score >= threshold
      ? GESTURES.find((gesture) => gesture.name === sample.name)?.action ?? null
      : null;

    if (sample.hands === 0) {
      this.releasedAt ??= now;
      if (now - this.releasedAt >= 400) this.locked = false;
    } else {
      this.releasedAt = null;
    }

    if (this.locked || action === null) {
      this.candidate = null;
      return { action: null, candidate: null, progress: 0, releaseRequired: this.locked };
    }
    if (action !== this.candidate) {
      this.candidate = action;
      this.since = now;
    }
    const progress = Math.min(1, (now - this.since) / (action === "confirm" ? 1200 : 800));
    if (progress < 1) return { action: null, candidate: action, progress, releaseRequired: false };

    this.locked = true;
    this.candidate = null;
    return { action, candidate: action, progress: 1, releaseRequired: true };
  }
}

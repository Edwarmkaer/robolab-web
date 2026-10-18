import type { Command } from "@robolab/backend/domain/game/program";

/**
 * Cómo se ve y se nombra cada pieza (colores del Figma, F2). El nombre se lee
 * en voz alta. El color también va en CSS (`palette.css`) para la secuencia.
 */
export const BLOCK_LOOK: Record<Command, { label: string; icon: string }> = {
  FORWARD: { label: "Avanzar", icon: "/bloques/avanzar.svg" },
  BACKWARD: { label: "Retroceder", icon: "/bloques/retroceder.svg" },
  TURN_LEFT: { label: "Girar a la izquierda", icon: "/bloques/girar-izquierda.svg" },
  TURN_RIGHT: { label: "Girar a la derecha", icon: "/bloques/girar-derecha.svg" },
};

export const REPEAT_LOOK = { label: "Repetir", icon: "/bloques/repetir.svg" };

/** Casillas punteadas que se muestran en una secuencia corta: invitan a seguir armando. */
export const MIN_SLOTS = 6;

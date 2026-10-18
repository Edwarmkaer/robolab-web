import type { GestureSample } from "./gestureGate";

export type HandPoint = { x: number; y: number; z: number };
type HandResult = { landmarks: HandPoint[][]; worldLandmarks: HandPoint[][]; gestures: { categoryName: string; score: number }[][] };

const distance = (a: HandPoint, b: HandPoint) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const validHand = (hand: HandPoint[] | undefined): hand is HandPoint[] =>
  hand?.length === 21 && hand.every((p) => [p.x, p.y, p.z].every(Number.isFinite));

/** Coseno del ángulo en la articulación b, independiente del giro de la mano. */
function joint(a: HandPoint, b: HandPoint, c: HandPoint) {
  const length = distance(a, b) * distance(c, b);
  return length > 1e-9 ? ((a.x - b.x) * (c.x - b.x) + (a.y - b.y) * (c.y - b.y) + (a.z - b.z) * (c.z - b.z)) / length : 1;
}

export function gestureSample(result: HandResult, width: number, height: number): GestureSample {
  const empty = { name: "", score: 0, hands: result.landmarks.length };
  const image = result.landmarks[0];
  const world = result.worldLandmarks[0];
  if (empty.hands !== 1 || !validHand(image) || !validHand(world) || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return empty;

  const wrist = world[0]!;
  const base = world[5]!;
  const tip = world[8]!;
  const indexExtended = joint(base, world[6]!, world[7]!) < -0.65 && joint(world[6]!, world[7]!, tip) < -0.65;
  const othersFolded = [10, 14, 18].every((pip) => distance(wrist, world[pip + 2]!) < distance(wrist, world[pip]!) * 1.1);
  const towardsCamera = Math.abs(tip.z - base.z) > Math.hypot(tip.x - base.x, tip.y - base.y) * 0.8;
  if (indexExtended && othersFolded && !towardsCamera) {
    // El vídeo se muestra con scaleX(-1): invierte solo X, antes de elegir la dirección.
    const dx = (image[5]!.x - image[8]!.x) * width;
    const dy = (image[8]!.y - image[5]!.y) * height;
    const palmWidth = Math.hypot((image[5]!.x - image[17]!.x) * width, (image[5]!.y - image[17]!.y) * height);
    if (Math.hypot(dx, dy) < Math.max(1, palmWidth * 0.6)) return empty;
    const name = Math.abs(dx) > Math.abs(dy) * 1.5 ? (dx > 0 ? "Pointing_Right" : "Pointing_Left")
      : Math.abs(dy) > Math.abs(dx) * 1.5 ? (dy > 0 ? "Pointing_Down" : "Pointing_Up") : "";
    // Para apuntar se valida la geometría; no depende de la etiqueta preentrenada Pointing_Up.
    return { ...empty, name, score: name ? 1 : 0 };
  }

  const gesture = result.gestures[0]?.[0];
  return gesture?.categoryName === "Thumb_Up" ? { ...empty, name: "Thumb_Up", score: gesture.score } : empty;
}

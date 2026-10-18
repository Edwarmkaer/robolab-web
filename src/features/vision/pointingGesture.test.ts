import { describe, expect, it } from "vitest";
import { gestureSample, type HandPoint } from "./pointingGesture";

// Índice extendido, medio/anular/meñique recogidos. Coordenadas de cámara sin espejo.
const indexUp: HandPoint[] = [
  { x: 0.5, y: 0.8, z: 0 },
  { x: 0.58, y: 0.7, z: 0 }, { x: 0.6, y: 0.6, z: 0 }, { x: 0.57, y: 0.55, z: 0 }, { x: 0.55, y: 0.52, z: 0 },
  { x: 0.5, y: 0.55, z: 0 }, { x: 0.5, y: 0.4, z: 0 }, { x: 0.5, y: 0.3, z: 0 }, { x: 0.5, y: 0.2, z: 0 },
  { x: 0.44, y: 0.56, z: 0 }, { x: 0.44, y: 0.48, z: 0 }, { x: 0.44, y: 0.61, z: 0 }, { x: 0.44, y: 0.68, z: 0 },
  { x: 0.38, y: 0.58, z: 0 }, { x: 0.38, y: 0.5, z: 0 }, { x: 0.38, y: 0.63, z: 0 }, { x: 0.38, y: 0.7, z: 0 },
  { x: 0.32, y: 0.6, z: 0 }, { x: 0.32, y: 0.52, z: 0 }, { x: 0.32, y: 0.65, z: 0 }, { x: 0.32, y: 0.72, z: 0 },
];

function rotated(degrees: number, width = 640, height = 480) {
  const a = degrees * Math.PI / 180;
  const world = indexUp.map(({ x, y, z }) => ({ x: Math.cos(a) * (x - 0.5) - Math.sin(a) * (y - 0.5), y: Math.sin(a) * (x - 0.5) + Math.cos(a) * (y - 0.5), z }));
  const points = world.map(({ x, y, z }) => ({ x: 0.5 + x * 480 / width, y: 0.5 + y * 480 / height, z }));
  return { points, world };
}

function detect(degrees: number, width = 640, height = 480) {
  const { points, world } = rotated(degrees, width, height);
  return gestureSample({ landmarks: [points], worldLandmarks: [world], gestures: [[{ categoryName: "None", score: 0.9 }]] }, width, height);
}

describe("un índice, cuatro direcciones en la vista en espejo", () => {
  it.each([[0, "Pointing_Up"], [90, "Pointing_Left"], [180, "Pointing_Down"], [270, "Pointing_Right"]])("un giro de %s° se muestra como %s", (degrees, name) => {
    expect(detect(Number(degrees)).name).toBe(name);
  });

  it("mide la dirección en píxeles para cámaras apaisadas y verticales", () => {
    expect(detect(25, 1920, 480).name).toBe("Pointing_Up");
    expect(detect(25, 480, 1920).name).toBe("Pointing_Up");
  });

  it("ignora las diagonales para no elegir un giro por accidente", () => {
    expect(detect(45).name).toBe("");
    expect(detect(135).name).toBe("");
  });

  it("rechaza dos dedos extendidos aunque MediaPipe dé una etiqueta conocida", () => {
    const { points, world } = rotated(0);
    const twoFingers = world.map((p) => ({ ...p }));
    twoFingers[11] = { x: -0.06, y: -0.2, z: 0 };
    twoFingers[12] = { x: -0.06, y: -0.3, z: 0 };
    expect(gestureSample({ landmarks: [points], worldLandmarks: [twoFingers], gestures: [[{ categoryName: "Victory", score: 0.99 }]] }, 640, 480).name).toBe("");
  });

  it("rechaza un índice doblado y el dedo apuntando hacia la cámara", () => {
    const { points, world } = rotated(0);
    const bent = world.map((p) => ({ ...p }));
    bent[7] = { x: 0, y: 0, z: 0 };
    bent[8] = { x: 0, y: 0.1, z: 0 };
    expect(gestureSample({ landmarks: [points], worldLandmarks: [bent], gestures: [] }, 640, 480).name).toBe("");
    const depth = world.map((p, index) => ({ ...p, z: index >= 5 && index <= 8 ? -(index - 5) * 0.4 : p.z }));
    expect(gestureSample({ landmarks: [points], worldLandmarks: [depth], gestures: [] }, 640, 480).name).toBe("");
  });

  it("conserva el pulgar de confirmación sin aceptar el puño o el gesto anterior de giros", () => {
    const folded = indexUp.map((p) => ({ ...p }));
    folded[8] = { x: 0.5, y: 0.7, z: 0 };
    for (const name of ["Thumb_Up", "Closed_Fist", "ILoveYou"]) {
      const sample = gestureSample({ landmarks: [folded], worldLandmarks: [folded], gestures: [[{ categoryName: name, score: 0.9 }]] }, 640, 480);
      expect(sample.name).toBe(name === "Thumb_Up" ? "Thumb_Up" : "");
      if (name === "Thumb_Up") expect(sample.score).toBe(0.9);
    }
  });

  it("no genera instrucciones con datos incompletos o dos manos", () => {
    expect(gestureSample({ landmarks: [], worldLandmarks: [], gestures: [] }, 640, 480)).toMatchObject({ name: "", hands: 0 });
    expect(gestureSample({ landmarks: [indexUp, indexUp], worldLandmarks: [indexUp, indexUp], gestures: [] }, 640, 480)).toMatchObject({ name: "", hands: 2 });
    expect(gestureSample({ landmarks: [indexUp.slice(0, 9)], worldLandmarks: [indexUp], gestures: [] }, 640, 480).name).toBe("");
    const invalid = indexUp.map((p) => ({ ...p, x: NaN }));
    expect(gestureSample({ landmarks: [invalid], worldLandmarks: [invalid], gestures: [] }, 640, 480).name).toBe("");
  });
});

import { describe, expect, it } from "vitest";
import { GestureGate } from "./gestureGate";

const hand = (name: string, score = 0.95, hands = 1) => ({ name, score, hands });
const absent = { name: "", score: 0, hands: 0 };

function release(gate: GestureGate, start = 0) {
  gate.update(absent, start);
  gate.update(absent, start + 200);
  gate.update(absent, start + 400);
}

function hold(gate: GestureGate, name: string, start = 500, duration = 800) {
  let feedback = gate.update(hand(name), start);
  for (let t = 100; t <= duration; t += 100) feedback = gate.update(hand(name), start + t);
  return feedback;
}

describe("gestos como entrada del editor", () => {
  it.each([
    ["Pointing_Up", "FORWARD"],
    ["Victory", "TURN_RIGHT"],
    ["ILoveYou", "TURN_LEFT"],
  ])("acumula un solo bloque de %s después de sostenerlo", (name, action) => {
    const gate = new GestureGate();
    release(gate);
    expect(hold(gate, name).action).toBe(action);
    expect(hold(gate, name, 1400).action).toBeNull();
  });

  it("exige retirar la mano antes de repetir o cambiar de instrucción", () => {
    const gate = new GestureGate();
    release(gate);
    hold(gate, "Pointing_Up");
    expect(hold(gate, "Victory", 1400).action).toBeNull();
    release(gate, 2300);
    expect(hold(gate, "Pointing_Up", 2800).action).toBe("FORWARD");
  });

  it("no ejecuta al detectar brevemente el pulgar: exige confirmación sostenida", () => {
    const gate = new GestureGate();
    release(gate);
    expect(hold(gate, "Thumb_Up").action).toBeNull();
    expect(hold(gate, "Thumb_Up", 1400, 300).action).toBe("confirm");
  });

  it("rechaza poca confianza, dos manos y gestos ajenos al editor", () => {
    const gate = new GestureGate();
    release(gate);
    for (const sample of [hand("Victory", 0.4), hand("Victory", 0.95, 2), hand("Closed_Fist")]) {
      for (let t = 500; t <= 1800; t += 100) expect(gate.update(sample, t).action).toBeNull();
    }
  });

  it("una pérdida breve de detección no duplica el bloque", () => {
    const gate = new GestureGate();
    release(gate);
    hold(gate, "Pointing_Up");
    gate.update(absent, 1400);
    expect(hold(gate, "Pointing_Up", 1500).action).toBeNull();
  });

  it("acepta un pulgar sostenido con la confianza observada en la imagen oficial", () => {
    const gate = new GestureGate();
    release(gate);
    let action: string | null = null;
    for (let t = 500; t <= 1700; t += 100) action = gate.update(hand("Thumb_Up", 0.7455), t).action;
    expect(action).toBe("confirm");
  });

  it("una pausa de la pestaña no completa un gesto con fotogramas viejos", () => {
    const gate = new GestureGate();
    release(gate);
    gate.update(hand("Thumb_Up"), 500);
    expect(gate.update(hand("Thumb_Up"), 5000).action).toBeNull();
  });

  it("al reanudar exige retirar la mano y empezar un gesto nuevo", () => {
    const gate = new GestureGate();
    release(gate);
    gate.update(hand("Thumb_Up"), 500);
    gate.reset();
    expect(hold(gate, "Thumb_Up", 600, 1200).action).toBeNull();
    release(gate, 1900);
    expect(hold(gate, "Thumb_Up", 2400, 1200).action).toBe("confirm");
  });
});

import { describe, expect, it } from "vitest";
import { COMPACT_LAYOUT, LABEL_GAP, M, PLOT_H, WIDE_LAYOUT, directLabels, scaleFor, visibleLabelIndexes, yFor, yOf } from "./chartLayout";

const xOf = (i: number) => 100 + i * 50;

describe("directLabels", () => {
  it("usa la etiqueta corta cuando existe, para que no se corte", () => {
    const [label] = directLabels([{ id: "avg", label: "Promedio de la clase", shortLabel: "Promedio", values: [25] }], xOf);
    expect(label).toMatchObject({ text: "Promedio", x: 110, y: yOf(25) });
  });

  it("acorta los nombres largos", () => {
    const [label] = directLabels([{ id: "s", label: "Carla Fernanda", values: [80] }], xOf);
    expect(label?.text).toBe("Carla Ferna…");
  });

  it("separa etiquetas que caerían una sobre otra", () => {
    const labels = directLabels(
      [
        { id: "ana", label: "Ana", values: [40, 25] },
        { id: "avg", label: "Promedio de la clase", shortLabel: "Promedio", values: [50, 25] },
      ],
      xOf,
    );
    const [a, b] = labels;
    expect(Math.abs(a!.y - b!.y)).toBeGreaterThanOrEqual(LABEL_GAP);
  });

  it("se ubica en el último punto rendido y omite series vacías", () => {
    const labels = directLabels(
      [
        { id: "ana", label: "Ana", values: [40, null] },
        { id: "beto", label: "Beto", values: [null, null] },
      ],
      xOf,
    );
    expect(labels).toEqual([{ id: "ana", text: "Ana", x: 110, y: yOf(40) }]);
  });
});

describe("escala del eje vertical", () => {
  it("el logro va siempre de 0 a 100 en cuartos", () => {
    expect(scaleFor(40, 100).ticks).toEqual([0, 25, 50, 75, 100]);
  });

  it("para otras medidas elige pasos redondos que cubren el máximo", () => {
    expect(scaleFor(3.2).ticks).toEqual([0, 1, 2, 3, 4]);
    expect(scaleFor(7.5).ticks).toEqual([0, 2, 4, 6, 8]);
    expect(scaleFor(0.4).ticks).toEqual([0, 0.1, 0.2, 0.3, 0.4]);
    expect(scaleFor(0).ticks).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it("ubica el tope arriba del área y el cero abajo", () => {
    const scale = scaleFor(3.2);
    expect(scale.yOf(scale.top)).toBe(M.top);
    expect(scale.yOf(0)).toBe(M.top + PLOT_H);
  });
});

describe("gráfica en el celular", () => {
  it("la compacta es más alta que ancha, cabe en 360 px y deja la letra más grande que la ancha", () => {
    expect(COMPACT_LAYOUT.W).toBeLessThanOrEqual(360);
    expect(COMPACT_LAYOUT.H).toBeGreaterThan(COMPACT_LAYOUT.W * 0.8);
    expect(COMPACT_LAYOUT.axisFont).toBeGreaterThan(WIDE_LAYOUT.axisFont);
    expect(COMPACT_LAYOUT.PLOT_W).toBe(COMPACT_LAYOUT.W - COMPACT_LAYOUT.M.left - COMPACT_LAYOUT.M.right);
    // Con la letra mayor y encogida al ancho del celular (~330 px), el texto queda cerca de 11 px o más.
    expect(COMPACT_LAYOUT.axisFont * (330 / COMPACT_LAYOUT.W)).toBeGreaterThanOrEqual(10.5);
    // La ancha, encogida al mismo ancho, quedaba en ~5,7 px: ilegible.
    expect(WIDE_LAYOUT.axisFont * (330 / WIDE_LAYOUT.W)).toBeLessThan(6);
  });

  it("yFor ubica el tope arriba y el cero abajo en cualquiera de las dos medidas", () => {
    const scale = scaleFor(3.2);
    for (const l of [WIDE_LAYOUT, COMPACT_LAYOUT]) {
      const y = yFor(scale, l);
      expect(y(scale.top)).toBe(l.M.top);
      expect(y(0)).toBe(l.M.top + l.PLOT_H);
    }
  });

  it("las etiquetas directas se acortan según el margen disponible", () => {
    const [label] = directLabels([{ id: "s", label: "Carla Fernanda", values: [80] }], xOf, yOf, COMPACT_LAYOUT.labelChars);
    expect(label?.text).toBe("Carla Fe…");
    expect(label!.text.length).toBeLessThanOrEqual(COMPACT_LAYOUT.labelChars);
  });
});

describe("etiquetas del eje horizontal", () => {
  it("con espacio de sobra se escriben todas", () => {
    expect(visibleLabelIndexes(5, 100)).toEqual([0, 1, 2, 3, 4]);
  });

  it("con muchos retos en poco ancho se salta de a una pero siempre queda la última", () => {
    // 9 retos en 244 px: 30 px entre puntos, una etiqueta "17 oct" mide ~40 px.
    const step = COMPACT_LAYOUT.PLOT_W / 8;
    const shown = visibleLabelIndexes(9, step);
    expect(shown).toEqual([0, 2, 4, 6, 8]);
    expect(shown.at(-1)).toBe(8);
    // Entre dos etiquetas escritas hay lugar para leerlas.
    expect(step * (shown[1]! - shown[0]!)).toBeGreaterThanOrEqual(46);
  });

  it("un solo reto muestra su etiqueta", () => {
    expect(visibleLabelIndexes(1, 100)).toEqual([0]);
  });
});

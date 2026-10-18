// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { pretendViewport, resetViewport } from "../../../shared/testViewport";
import { ProgressChart } from "./ProgressChart";
import { PERCENT_SCALE } from "./chartLayout";

afterEach(() => {
  cleanup();
  resetViewport();
});

const dates = ["1 oct", "2 oct", "3 oct", "4 oct", "5 oct", "6 oct", "7 oct", "8 oct", "9 oct"];

function chart() {
  return render(
    <ProgressChart
      title="Logro por evaluación, 5.° A"
      xLabels={dates}
      xDetails={dates.map((d) => `${d} · Evaluación`)}
      series={[{ id: "average", label: "Promedio de la clase", shortLabel: "Promedio", color: "var(--c-series-average)", dashed: true, values: dates.map((_, i) => 50 + i) }]}
      scale={PERCENT_SCALE}
      format={(v) => `${Math.round(v)}%`}
    />,
  );
}

describe("gráfica de progreso", () => {
  it("en pantalla ancha usa el dibujo ancho y escribe todas las fechas", () => {
    pretendViewport(false);
    chart();
    const svg = screen.getByRole("img", { name: "Logro por evaluación, 5.° A" });
    expect(svg.getAttribute("viewBox")).toBe("0 0 640 280");
    expect(svg.querySelectorAll("text").length).toBeGreaterThan(9);
    for (const date of dates) expect(within(svg).getAllByText(date).length).toBeGreaterThan(0);
  });

  it("en el celular usa su propio dibujo (más alto) y salta fechas para que no se encimen, dejando la última", () => {
    pretendViewport(true);
    chart();
    const svg = screen.getByRole("img", { name: "Logro por evaluación, 5.° A" });
    expect(svg.getAttribute("viewBox")).toBe("0 0 360 300");
    const axis = [...svg.querySelectorAll("text")].map((t) => t.textContent).filter((t) => dates.includes(t ?? ""));
    expect(axis).toEqual(["1 oct", "3 oct", "5 oct", "7 oct", "9 oct"]);
  });

  it("cada fecha es una zona con nombre accesible (role=img), no un rect sin rol con aria-label", () => {
    chart();
    const zones = [...document.querySelectorAll("rect[aria-label]")];
    expect(zones).toHaveLength(dates.length);
    expect(zones.every((z) => z.getAttribute("role") === "img")).toBe(true);
    expect(screen.getByRole("img", { name: "3 oct · Evaluación" })).toBeTruthy();
  });
});


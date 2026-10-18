// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { saveSolved } from "./testProgress";
import { TopicPage } from "./TopicPage";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function at(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<p>Portada</p>} />
        <Route path="/explorar/:topic" element={<TopicPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

const levelCard = (name: string) => screen.getByText(name, { selector: ".level-name" }).closest(".level-card") as HTMLElement;

describe("tópico: tarjetas de nivel con su avance", () => {
  it("cada nivel dice cuántos retos tiene y cuántos resolvió (Inicial con bloques, Primaria con misiones)", () => {
    saveSolved("inicial-ciencia-probeta", "inicial-ciencia-lupa", "primaria-ciencia-huerto");
    at("/explorar/ciencia");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Ciencia");
    expect(screen.getByText("Explora el laboratorio. Elige tu nivel.")).toBeTruthy();

    const inicial = levelCard("Inicial");
    expect(within(inicial).getByText("6 retos")).toBeTruthy();
    expect(within(inicial).getByText("2/6 ✓")).toBeTruthy();
    expect(within(inicial).getByText("Primeros pasos con movimiento, formas y colores.")).toBeTruthy();
    expect(inicial.getAttribute("href")).toBe("/explorar/ciencia/inicial");

    const primaria = levelCard("Primaria");
    expect(within(primaria).getByText("6 misiones")).toBeTruthy();
    expect(within(primaria).getByText("1/6 ✓")).toBeTruthy();
    expect(within(primaria).getByText("Retos con más pasos y razonamiento.")).toBeTruthy();
    expect(primaria.getAttribute("href")).toBe("/explorar/ciencia/primaria");
  });

  it("usa las cantidades de cada tópico", () => {
    at("/explorar/artes");
    expect(within(levelCard("Inicial")).getByText("0/5 ✓")).toBeTruthy();
    expect(within(levelCard("Primaria")).getByText("0/4 ✓")).toBeTruthy();
  });

  it("lo resuelto en otro tópico no suma, y Secundaria sigue como próximamente", () => {
    saveSolved("inicial-paseo", "primaria-artes-mural");
    at("/explorar/artes");
    expect(within(levelCard("Inicial")).getByText("0/5 ✓")).toBeTruthy();
    expect(within(levelCard("Primaria")).getByText("1/4 ✓")).toBeTruthy();
    const secundaria = levelCard("Secundaria");
    expect(within(secundaria).getByText("Próximamente")).toBeTruthy();
    expect(secundaria.getAttribute("aria-disabled")).toBe("true");
    expect(secundaria.getAttribute("href")).toBeNull();
  });

  it("un tópico que no existe vuelve a la portada", () => {
    at("/explorar/historia");
    expect(screen.getByText("Portada")).toBeTruthy();
  });
});

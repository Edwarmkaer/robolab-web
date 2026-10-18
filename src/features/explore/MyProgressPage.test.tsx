// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { MyProgressPage } from "./MyProgressPage";
import { saveSolved } from "./testProgress";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <MyProgressPage />
    </MemoryRouter>,
  );

const row = (name: string) => screen.getByText(name, { exact: false, selector: ".progress-label" }).closest(".progress-row") as HTMLElement;

describe("mi avance: cantidades por tópico", () => {
  it("muestra n de m por tópico con las cantidades del Figma (12, 12, 10, 9 y 11)", () => {
    saveSolved("inicial-ciencia-probeta", "inicial-ciencia-lupa", "inicial-paseo", "primaria-matematicas-biblioteca");
    renderPage();
    const expected: Record<string, string> = {
      Ciencia: "2 de 12",
      Tecnología: "1 de 12",
      Ingeniería: "0 de 10",
      Artes: "0 de 9",
      Matemáticas: "1 de 11",
    };
    for (const [name, text] of Object.entries(expected)) {
      expect(row(name).textContent, name).toContain(text);
    }
  });

  it("las misiones resueltas cuentan para las competencias del Currículo Nacional", () => {
    saveSolved("primaria-tecnologia-materiales");
    renderPage();
    const competency = screen.getByText("Competencia 23").closest(".progress-row") as HTMLElement;
    expect(competency.textContent).toMatch(/^Competencia 23/);
    expect(competency.textContent).toMatch(/1 de \d+$/);
  });
});

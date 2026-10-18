// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { ChallengeListPage } from "./ChallengeListPage";

afterEach(cleanup);

function at(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/explorar/:topic/:level" element={<ChallengeListPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("lista de retos: contadores", () => {
  it("dice cuántos retos tiene el nivel y ofrece los niveles que tienen contenido", () => {
    at("/explorar/ingenieria/inicial");
    expect(screen.getByText("5 retos")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Inicial" }).getAttribute("href")).toBe("/explorar/ingenieria/inicial");
    expect(screen.getByRole("link", { name: "Primaria" }).getAttribute("href")).toBe("/explorar/ingenieria/primaria");
    expect(screen.queryByRole("link", { name: "Secundaria" })).toBeNull();
  });

  it("el contador de Primaria cuenta las misiones", () => {
    at("/explorar/artes/primaria");
    expect(screen.getByText("4 misiones")).toBeTruthy();
  });

  it("lista los retos de bloques de Inicial de Matemáticas", () => {
    at("/explorar/matematicas/inicial");
    expect(screen.getByText("6 retos")).toBeTruthy();
    for (const title of ["Cuenta 5", "Dos y dos", "Las esquinas", "¿En qué casilla?", "Un paso de más", "Pasos justos"]) {
      expect(screen.getByText(title)).toBeTruthy();
    }
  });
});

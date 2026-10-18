// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const results = vi.fn();
vi.mock("convex/react", () => ({ useQuery: () => results() }));

import { ResultsPage } from "./ResultsPage";

afterEach(cleanup);

// Las cifras de la maqueta T9: 80 % lo lograron, 2,0 intentos, 0,8 pistas, 4:12.
const FIXTURE = {
  title: "La mesa del laboratorio",
  classroomLabel: "Primaria · 5.º · Sección A",
  topic: "ciencia",
  level: "primaria",
  solvedPercent: 80,
  studentsSolved: 4,
  studentCount: 5,
  avgTries: 2,
  avgHints: 0.8,
  avgMs: 251_750,
  rows: [
    { studentId: "s1", displayName: "Pingüino veloz", tries: 2, hints: 0, ms: 190_000, status: "solved" },
    { studentId: "s2", displayName: "Zorro curioso", tries: 3, hints: 2, ms: 400_000, status: "in_progress" },
    { studentId: "s3", displayName: "Puma rápido", tries: 0, hints: 0, ms: 0, status: "not_started" },
  ],
  observed: { hintsUsed: 2, hintsTotal: 4, correctedAlone: 1, correctedTotal: 3 },
};

function renderResults() {
  render(
    <MemoryRouter initialEntries={["/docente/clases/c1/retos/a1"]}>
      <Routes>
        <Route path="/docente/clases/:classroomId/retos/:assignmentId" element={<ResultsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

const row = (name: string) => within(screen.getByRole("row", { name: new RegExp(name) }));

describe("resultados de un reto (T9)", () => {
  it("pinta las cuatro cifras con coma decimal y el tiempo como cronómetro", () => {
    results.mockReturnValue(FIXTURE);
    renderResults();
    expect(document.title).toBe("Resultados: La mesa del laboratorio · RoboLab");
    expect(screen.getByRole("heading", { name: "La mesa del laboratorio · Clase Primaria · 5.º · Sección A" })).toBeTruthy();
    const summary = within(screen.getByLabelText("Resumen"));
    expect(summary.getByText("80%").nextSibling?.textContent).toBe("lo lograron");
    expect(summary.getByText("2,0").nextSibling?.textContent).toBe("intentos promedio");
    expect(summary.getByText("0,8").nextSibling?.textContent).toBe("pistas promedio");
    expect(summary.getByText("4:12").nextSibling?.textContent).toBe("tiempo promedio");
  });

  it("muestra cada apodo con su estado y deja en blanco a quien no empezó", () => {
    results.mockReturnValue(FIXTURE);
    renderResults();
    expect(row("Pingüino veloz").getByText("Logrado")).toBeTruthy();
    expect(row("Pingüino veloz").getByText("3:10")).toBeTruthy();
    expect(row("Zorro curioso").getByText("En curso")).toBeTruthy();
    expect(row("Puma rápido").getByText("Sin empezar")).toBeTruthy();
    expect(row("Puma rápido").getAllByText("—")).toHaveLength(3);
  });

  it("cuenta lo observado sin diagnosticar", () => {
    results.mockReturnValue(FIXTURE);
    renderResults();
    const observed = within(screen.getByRole("complementary", { name: /qué se observó/i }));
    expect(observed.getByText("2 de 4 usaron al menos una pista.")).toBeTruthy();
    expect(observed.getByText(/1 de 3 corrigieron solos, sin pistas, tras fallar el primer intento\./)).toBeTruthy();
    expect(observed.getByText("Solo mostramos lo observable. No diagnosticamos.")).toBeTruthy();
  });

  it("sin partidas, los promedios no inventan cifras ni piden pistas de nadie", () => {
    results.mockReturnValue({
      ...FIXTURE,
      solvedPercent: 0,
      avgTries: null,
      avgHints: null,
      avgMs: null,
      rows: [FIXTURE.rows[2]],
      observed: { hintsUsed: 0, hintsTotal: 0, correctedAlone: 0, correctedTotal: 0 },
    });
    renderResults();
    const summary = within(screen.getByLabelText("Resumen"));
    expect(summary.getByText("0%")).toBeTruthy();
    expect(summary.getAllByText("—")).toHaveLength(3);
    const observed = within(screen.getByRole("complementary", { name: /qué se observó/i }));
    expect(observed.getByText("Todavía nadie jugó este reto.")).toBeTruthy();
    expect(observed.getByText("Nadie falló el primer intento.")).toBeTruthy();
  });
});

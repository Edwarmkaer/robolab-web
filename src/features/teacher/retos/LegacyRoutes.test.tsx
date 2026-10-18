// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { LegacyResultsRedirect } from "./LegacyRoutes";

afterEach(cleanup);

const Detail = () => <p>Detalle {useParams().assignmentId}</p>;

function at(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/docente/retos" element={<p>Lista de retos</p>} />
        <Route path="/docente/retos/:assignmentId" element={<Detail />} />
        <Route path="/docente/clases/:classroomId/retos/:assignmentId" element={<LegacyResultsRedirect />} />
        <Route path="/docente/evaluaciones/*" element={<Navigate to="/docente/retos" replace />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("enlaces antiguos del docente", () => {
  it("los resultados de un reto dentro de la clase abren el detalle en Retos", () => {
    at("/docente/clases/c1/retos/a7");
    expect(screen.getByText("Detalle a7")).toBeTruthy();
  });

  it("las evaluaciones llevan a la lista de Retos", () => {
    at("/docente/evaluaciones/e3");
    expect(screen.getByText("Lista de retos")).toBeTruthy();
  });
});

// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pretendViewport, resetViewport } from "../../../shared/testViewport";

const list = vi.fn();
vi.mock("convex/react", () => ({ useQuery: () => list(), useMutation: () => vi.fn() }));

import { EvaluationsPage } from "./EvaluationsPage";

const evaluations = [
  { _id: "e1", title: "Los animales de la granja", classroomLabel: "Inicial · 5 años · Sección A", scheduledDate: "2026-10-17", questionCount: 3, finishedCount: 2, studentCount: 24 },
  { _id: "e2", title: "Figuras y colores", classroomLabel: "Primaria · 3.° · Sección B", scheduledDate: "2026-10-20", questionCount: 1, finishedCount: 0, studentCount: 14 },
];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.UTC(2026, 9, 17, 20, 0));
  list.mockReturnValue(evaluations);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  resetViewport();
});

const page = () => (
  <MemoryRouter>
    <EvaluationsPage />
  </MemoryRouter>
);

describe("evaluaciones del docente", () => {
  it("en pantalla ancha es una tabla", () => {
    pretendViewport(false);
    render(page());
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1, name: "Evaluaciones" })).toBeTruthy();
    expect(screen.queryByRole("list", { name: "Evaluaciones" })).toBeNull();
  });

  it("en el celular son tarjetas (una por evaluación) con clase completa, preguntas y quiénes terminaron; sin tabla recortada", () => {
    pretendViewport(true);
    render(page());
    expect(screen.queryByRole("table")).toBeNull();
    const cards = within(screen.getByRole("list", { name: "Evaluaciones" })).getAllByRole("listitem");
    expect(cards).toHaveLength(2);

    const first = within(cards[0]!).getByRole("link");
    expect(first.getAttribute("href")).toBe("/docente/evaluaciones/e1");
    expect(first.textContent).toContain("Los animales de la granja");
    expect(first.textContent).toContain("Hoy");
    // La clase entera en una sola línea, no partida palabra por palabra en una columna angosta.
    expect(within(first).getByText("Inicial · 5 años · Sección A")).toBeTruthy();
    expect(first.textContent).toContain("3 preguntas");
    expect(first.textContent).toContain("2 de 24 terminaron");

    const second = within(cards[1]!).getByRole("link");
    expect(second.textContent).not.toContain("Hoy");
    expect(second.textContent).toContain("1 pregunta");
    expect(second.textContent).not.toContain("1 preguntas");
  });
});

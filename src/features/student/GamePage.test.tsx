// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../../shared/ui/Toast";

/** `student.attempt`: lo decide cada prueba. `robot.status` se salta (sin robot vinculado). */
const attempt = vi.fn();
vi.mock("convex/react", () => ({
  useQuery: (_fn: unknown, args: unknown) => (args === "skip" ? undefined : attempt(args)),
  useMutation: () => vi.fn(),
}));

import { GamePage } from "./GamePage";

const base = { title: "Evaluación de hoy", level: "inicial", questionCount: 3, finished: false, pendingQuestion: null };

function page() {
  return (
    <ToastProvider>
      <MemoryRouter initialEntries={["/alumno/juego/a1"]}>
        <Routes>
          <Route path="/alumno/juego/:attemptId" element={<GamePage token="t-1" />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  );
}

beforeEach(() => attempt.mockReset());
afterEach(cleanup);

describe("evaluación del alumno: etapa", () => {
  it("cada etapa nueva lleva el foco a su título y la anuncia como 'Estrella N de M'", () => {
    attempt.mockReturnValue({ ...base, stage: 0 });
    const { rerender } = render(page());
    let title = screen.getByRole("heading", { level: 1 });
    expect(title.textContent).toBe("Estrella 1 de 3");
    expect(document.activeElement).toBe(title);

    attempt.mockReturnValue({ ...base, stage: 1 });
    rerender(page());
    title = screen.getByRole("heading", { level: 1 });
    expect(title.textContent).toBe("Estrella 2 de 3");
    expect(document.activeElement).toBe(title);
  });

  it("Robot y Ejecutar quedan juntos en la barra de acciones y los puntos de progreso son una imagen con nombre", () => {
    attempt.mockReturnValue({ ...base, stage: 0 });
    render(page());
    const bar = document.querySelector<HTMLElement>(".action-bar");
    expect(bar).not.toBeNull();
    expect(within(bar!).getByRole("button", { name: /^Robot/ })).toBeTruthy();
    expect(within(bar!).getByRole("button", { name: /Ejecutar/ })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Estrella 1 de 3" })).toBeTruthy();
  });
});

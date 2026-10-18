// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.fn();
const start = vi.fn();
vi.mock("convex/react", () => ({
  useQuery: () => query(),
  // La primera mutación que pide StudentHome es `start`; las demás no se usan en estas pruebas.
  useMutation: () => start,
}));

import { ResultView } from "./ResultView";
import { StudentHome } from "./StudentHome";
import { StudentLogin } from "./StudentLogin";

beforeEach(() => {
  query.mockReset();
  start.mockReset();
  document.title = "";
});
afterEach(cleanup);

describe("resultado del alumno", () => {
  it("las respuestas son una lista con nombre: el lector cuenta las 3 preguntas y dice cuál acertó", () => {
    query.mockReturnValue({
      evaluationId: "ev1",
      number: 1,
      percent: 67,
      score: 2,
      maxScore: 3,
      totalMs: 65_000,
      runs: 4,
      answers: [
        { stage: 0, isCorrect: true, responseMs: 5_000 },
        { stage: 1, isCorrect: false, responseMs: 9_000 },
        { stage: 2, isCorrect: true, responseMs: 7_000 },
      ],
    });
    render(
      <MemoryRouter>
        <ResultView token="t-1" attemptId={"a1" as never} />
      </MemoryRouter>,
    );
    const list = screen.getByRole("list", { name: "Tus respuestas" });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[1]!.textContent).toContain("incorrecta");
    expect(items[0]!.textContent).toContain("correcta");
  });
});

describe("portada del alumno", () => {
  const home = {
    displayName: "Ana",
    level: "inicial",
    classroomLabel: "Inicial · 5 años · Sección A",
    today: "2026-10-17",
    evaluation: { evaluationId: "ev1", title: "Los animales", questionCount: 3, finished: false, attemptId: null },
    pendingCount: 1,
  };

  it("pone su nombre en la pestaña", () => {
    query.mockReturnValue(home);
    render(
      <MemoryRouter>
        <StudentHome token="t-1" onSignOut={() => undefined} />
      </MemoryRouter>,
    );
    expect(document.title).toBe("Inicio · RoboLab");
  });

  it("'¡Empezar!' queda ocupado y deshabilitado mientras el servidor responde (no se toca dos veces)", async () => {
    query.mockReturnValue(home);
    let finish: (id: string) => void = () => undefined;
    start.mockReturnValue(new Promise<string>((resolve) => (finish = resolve)));
    render(
      <MemoryRouter>
        <StudentHome token="t-1" onSignOut={() => undefined} />
      </MemoryRouter>,
    );
    const button = screen.getByRole("button", { name: "¡Empezar!" });
    expect(button.getAttribute("aria-busy")).toBe("false");
    fireEvent.click(button);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(button);
    expect(start).toHaveBeenCalledTimes(1);
    await act(async () => finish("a1"));
  });

  it("si empezar falla, muestra el error con role=alert y vuelve a habilitar el botón", async () => {
    query.mockReturnValue(home);
    start.mockRejectedValue(new Error("sin red"));
    render(
      <MemoryRouter>
        <StudentHome token="t-1" onSignOut={() => undefined} />
      </MemoryRouter>,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "¡Empezar!" }));
    });
    expect(screen.getByRole("alert")).toBeTruthy();
    expect((screen.getByRole("button", { name: "¡Empezar!" }) as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("ingreso del alumno", () => {
  it("pone su nombre en la pestaña", () => {
    render(
      <MemoryRouter>
        <StudentLogin onSignedIn={() => undefined} />
      </MemoryRouter>,
    );
    expect(document.title).toBe("Ingresar · RoboLab");
  });
});

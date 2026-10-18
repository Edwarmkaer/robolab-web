// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const data: Record<string, unknown> = {};
vi.mock("convex/react", () => ({
  useQuery: (ref: unknown, args: unknown) => (args === "skip" ? undefined : data[getFunctionName(ref as never)]),
}));

import { ProgressPage } from "./ProgressPage";

const CLASSES = [
  { _id: "c1", label: "Inicial · 5 años · Sección A" },
  { _id: "c2", label: "Primaria · 3.º · Sección B" },
];

const cell = (challengeId: string, status: string, tries: number | null = null, hints: number | null = null, ms: number | null = null) => ({ challengeId, status, tries, hints, ms });

const PROGRESS = {
  classroomLabel: "Inicial · 5 años · Sección A",
  retos: [
    { assignmentId: "a1", challengeId: "r1", title: "Secuencias", createdAt: 1, solvedPercent: 67, avgTries: 3.5, avgHints: 0.5, avgMs: 150_000, playedCount: 2, closed: false },
    { assignmentId: "a2", challengeId: "r2", title: "Bucles", createdAt: 2, solvedPercent: 33, avgTries: 2, avgHints: 0, avgMs: 90_000, playedCount: 1, closed: true },
    { assignmentId: "a3", challengeId: "r3", title: "Condiciones", createdAt: 3, solvedPercent: 0, avgTries: null, avgHints: null, avgMs: null, playedCount: 0, closed: false },
  ],
  students: [
    { studentId: "s1", displayName: "Ana", cells: [cell("r1", "solved", 2, 1, 90_000), cell("r2", "solved", 2, 0, 90_000), cell("r3", "not_started")] },
    { studentId: "s2", displayName: "Teo", cells: [cell("r1", "in_progress", 5, 2, 210_000), cell("r2", "not_started"), cell("r3", "not_started")] },
  ],
  attention: [
    { studentId: "s2", displayName: "Teo", kind: "unsolved_streak", count: 2 },
    { studentId: "s2", displayName: "Teo", kind: "not_started", count: 3 },
  ],
};

beforeEach(() => {
  data["classrooms:listMine"] = CLASSES;
  data["analytics:classRetosProgress"] = PROGRESS;
});
afterEach(cleanup);

const page = () => (
  <MemoryRouter>
    <ProgressPage />
  </MemoryRouter>
);

describe("Progreso del docente, reto por reto", () => {
  it("título, selector de clase y una gráfica con un punto por reto (en el orden en que se asignaron)", () => {
    render(page());
    expect(document.title).toBe("Progreso · RoboLab");
    expect(screen.getByRole("heading", { level: 1, name: "Progreso" })).toBeTruthy();
    expect(within(screen.getByLabelText("Clase")).getAllByRole("option").map((o) => o.textContent)).toEqual(CLASSES.map((c) => c.label));
    expect(screen.getByRole("img", { name: "Intentos por reto, Inicial · 5 años · Sección A" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Reto 1 · Secuencias" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Reto 2 · Bucles" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Reto 3 · Condiciones" })).toBeTruthy();
  });

  it("la medida por defecto son los intentos, y se puede cambiar a pistas, tiempo o cuántos lo lograron", () => {
    render(page());
    const measure = screen.getByLabelText("Medida") as HTMLSelectElement;
    expect(measure.value).toBe("tries");
    expect(within(measure).getAllByRole("option").map((o) => o.textContent)).toEqual(["Intentos", "Pistas", "Tiempo", "Lo lograron (clase)"]);
    fireEvent.change(measure, { target: { value: "hints" } });
    expect(screen.getByRole("img", { name: /^Pistas por reto/ })).toBeTruthy();
    fireEvent.change(measure, { target: { value: "time" } });
    expect(screen.getByRole("img", { name: /^Tiempo por reto/ })).toBeTruthy();
    expect(screen.getByText(/Minutos/)).toBeTruthy();
  });

  it("compara un alumno con el promedio de la clase; con «Lo lograron» no hay alumno que comparar", () => {
    render(page());
    expect(within(screen.getByRole("list", { name: "Leyenda" })).getAllByRole("listitem")).toHaveLength(1);
    fireEvent.change(screen.getByLabelText("Comparar con"), { target: { value: "s1" } });
    const legend = within(screen.getByRole("list", { name: "Leyenda" }));
    expect(legend.getByText("Ana")).toBeTruthy();
    expect(legend.getByText("Promedio de la clase")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Medida"), { target: { value: "solved" } });
    expect((screen.getByLabelText("Comparar con") as HTMLSelectElement).disabled).toBe(true);
    expect(within(screen.getByRole("list", { name: "Leyenda" })).queryByText("Ana")).toBeNull();
    expect(screen.getByText(/Porcentaje de la clase que logró cada reto/)).toBeTruthy();
  });

  it("la tabla dice por alumno si lo logró (con sus intentos), si no lo logró o si aún no empezó", () => {
    render(page());
    const table = within(screen.getByRole("table"));
    expect(table.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Alumno", "Reto 1", "Reto 2", "Reto 3"]);
    const ana = within(table.getByRole("row", { name: /Ana/ }));
    expect(ana.getAllByText("Logró · 2")).toHaveLength(2);
    expect(ana.getAllByText("—")).toHaveLength(1);
    const teo = within(table.getByRole("row", { name: /Teo/ }));
    expect(teo.getByText("Sin lograr")).toBeTruthy();
    // Lo que no jugó queda con una raya, no con un 0 que parezca un dato.
    expect(teo.getAllByText("—")).toHaveLength(2);
    const lograron = within(table.getByRole("row", { name: /Lo lograron/ }));
    expect(lograron.getByText("67 %")).toBeTruthy();
    expect(lograron.getByText("0 %")).toBeTruthy();
  });

  it("un reto cerrado se marca en la tabla: es parte de lo que la clase ya aprendió", () => {
    render(page());
    expect(screen.getByRole("columnheader", { name: "Reto 2" }).getAttribute("title")).toBe("Bucles · cerrado");
    expect(screen.getByRole("columnheader", { name: "Reto 1" }).getAttribute("title")).toBe("Secuencias");
  });

  it("tocar un nombre de la tabla lo compara en la gráfica", () => {
    render(page());
    fireEvent.click(screen.getByRole("button", { name: "Teo" }));
    expect((screen.getByLabelText("Comparar con") as HTMLSelectElement).value).toBe("s2");
    expect(within(screen.getByRole("list", { name: "Leyenda" })).getByText("Teo")).toBeTruthy();
  });

  it("«Para mirar de cerca» dice solo lo observable, sin diagnosticar", () => {
    render(page());
    const aside = within(screen.getByRole("complementary", { name: "Para mirar de cerca" }));
    expect(aside.getByText("Teo: 2 retos jugados seguidos sin lograr.")).toBeTruthy();
    expect(aside.getByText("Teo: aún no empieza 3 retos.")).toBeTruthy();
    expect(aside.getByText("Solo mostramos lo observable. No diagnosticamos.")).toBeTruthy();
  });

  it("con un solo reto sin lograr o sin empezar, el aviso va en singular", () => {
    data["analytics:classRetosProgress"] = {
      ...PROGRESS,
      attention: [{ studentId: "s2", displayName: "Teo", kind: "not_started", count: 1 }],
    };
    render(page());
    expect(screen.getByText("Teo: aún no empieza 1 reto.")).toBeTruthy();
  });

  it("sin avisos lo dice en vez de dejar el cuadro vacío", () => {
    data["analytics:classRetosProgress"] = { ...PROGRESS, attention: [] };
    render(page());
    expect(screen.getByText("Por ahora nadie necesita una mirada especial.")).toBeTruthy();
  });

  it("cambiar de clase pide el progreso de esa clase", () => {
    render(page());
    fireEvent.change(screen.getByLabelText("Clase"), { target: { value: "c2" } });
    expect((screen.getByLabelText("Clase") as HTMLSelectElement).value).toBe("c2");
  });

  it("una clase sin retos invita a crear uno", () => {
    data["analytics:classRetosProgress"] = { ...PROGRESS, retos: [], attention: [], students: PROGRESS.students.map((s) => ({ ...s, cells: [] })) };
    render(page());
    expect(screen.getByText(/cuando esta clase juegue su primer reto/i)).toBeTruthy();
    expect((screen.getByRole("link", { name: /crear reto/i }) as HTMLAnchorElement).getAttribute("href")).toBe("/docente/retos/nuevo");
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("sin clases pide crear una primero", () => {
    data["classrooms:listMine"] = [];
    render(page());
    expect(screen.getByText(/primero crea una clase/i)).toBeTruthy();
    expect((screen.getByRole("link", { name: /crear clase/i }) as HTMLAnchorElement).getAttribute("href")).toBe("/docente/clases");
  });

  it("mientras carga no muestra pantallas vacías", () => {
    data["analytics:classRetosProgress"] = undefined;
    render(page());
    expect(screen.getByText("Cargando…")).toBeTruthy();
    expect(screen.queryByText(/cuando esta clase juegue/i)).toBeNull();
  });
});

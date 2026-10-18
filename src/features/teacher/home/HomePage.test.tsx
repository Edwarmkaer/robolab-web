// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ensureJoinCodes = vi.fn();
const HOME = {
  firstName: "Ana",
  activeClasses: 2,
  students: 38,
  availableChallenges: 10,
  classes: [
    { _id: "c1", label: "5.º A", joinCode: "TEC-482", studentCount: 24, level: "primaria" },
    { _id: "c2", label: "3.º B", joinCode: "MAT-915", studentCount: 14, level: "inicial" },
  ],
  activeRetos: [
    { assignmentId: "a1", challengeId: "inicial-gira", title: "Gira a la estrella", classroomId: "c2", classroomLabel: "3.º B", studentCount: 20, studentsSolved: 12, solvedPercent: 60 },
    { assignmentId: "a2", challengeId: "inicial-paseo", title: "Primer paseo", classroomId: "c1", classroomLabel: "5.º A", studentCount: 24, studentsSolved: 24, solvedPercent: 100 },
  ],
};
const AVAILABLE = [
  { challengeId: "inicial-paseo", title: "Primer paseo", topic: "tecnologia", level: "inicial", kind: "sequence" },
  { challengeId: "primaria-ciencia-reparto", title: "El reparto", topic: "ciencia", level: "primaria", kind: "mission" },
];
let home: unknown = HOME;
vi.mock("convex/react", () => ({
  useQuery: (ref: unknown) => (getFunctionName(ref as never) === "teacherHome:home" ? home : AVAILABLE),
  useMutation: () => ensureJoinCodes,
}));

import { HomePage } from "./HomePage";

beforeEach(() => {
  home = HOME;
  ensureJoinCodes.mockResolvedValue({ assigned: 1 });
});
afterEach(() => {
  cleanup();
  ensureJoinCodes.mockReset();
});

const renderHome = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );

describe("inicio del docente (T2)", () => {
  it("saluda, muestra las tres cifras y los retos disponibles", () => {
    renderHome();
    expect(document.title).toBe("Inicio · RoboLab");
    expect(screen.getByRole("heading", { name: "Hola, Ana" })).toBeTruthy();
    const stats = within(screen.getByLabelText("Resumen"));
    expect(stats.getByText("2").nextSibling?.textContent).toBe("clases activas");
    expect(stats.getByText("38").nextSibling?.textContent).toBe("estudiantes");
    expect(stats.getByText("10").nextSibling?.textContent).toBe("retos disponibles");
    const available = within(screen.getByRole("heading", { name: "Retos disponibles" }).closest("section")!);
    expect(available.getByText("Tecnología · Inicial")).toBeTruthy();
    expect((available.getByRole("link", { name: "El reparto" }) as HTMLAnchorElement).getAttribute("href")).toBe("/reto/primaria-ciencia-reparto");
  });

  it("Mis clases lista cada clase con su código y ofrece «Nueva clase»", () => {
    renderHome();
    const classes = within(screen.getByRole("heading", { name: "Mis clases" }).closest("section")!);
    expect((classes.getByRole("link", { name: "5.º A" }) as HTMLAnchorElement).getAttribute("href")).toBe("/docente/clases/c1");
    expect(classes.getByText("24 estudiantes · Primaria")).toBeTruthy();
    expect(classes.getByText("Código TEC-482")).toBeTruthy();
    expect(classes.getByText("Código MAT-915")).toBeTruthy();
    expect((classes.getByRole("link", { name: /nueva clase/i }) as HTMLAnchorElement).getAttribute("href")).toBe("/docente/clases/nueva");
    expect(ensureJoinCodes).not.toHaveBeenCalled();
  });

  it("una clase anterior a los códigos pide el suyo y mientras tanto avisa", () => {
    home = { ...HOME, classes: [{ ...HOME.classes[0], joinCode: null }] };
    renderHome();
    expect(screen.getByText("Generando código…")).toBeTruthy();
    expect(ensureJoinCodes).toHaveBeenCalledTimes(1);
  });

  it("sin clases invita a crear la primera", () => {
    home = { ...HOME, activeClasses: 0, students: 0, classes: [] };
    renderHome();
    expect(screen.getByText(/todavía no tienes clases/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /crear clase/i })).toBeTruthy();
  });
});

describe("inicio del docente: retos activos", () => {
  const section = () => within(screen.getByRole("heading", { name: "Retos activos" }).closest("section")!);

  it("reemplaza «Evaluaciones de hoy»: cada reto abierto con su clase y cuántos lo lograron", () => {
    renderHome();
    expect(screen.queryByText(/evaluaciones de hoy/i)).toBeNull();
    const activos = section();
    expect((activos.getByRole("link", { name: /Gira a la estrella/ }) as HTMLAnchorElement).getAttribute("href")).toBe("/docente/retos/a1");
    expect(activos.getByText("3.º B")).toBeTruthy();
    const solved = (text: string) => activos.getByText((_, el) => el?.tagName === "SPAN" && el.textContent === text);
    expect(solved("12 de 20 lo lograron")).toBeTruthy();
    expect(activos.getByRole("img", { name: "60 % de la clase lo logró" })).toBeTruthy();
    expect(solved("24 de 24 lo lograron")).toBeTruthy();
  });

  it("ofrece crear un reto nuevo y ver todos", () => {
    renderHome();
    expect((section().getByRole("link", { name: /nuevo reto/i }) as HTMLAnchorElement).getAttribute("href")).toBe("/docente/retos/nuevo");
    expect((section().getByRole("link", { name: /ver todos/i }) as HTMLAnchorElement).getAttribute("href")).toBe("/docente/retos");
  });

  it("sin retos abiertos lo dice y no inventa tarjetas", () => {
    home = { ...HOME, activeRetos: [] };
    renderHome();
    expect(section().getByText("Todavía no tienes retos activos.")).toBeTruthy();
    expect(section().queryByRole("img")).toBeNull();
  });

  it("mientras el servidor no trae los retos activos muestra «Cargando…»", () => {
    home = { ...HOME, activeRetos: undefined };
    renderHome();
    expect(section().getByText("Cargando…")).toBeTruthy();
  });
});

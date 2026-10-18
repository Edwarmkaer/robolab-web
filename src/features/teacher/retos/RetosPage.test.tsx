// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pretendViewport, resetViewport } from "../../../shared/testViewport";

const list = vi.fn();
vi.mock("convex/react", () => ({ useQuery: () => list() }));

import { RetosPage } from "./RetosPage";

const RETOS = [
  { assignmentId: "a3", challengeId: "inicial-ciencia-probeta", title: "La probeta", topic: "ciencia", topicName: "Ciencia", level: "inicial", kind: "sequence", emoji: "🧪", visibility: "draft", classroomId: null, classroomLabel: null, closed: false, studentCount: 0, studentsSolved: 0, solvedPercent: 0, createdAt: 3 },
  { assignmentId: "a2", challengeId: "inicial-gira", title: "Gira a la estrella", topic: "tecnologia", topicName: "Tecnología", level: "inicial", kind: "sequence", emoji: "↪️", visibility: "class", classroomId: "c2", classroomLabel: "Primaria · 3.º · Sección B", closed: true, studentCount: 20, studentsSolved: 6, solvedPercent: 30, createdAt: 2 },
  { assignmentId: "a1", challengeId: "inicial-paseo", title: "Primer paseo", topic: "tecnologia", topicName: "Tecnología", level: "inicial", kind: "sequence", emoji: "🚶", visibility: "class", classroomId: "c1", classroomLabel: "Inicial · 5 años · Sección A", closed: false, studentCount: 3, studentsSolved: 2, solvedPercent: 67, createdAt: 1 },
];

beforeEach(() => list.mockReturnValue(RETOS));
afterEach(() => {
  cleanup();
  resetViewport();
});

const page = () => (
  <MemoryRouter>
    <RetosPage />
  </MemoryRouter>
);
const rows = () => within(screen.getByRole("table")).getAllByRole("row").slice(1);

describe("Retos del docente", () => {
  it("es la pestaña donde se crea y se revisa todo: título, botón «Nuevo reto» y una tabla con todos sus retos", () => {
    pretendViewport(false);
    render(page());
    expect(document.title).toBe("Retos · RoboLab");
    expect(screen.getByRole("heading", { level: 1, name: "Retos" })).toBeTruthy();
    expect((screen.getByRole("link", { name: /nuevo reto/i }) as HTMLAnchorElement).getAttribute("href")).toBe("/docente/retos/nuevo");
    expect(rows()).toHaveLength(3);
  });

  it("cada fila dice el tópico y nivel, la clase, cuántos lo lograron y su estado; el título lleva al detalle", () => {
    pretendViewport(false);
    render(page());
    const [probeta, gira, paseo] = rows().map((r) => within(r));
    expect((paseo!.getByRole("link", { name: /Primer paseo/ }) as HTMLAnchorElement).getAttribute("href")).toBe("/docente/retos/a1");
    expect(paseo!.getByText("Tecnología · Inicial")).toBeTruthy();
    expect(paseo!.getByText("Inicial · 5 años · Sección A")).toBeTruthy();
    expect(paseo!.getByText("67 %")).toBeTruthy();
    expect(paseo!.getByText("Activo")).toBeTruthy();

    expect(gira!.getByText("Cerrado")).toBeTruthy();
    expect(gira!.getByText("30 %")).toBeTruthy();

    // Un reto aún sin clase es un borrador: no inventa una clase ni un porcentaje.
    expect(probeta!.getByText("Sin asignar")).toBeTruthy();
    expect(probeta!.getByText("Borrador")).toBeTruthy();
    expect(probeta!.getByText("—")).toBeTruthy();
  });

  it("filtra por estado: Activos, Cerrados y de nuevo Todos", () => {
    pretendViewport(false);
    render(page());
    const state = within(screen.getByRole("group", { name: "Estado" }));
    expect(state.getByRole("button", { name: "Todos" }).getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(state.getByRole("button", { name: "Cerrados" }));
    expect(rows().map((r) => r.textContent)).toEqual([expect.stringContaining("Gira a la estrella")]);
    expect(state.getByRole("button", { name: "Cerrados" }).getAttribute("aria-pressed")).toBe("true");

    // Los borradores no son ni activos ni cerrados: no se mezclan con los activos.
    fireEvent.click(state.getByRole("button", { name: "Activos" }));
    expect(rows().map((r) => r.textContent)).toEqual([expect.stringContaining("Primer paseo")]);

    fireEvent.click(state.getByRole("button", { name: "Todos" }));
    expect(rows()).toHaveLength(3);
  });

  it("filtra por clase y por tópico con las opciones que de verdad hay", () => {
    pretendViewport(false);
    render(page());
    const classSelect = screen.getByLabelText("Clase");
    expect(within(classSelect).getAllByRole("option").map((o) => o.textContent)).toEqual(["Todas", "Inicial · 5 años · Sección A", "Primaria · 3.º · Sección B"]);
    fireEvent.change(classSelect, { target: { value: "c2" } });
    expect(rows()).toHaveLength(1);
    expect(rows()[0]!.textContent).toContain("Gira a la estrella");

    fireEvent.change(classSelect, { target: { value: "" } });
    const topicSelect = screen.getByLabelText("Tópico");
    expect(within(topicSelect).getAllByRole("option").map((o) => o.textContent)).toEqual(["Todos", "Ciencia", "Tecnología"]);
    fireEvent.change(topicSelect, { target: { value: "ciencia" } });
    expect(rows().map((r) => r.textContent)).toEqual([expect.stringContaining("La probeta")]);
  });

  it("si ningún reto coincide con los filtros lo dice y deja quitarlos", () => {
    pretendViewport(false);
    render(page());
    fireEvent.change(screen.getByLabelText("Clase"), { target: { value: "c1" } });
    fireEvent.change(screen.getByLabelText("Tópico"), { target: { value: "ciencia" } });
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByText("Ningún reto coincide con esos filtros.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Quitar filtros" }));
    expect(rows()).toHaveLength(3);
  });

  it("sin retos invita a crear el primero", () => {
    list.mockReturnValue([]);
    render(page());
    expect(screen.getByText(/aún no creaste retos/i)).toBeTruthy();
    expect((screen.getByRole("link", { name: /crear el primero/i }) as HTMLAnchorElement).getAttribute("href")).toBe("/docente/retos/nuevo");
    expect(screen.queryByRole("group", { name: "Estado" })).toBeNull();
  });

  it("mientras carga no muestra una lista vacía", () => {
    list.mockReturnValue(undefined);
    render(page());
    expect(screen.getByText("Cargando…")).toBeTruthy();
    expect(screen.queryByText(/aún no creaste retos/i)).toBeNull();
  });

  it("una clase sin alumnos no dice «0 de 0 lo lograron»", () => {
    pretendViewport(true);
    list.mockReturnValue([{ ...RETOS[2]!, studentCount: 0, studentsSolved: 0, solvedPercent: 0 }]);
    render(page());
    const card = within(screen.getByRole("list", { name: "Retos" })).getByRole("link");
    expect(card.textContent).toContain("Aún sin alumnos");
    expect(card.textContent).not.toContain("0 de 0");
  });

  it("en el celular son tarjetas con la clase completa, sin tabla recortada", () => {
    pretendViewport(true);
    render(page());
    expect(screen.queryByRole("table")).toBeNull();
    const cards = within(screen.getByRole("list", { name: "Retos" })).getAllByRole("listitem");
    expect(cards).toHaveLength(3);
    const first = within(cards[2]!).getByRole("link");
    expect(first.getAttribute("href")).toBe("/docente/retos/a1");
    expect(first.textContent).toContain("Primer paseo");
    expect(within(first).getByText("Inicial · 5 años · Sección A")).toBeTruthy();
    expect(first.textContent).toContain("2 de 3 lo lograron");
    expect(within(cards[0]!).getByRole("link").textContent).toContain("Sin asignar");
  });
});

// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { ConvexError } from "convex/values";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../../../shared/ui/Toast";

const data: Record<string, unknown> = {};
const mutations = { assign: vi.fn(), close: vi.fn(), reopen: vi.fn() };
vi.mock("convex/react", () => ({
  useQuery: (ref: unknown, args: unknown) => (args === "skip" ? undefined : data[getFunctionName(ref as never)]),
  useMutation: (ref: unknown) => mutations[getFunctionName(ref as never).split(":")[1] as keyof typeof mutations],
}));

import { RetoDetailPage } from "./RetoDetailPage";

// Las cifras de la maqueta T9: 80 % lo lograron, 2,0 intentos, 0,8 pistas, 4:12.
const RESULTS = {
  title: "La mesa del laboratorio",
  classroomLabel: "Primaria · 5.º · Sección A",
  classroomId: "c1",
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
const GET = { assignmentId: "a1", title: "La mesa del laboratorio", topic: "ciencia", topicName: "Ciencia", level: "primaria", kind: "mission", classroomId: "c1", classroomLabel: "Primaria · 5.º · Sección A" };
const CLASSES = [
  { _id: "c1", label: "Primaria · 5.º · Sección A" },
  { _id: "c2", label: "Primaria · 3.º · Sección B" },
];

beforeEach(() => {
  data["assignments:results"] = RESULTS;
  data["assignments:get"] = GET;
  data["assignments:listMine"] = [{ assignmentId: "a1", closed: false }];
  data["classrooms:listMine"] = CLASSES;
  mutations.assign.mockResolvedValue("a1");
  mutations.close.mockResolvedValue(undefined);
  mutations.reopen.mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  for (const m of Object.values(mutations)) m.mockReset();
});

function Landed() {
  return <p>Detalle de {useParams().assignmentId}</p>;
}

function renderDetail() {
  render(
    <MemoryRouter initialEntries={["/docente/retos/a1"]}>
      <ToastProvider>
        <Routes>
          <Route path="/docente/retos" element={<p>Lista de retos</p>} />
          <Route path="/docente/retos/:assignmentId" element={<RetoDetailPage />} />
          <Route path="/docente/retos/otro/:assignmentId" element={<Landed />} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  );
}

const row = (name: string) => within(screen.getByRole("row", { name: new RegExp(name) }));

describe("detalle de un reto: resultados (T9)", () => {
  it("pinta las cuatro cifras con coma decimal y el tiempo como cronómetro", () => {
    renderDetail();
    expect(document.title).toBe("Resultados: La mesa del laboratorio · RoboLab");
    expect(screen.getByRole("heading", { name: "La mesa del laboratorio · Clase Primaria · 5.º · Sección A" })).toBeTruthy();
    const summary = within(screen.getByLabelText("Resumen"));
    expect(summary.getByText("80%").nextSibling?.textContent).toBe("lo lograron");
    expect(summary.getByText("2,0").nextSibling?.textContent).toBe("intentos promedio");
    expect(summary.getByText("0,8").nextSibling?.textContent).toBe("pistas promedio");
    expect(summary.getByText("4:12").nextSibling?.textContent).toBe("tiempo promedio");
  });

  it("vuelve a la lista de Retos, no a la clase", () => {
    renderDetail();
    expect((screen.getByRole("link", { name: /Retos/ }) as HTMLAnchorElement).getAttribute("href")).toBe("/docente/retos");
  });

  it("muestra cada apodo con su estado y deja en blanco a quien no empezó", () => {
    renderDetail();
    expect(row("Pingüino veloz").getByText("Logrado")).toBeTruthy();
    expect(row("Pingüino veloz").getByText("3:10")).toBeTruthy();
    expect(row("Zorro curioso").getByText("En curso")).toBeTruthy();
    expect(row("Puma rápido").getByText("Sin empezar")).toBeTruthy();
    expect(row("Puma rápido").getAllByText("—")).toHaveLength(3);
  });

  it("cuenta lo observado sin diagnosticar", () => {
    renderDetail();
    const observed = within(screen.getByRole("complementary", { name: /qué se observó/i }));
    expect(observed.getByText("2 de 4 usaron al menos una pista.")).toBeTruthy();
    expect(observed.getByText(/1 de 3 corrigieron solos, sin pistas, tras fallar el primer intento\./)).toBeTruthy();
    expect(observed.getByText("Solo mostramos lo observable. No diagnosticamos.")).toBeTruthy();
  });

  it("sin partidas, los promedios no inventan cifras ni piden pistas de nadie", () => {
    data["assignments:results"] = {
      ...RESULTS,
      solvedPercent: 0,
      avgTries: null,
      avgHints: null,
      avgMs: null,
      rows: [RESULTS.rows[2]],
      observed: { hintsUsed: 0, hintsTotal: 0, correctedAlone: 0, correctedTotal: 0 },
    };
    renderDetail();
    const summary = within(screen.getByLabelText("Resumen"));
    expect(summary.getByText("0%")).toBeTruthy();
    expect(summary.getAllByText("—")).toHaveLength(3);
    const observed = within(screen.getByRole("complementary", { name: /qué se observó/i }));
    expect(observed.getByText("Todavía nadie jugó este reto.")).toBeTruthy();
    expect(observed.getByText("Nadie falló el primer intento.")).toBeTruthy();
  });
});

describe("detalle de un reto: control", () => {
  it("cerrar pide confirmar y avisa qué pasa con los alumnos; al confirmar lo cierra", async () => {
    renderDetail();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar reto" }));
    const dialog = within(screen.getByRole("alertdialog"));
    expect(dialog.getByText(/tus alumnos dejarán de verlo/i)).toBeTruthy();
    expect(dialog.getByText(/resultados se conservan/i)).toBeTruthy();
    expect(mutations.close).not.toHaveBeenCalled();
    fireEvent.click(dialog.getByRole("button", { name: "Sí, cerrar" }));
    await waitFor(() => expect(mutations.close).toHaveBeenCalledWith({ assignmentId: "a1" }));
  });

  it("cancelar no cierra nada", () => {
    renderDetail();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar reto" }));
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(mutations.close).not.toHaveBeenCalled();
  });

  it("un reto cerrado lo dice y se reabre con un toque", async () => {
    data["assignments:listMine"] = [{ assignmentId: "a1", closed: true }];
    renderDetail();
    expect(screen.getByText("Cerrado")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Cerrar reto" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Reabrir reto" }));
    await waitFor(() => expect(mutations.reopen).toHaveBeenCalledWith({ assignmentId: "a1" }));
  });

  it("asigna el reto a otra clase: la lista no incluye la clase actual", async () => {
    renderDetail();
    fireEvent.click(screen.getByRole("button", { name: "Asignar a otra clase" }));
    const form = within(screen.getByRole("form", { name: "Asignar a otra clase" }));
    expect(within(form.getByLabelText("Clase")).getAllByRole("option").map((o) => o.textContent)).toEqual(["Elige una clase", "Primaria · 3.º · Sección B"]);
    expect((form.getByRole("button", { name: "Asignar" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(form.getByLabelText("Clase"), { target: { value: "c2" } });
    fireEvent.click(form.getByRole("button", { name: "Asignar" }));
    await waitFor(() => expect(mutations.assign).toHaveBeenCalledWith({ assignmentId: "a1", classroomId: "c2" }));
  });

  it("si el servidor rechaza la asignación (ya está en esa clase) lo muestra y no se pierde el formulario", async () => {
    mutations.assign.mockRejectedValue(new ConvexError("Ese reto ya está en la clase."));
    renderDetail();
    fireEvent.click(screen.getByRole("button", { name: "Asignar a otra clase" }));
    const form = within(screen.getByRole("form", { name: "Asignar a otra clase" }));
    fireEvent.change(form.getByLabelText("Clase"), { target: { value: "c2" } });
    fireEvent.click(form.getByRole("button", { name: "Asignar" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/ya está en la clase/i));
    expect(screen.getByRole("form", { name: "Asignar a otra clase" })).toBeTruthy();
  });
});

describe("detalle de un reto que aún no tiene clase", () => {
  beforeEach(() => {
    data["assignments:get"] = { ...GET, classroomId: null, classroomLabel: null };
  });

  it("no muestra resultados inventados: dice que está sin asignar y ofrece asignarlo", () => {
    renderDetail();
    expect(screen.getByRole("heading", { name: "La mesa del laboratorio" })).toBeTruthy();
    expect(screen.getByText(/todavía no está asignado a ninguna clase/i)).toBeTruthy();
    expect(screen.queryByLabelText("Resumen")).toBeNull();
    expect(screen.queryByRole("button", { name: "Cerrar reto" })).toBeNull();
    expect(screen.getByRole("button", { name: "Asignar a una clase" })).toBeTruthy();
  });

  it("al asignarlo usa todas las clases (no hay una actual que excluir)", () => {
    renderDetail();
    fireEvent.click(screen.getByRole("button", { name: "Asignar a una clase" }));
    const form = within(screen.getByRole("form", { name: "Asignar a una clase" }));
    expect(within(form.getByLabelText("Clase")).getAllByRole("option")).toHaveLength(3);
  });
});

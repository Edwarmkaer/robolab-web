// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { ConvexError } from "convex/values";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../../../shared/ui/Toast";

const remove = vi.fn();
const ensureJoinCodes = vi.fn();
const CLASS = {
  _id: "c1",
  level: "primaria",
  label: "Primaria · 5.º · Sección A",
  joinCode: "TEC-482",
  studentCount: 3,
  students: [
    { _id: "s1", displayName: "Pingüino veloz", retosHechos: 5, retosTotal: 5, lastChallengeTitle: "La recta numérica", status: "solved" },
    { _id: "s2", displayName: "Zorro curioso", retosHechos: 3, retosTotal: 5, lastChallengeTitle: "La viga", status: "in_progress" },
    { _id: "s3", displayName: "Puma rápido", retosHechos: 0, retosTotal: 5, lastChallengeTitle: null, status: "not_started" },
  ],
};
const ASSIGNMENTS = [
  { assignmentId: "a1", challengeId: "inicial-paseo", title: "La mesa del laboratorio", topic: "ciencia", level: "primaria", kind: "mission", solvedPercent: 80, studentsSolved: 4, studentCount: 5 },
  { assignmentId: "a2", challengeId: "inicial-gira", title: "La viga", topic: "ingenieria", level: "inicial", kind: "sequence", solvedPercent: 40, studentsSolved: 2, studentCount: 5 },
];
let classroom: unknown = CLASS;
/** Como el servidor real: una clase borrada ya no se encuentra, y la consulta lanza al pintar. */
let deleted = false;
vi.mock("convex/react", () => ({
  useQuery: (ref: unknown, args: unknown) => {
    if (args === "skip") return undefined;
    if (deleted) throw new ConvexError("No encontramos esa clase.");
    return getFunctionName(ref as never) === "classrooms:get" ? classroom : ASSIGNMENTS;
  },
  useMutation: (ref: unknown) => (getFunctionName(ref as never) === "classrooms:ensureJoinCodes" ? ensureJoinCodes : remove),
}));

import { ClassDetailPage } from "./ClassDetailPage";

beforeEach(() => {
  deleted = false;
  classroom = CLASS;
  ensureJoinCodes.mockResolvedValue({ assigned: 1 });
});
afterEach(() => {
  cleanup();
  remove.mockReset();
  ensureJoinCodes.mockReset();
});

function renderClass(tab: "students" | "challenges" = "students") {
  render(
    <MemoryRouter initialEntries={[tab === "students" ? "/docente/clases/c1" : "/docente/clases/c1/retos"]}>
      <ToastProvider>
        <Routes>
          <Route path="/docente/clases" element={<p>Lista de clases</p>} />
          <Route path="/docente/clases/:classroomId" element={<ClassDetailPage tab="students" />} />
          <Route path="/docente/clases/:classroomId/retos" element={<ClassDetailPage tab="challenges" />} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe("una clase (T8)", () => {
  it("muestra el código con Copiar y la tabla de estudiantes por apodo, sin códigos personales", () => {
    renderClass();
    expect(document.title).toBe("Clase Primaria · 5.º · Sección A · RoboLab");
    expect(screen.getByRole("button", { name: "Código TEC-482 · Copiar" })).toBeTruthy();
    expect(screen.queryByText(/agregar alumnos/i)).toBeNull();
    const row = (name: string) => within(screen.getByRole("row", { name: new RegExp(name) }));
    expect(row("Pingüino veloz").getByText("5 de 5")).toBeTruthy();
    expect(row("Pingüino veloz").getByText("Logrado")).toBeTruthy();
    expect(row("Zorro curioso").getByText("En curso")).toBeTruthy();
    expect(row("Puma rápido").getByText("Sin empezar")).toBeTruthy();
    expect(row("Puma rápido").getByText("—")).toBeTruthy();
  });

  it("la pestaña Retos lista cada reto con «% lo lograron» y «Ver resultados»", () => {
    renderClass("challenges");
    const mesa = within(screen.getByRole("row", { name: /La mesa del laboratorio/ }));
    expect(mesa.getByText("80%")).toBeTruthy();
    expect((mesa.getByRole("link", { name: "Ver resultados" }) as HTMLAnchorElement).getAttribute("href")).toBe(
      "/docente/retos/a1",
    );
    expect(within(screen.getByRole("row", { name: /La viga/ })).getByText("40%")).toBeTruthy();
  });

  it("eliminar la clase pide confirmación y solo entonces la borra y vuelve a la lista", async () => {
    remove.mockImplementation(async () => {
      deleted = true; // desde aquí el servidor ya no encuentra la clase
    });
    renderClass();
    fireEvent.click(screen.getByRole("button", { name: /eliminar clase/i }));
    expect(remove).not.toHaveBeenCalled();
    const dialog = within(screen.getByRole("alertdialog"));
    expect(dialog.getByText(/se borran sus alumnos/i)).toBeTruthy();

    fireEvent.click(dialog.getByRole("button", { name: /cancelar/i }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(remove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /eliminar clase/i }));
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: /sí, eliminar/i }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith({ classroomId: "c1" }));
    // La pantalla no pinta el error «No encontramos esa clase» entre el borrado y la salida.
    await waitFor(() => expect(screen.getByText("Lista de clases")).toBeTruthy());
    expect(screen.queryByText(/No encontramos esa clase/)).toBeNull();
  });

  it("si no se pudo eliminar, lo dice con una alerta y la clase sigue ahí", async () => {
    remove.mockRejectedValue(new Error("boom"));
    renderClass();
    fireEvent.click(screen.getByRole("button", { name: /eliminar clase/i }));
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: /sí, eliminar/i }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Algo salió mal. Intenta de nuevo."));
    expect(screen.getByRole("heading", { name: "Clase Primaria · 5.º · Sección A" })).toBeTruthy();
  });

  it("una clase que no existe (o no es suya) dice que no la encuentra y deja volver a Mis clases", () => {
    deleted = true;
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    renderClass();
    expect(screen.getByRole("alert").textContent).toBe("No encontramos esa clase.");
    expect((screen.getByRole("link", { name: /volver a mis clases/i }) as HTMLAnchorElement).getAttribute("href")).toBe("/docente/clases");
    error.mockRestore();
  });

  it("una clase anterior a los códigos pide el suyo y mientras tanto avisa", () => {
    classroom = { ...CLASS, joinCode: null, students: [] };
    renderClass();
    expect(screen.getByText("Generando código…")).toBeTruthy();
    expect(ensureJoinCodes).toHaveBeenCalledTimes(1);
  });
});

// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../../../shared/ui/Toast";

const create = vi.fn();
const ensureJoinCodes = vi.fn();
let classes: unknown[] = [];
vi.mock("convex/react", () => ({
  useQuery: () => classes,
  useMutation: (ref: unknown) => (getFunctionName(ref as never) === "classrooms:ensureJoinCodes" ? ensureJoinCodes : create),
}));

import { ClassesPage } from "./ClassesPage";

const A = { _id: "c1", level: "primaria", grade: "5.º", section: "A", label: "Primaria · 5.º · Sección A", joinCode: "TEC-482", studentCount: 24 };

beforeEach(() => ensureJoinCodes.mockResolvedValue({ assigned: 1 }));
afterEach(() => {
  cleanup();
  create.mockReset();
  ensureJoinCodes.mockReset();
});

function renderClasses(creating = false) {
  render(
    <MemoryRouter>
      <ToastProvider>
        <ClassesPage creating={creating} />
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe("mis clases (T10)", () => {
  it("cada clase muestra su código con «Copiar» y a cuántos estudiantes tiene", () => {
    classes = [A, { ...A, _id: "c2", label: "Inicial · 3 años · Sección B", joinCode: "MAT-915", studentCount: 1 }];
    renderClasses();
    expect(document.title).toBe("Mis clases · RoboLab");
    expect(screen.getByRole("button", { name: "Código TEC-482 · Copiar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Código MAT-915 · Copiar" })).toBeTruthy();
    expect(screen.getByText("24 estudiantes")).toBeTruthy();
    expect(screen.getByText("1 estudiante")).toBeTruthy();
    expect(ensureJoinCodes).not.toHaveBeenCalled();
  });

  it("al crear una clase muestra su código para compartirlo (el servidor devuelve solo el Id)", async () => {
    classes = [];
    create.mockImplementation(async () => {
      classes = [A];
      return "c1";
    });
    renderClasses(true);
    fireEvent.change(screen.getByLabelText("Nivel"), { target: { value: "primaria" } });
    fireEvent.change(screen.getByLabelText(/grado o edad/i), { target: { value: "5.º" } });
    fireEvent.change(screen.getByLabelText("Sección"), { target: { value: "a" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear clase" }));

    await waitFor(() => expect(create).toHaveBeenCalledWith({ level: "primaria", grade: "5.º", section: "A" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "¡Clase creada!" })).toBeTruthy());
    expect(screen.getByLabelText("Código de la clase: TEC-482").textContent).toBe("TEC-482");
    expect((screen.getByRole("link", { name: "Ir a la clase" }) as HTMLAnchorElement).getAttribute("href")).toBe("/docente/clases/c1");
  });

  it("una clase anterior a los códigos pide uno al servidor una sola vez y mientras tanto avisa", () => {
    classes = [{ ...A, joinCode: null }];
    renderClasses();
    expect(screen.getByText("Generando código…")).toBeTruthy();
    expect(ensureJoinCodes).toHaveBeenCalledTimes(1);
    const card = within(screen.getByRole("list", { name: "Tus clases" }));
    expect(card.queryByRole("button", { name: /copiar el código/i })).toBeNull();
  });
});

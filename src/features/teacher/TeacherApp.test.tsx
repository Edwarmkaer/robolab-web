// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Lo que "responde el servidor" a cada consulta del docente (por nombre de función). */
const answers: Record<string, unknown> = {
  "users:me": { name: "Ana Pérez", email: "ana@colegio.edu.pe" },
  "classrooms:listMine": [],
  "evaluations:listForDate": [],
  "evaluations:listMine": [],
};
const signOut = vi.fn();

vi.mock("convex/react", () => ({
  Authenticated: ({ children }: { children: React.ReactNode }) => children,
  AuthLoading: () => null,
  Unauthenticated: () => null,
  useQuery: (ref: Parameters<typeof getFunctionName>[0], args: unknown) => (args === "skip" ? undefined : answers[getFunctionName(ref)]),
  useMutation: () => vi.fn(),
  useAction: () => vi.fn(),
}));
vi.mock("@convex-dev/auth/react", () => ({ useAuthActions: () => ({ signIn: vi.fn(), signOut }) }));

import { ToastProvider } from "../../shared/ui/Toast";
import { TeacherApp, sectionTitle } from "./TeacherApp";

beforeEach(() => {
  signOut.mockReset();
  document.title = "";
});
afterEach(cleanup);

function renderAt(path: string) {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/docente/*" element={<TeacherApp />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );
}

describe("armazón del docente: landmark, título de página y encabezado", () => {
  it.each([
    ["/docente", "Inicio · RoboLab", "Hola, Ana"],
    ["/docente/clases", "Mis clases · RoboLab", "Mis clases"],
    ["/docente/evaluaciones", "Evaluaciones · RoboLab", "Evaluaciones"],
    ["/docente/evaluaciones/nueva", "Evaluaciones · RoboLab", "Nueva evaluación"],
    ["/docente/progreso", "Progreso · RoboLab", "Progreso"],
  ])("%s: un <main>, un <h1> y la pestaña dice dónde estás", (path, tab, heading) => {
    renderAt(path);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    const h1 = screen.getAllByRole("heading", { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]!.textContent).toBe(heading);
    expect(document.title).toBe(tab);
  });

  it("el menú de secciones queda fuera del <main> (es navegación, no contenido)", () => {
    renderAt("/docente");
    const main = screen.getByRole("main");
    expect(main.contains(screen.getByRole("navigation", { name: "Secciones del docente" }))).toBe(false);
  });

  it("sectionTitle elige la sección cuyo enlace es el más largo que abre la ruta", () => {
    expect(sectionTitle("/docente")).toBe("Inicio");
    expect(sectionTitle("/docente/clases/abc123")).toBe("Mis clases");
    expect(sectionTitle("/docente/evaluaciones/nueva")).toBe("Evaluaciones");
    expect(sectionTitle("/docente/otra-cosa")).toBe("Docente");
  });
});

describe("cerrar sesión", () => {
  it("si falla, avisa con un mensaje de error en vez de quedarse mudo", async () => {
    signOut.mockRejectedValue(new Error("sin red"));
    renderAt("/docente");
    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    await waitFor(() => expect(screen.getByText("No pudimos cerrar la sesión. Intenta de nuevo.")).toBeTruthy());
  });
});

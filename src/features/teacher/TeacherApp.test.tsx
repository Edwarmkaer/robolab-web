// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Lo que "responde el servidor" a cada consulta del docente (por nombre de función). */
const answers: Record<string, unknown> = {
  "users:me": { name: "Ana Pérez", email: "ana@colegio.edu.pe" },
  "classrooms:listMine": [],
  "assignments:listMine": [],
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
import { TeacherApp } from "./TeacherApp";

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
    ["/docente", "Inicio · RoboLab", "Hola"],
    ["/docente/clases", "Mis clases · RoboLab", "Mis clases"],
    ["/docente/retos", "Retos · RoboLab", "Retos"],
    ["/docente/evaluaciones", "Retos · RoboLab", "Retos"],
    ["/docente/progreso", "Progreso · RoboLab", "Progreso"],
  ])("%s: un <main>, un <h1> y la pestaña dice dónde estás", (path, tab, heading) => {
    renderAt(path);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    const h1 = screen.getAllByRole("heading", { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]!.textContent).toBe(heading);
    expect(document.title).toBe(tab);
  });

  it("la pestaña dice Retos (ya no Evaluaciones) y marca dónde estás", () => {
    renderAt("/docente/retos");
    const nav = screen.getByRole("navigation", { name: "Secciones del docente" });
    expect(Array.from(nav.querySelectorAll("a")).map((a) => a.textContent)).toEqual(["Inicio", "Mis clases", "Retos", "Progreso"]);
    expect(nav.querySelector('a[aria-current="page"]')?.textContent).toBe("Retos");
    expect(nav.querySelector('a[href="/docente/evaluaciones"]')).toBeNull();
  });

  it("la pestaña Retos sigue marcada dentro de «Nuevo reto»", () => {
    renderAt("/docente/retos/nuevo");
    const nav = screen.getByRole("navigation", { name: "Secciones del docente" });
    expect(nav.querySelector('a[aria-current="page"]')?.textContent).toBe("Retos");
  });

  it("el menú de secciones queda fuera del <main> (es navegación, no contenido)", () => {
    renderAt("/docente");
    const main = screen.getByRole("main");
    expect(main.contains(screen.getByRole("navigation", { name: "Secciones del docente" }))).toBe(false);
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

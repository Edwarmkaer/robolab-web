// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { Link, MemoryRouter, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollToTop } from "../shared/ui/ScrollToTop";

/** `convex/react` entero se reemplaza: la 404 y el scroll no tocan el backend. */
vi.mock("convex/react", () => ({
  useQuery: () => undefined,
  useMutation: () => vi.fn(),
  useAction: () => vi.fn(),
  useConvexConnectionState: () => ({ hasInflightRequests: false, isWebSocketConnected: true, hasEverConnected: true, connectionRetries: 0, timeOfOldestInflightRequest: null }),
  Authenticated: () => null,
  Unauthenticated: () => null,
  AuthLoading: () => null,
}));
vi.mock("@convex-dev/auth/react", () => ({ useAuthActions: () => ({ signIn: vi.fn(), signOut: vi.fn() }) }));

import { ToastProvider } from "../shared/ui/Toast";
import { App } from "./App";

const scrollTo = vi.fn();

beforeEach(() => {
  window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
  scrollTo.mockClear();
  document.title = "";
});

afterEach(cleanup);

function renderApp(path: string) {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </ToastProvider>,
  );
}

describe("página que no existe", () => {
  it("dice que no la encontró (antes redirigía a la portada sin avisar), pone el título y lleva el foco al encabezado", () => {
    renderApp("/esta-ruta-no-existe");
    const title = screen.getByRole("heading", { level: 1, name: "No encontramos esta página" });
    expect(document.activeElement).toBe(title);
    expect(document.title).toBe("Página no encontrada · RoboLab");
    const main = within(screen.getByRole("main"));
    expect(main.getByRole("link", { name: "Volver al inicio" }).getAttribute("href")).toBe("/");
    expect(main.getByRole("link", { name: "Mi avance" }).getAttribute("href")).toBe("/mi-avance");
  });

  it("la portada y las rutas conocidas siguen funcionando", () => {
    document.title = "RoboLab"; // el de index.html: la portada no lo cambia
    renderApp("/");
    expect(screen.getByRole("heading", { level: 1, name: "Resuelve retos STEAM" })).toBeTruthy();
    expect(document.title).toBe("RoboLab");
  });
});

describe("scroll al cambiar de ruta", () => {
  function Shell({ initial }: { initial: string }) {
    return (
      <MemoryRouter initialEntries={["/a", initial]} initialIndex={1}>
        <ScrollToTop />
        <Link to="/b">ir a b</Link>
      </MemoryRouter>
    );
  }

  it("al navegar a otra página empieza arriba", () => {
    render(<Shell initial="/a" />);
    scrollTo.mockClear();
    act(() => screen.getByRole("link", { name: "ir a b" }).click());
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("al volver atrás no pisa la posición que recuerda el navegador", () => {
    function Shell() {
      return (
        <MemoryRouter initialEntries={["/a"]}>
          <ScrollToTop />
          <Link to="/b">ir a b</Link>
          <BackButton />
        </MemoryRouter>
      );
    }
    function BackButton() {
      const navigate = useNavigate();
      return (
        <button type="button" onClick={() => navigate(-1)}>
          atrás
        </button>
      );
    }
    render(<Shell />);
    act(() => screen.getByRole("link", { name: "ir a b" }).click());
    scrollTo.mockClear();
    act(() => screen.getByRole("button", { name: "atrás" }).click());
    expect(scrollTo).not.toHaveBeenCalled();
  });
});

// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ConvexError } from "convex/values";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { AppErrorBoundary } from "./AppErrorBoundary";

/** Como una consulta de Convex que falla al renderizar (enlace a algo que no es del docente). */
function Broken(): never {
  throw new ConvexError("No encontramos esa evaluación.");
}

afterEach(cleanup);

describe("red de errores de toda la app", () => {
  it("muestra el mensaje y una salida al inicio en vez de una pantalla en blanco", () => {
    render(
      <MemoryRouter initialEntries={["/docente/evaluaciones/x"]}>
        <AppErrorBoundary>
          <Routes>
            <Route path="/docente/*" element={<Broken />} />
            <Route path="/" element={<p>Portada</p>} />
          </Routes>
        </AppErrorBoundary>
      </MemoryRouter>,
      // React avisa por consola del error atrapado y del reintento de render; aquí es lo esperado.
      { onCaughtError: () => undefined, onRecoverableError: () => undefined },
    );
    expect(screen.getByRole("alert").textContent).toBe("No encontramos esa evaluación.");

    fireEvent.click(screen.getByRole("button", { name: "Volver al inicio" }));
    expect(screen.getByText("Portada")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const home = vi.fn();
vi.mock("convex/react", () => ({ useQuery: () => home() }));

import { ClassTag } from "./ClassTag";

beforeEach(() => window.localStorage.clear());
afterEach(() => {
  cleanup();
  home.mockReset();
});

describe("etiqueta «Apodo · Clase ABC-123» de Mi avance", () => {
  it("sin sesión de alumno no muestra nada ni consulta al servidor", () => {
    render(<ClassTag />);
    expect(screen.queryByText(/Clase/)).toBeNull();
    expect(home).not.toHaveBeenCalled();
  });

  it("con sesión muestra el apodo y el código de la clase", () => {
    window.localStorage.setItem("robolab.alumno.token", "t-1");
    home.mockReturnValue({ displayName: "Pingüino veloz", joinCode: "TEC-482" });
    render(<ClassTag />);
    expect(screen.getByText(/Pingüino veloz · Clase TEC-482/)).toBeTruthy();
  });

  it("si la clase es anterior a los códigos, muestra solo el apodo", () => {
    window.localStorage.setItem("robolab.alumno.token", "t-1");
    home.mockReturnValue({ displayName: "Ana", joinCode: null });
    render(<ClassTag />);
    expect(screen.getByText("Ana")).toBeTruthy();
    expect(screen.queryByText(/Clase/)).toBeNull();
  });

  it("si la sesión venció (la consulta falla), Mi avance sigue funcionando sin etiqueta", () => {
    window.localStorage.setItem("robolab.alumno.token", "viejo");
    home.mockImplementation(() => {
      throw new Error("Tu sesión terminó");
    });
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<ClassTag />);
    expect(screen.queryByText(/Clase/)).toBeNull();
    error.mockRestore();
  });
});

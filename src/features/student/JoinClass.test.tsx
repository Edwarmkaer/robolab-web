// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConvexError } from "convex/values";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

// El servidor devuelve el error (no lo lanza) para poder contar los intentos fallidos.
const join = vi.fn();
vi.mock("convex/react", () => ({ useMutation: () => join }));

import { JoinClass } from "./JoinClass";

afterEach(() => {
  cleanup();
  join.mockReset();
});

function renderJoin(onJoined = vi.fn()) {
  render(
    <MemoryRouter>
      <JoinClass onJoined={onJoined} />
    </MemoryRouter>,
  );
  return onJoined;
}

function fill(code: string, nickname: string) {
  fireEvent.change(screen.getByLabelText(/código de la clase/i), { target: { value: code } });
  fireEvent.change(screen.getByLabelText(/tu apodo/i), { target: { value: nickname } });
}

const unirme = () => screen.getByRole("button", { name: /unirme/i }) as HTMLButtonElement;

describe("únete a tu clase", () => {
  it("no deja unirse sin código y apodo, y pone el título de la pestaña", () => {
    renderJoin();
    expect(document.title).toBe("Únete a tu clase · RoboLab");
    expect(unirme().disabled).toBe(true);
    fill("tec-482", "");
    expect(unirme().disabled).toBe(true);
    fill("tec-482", "Pingüino veloz");
    expect(unirme().disabled).toBe(false);
    // El código se escribe en mayúsculas, como en la tarjeta del docente.
    expect((screen.getByLabelText(/código de la clase/i) as HTMLInputElement).value).toBe("TEC-482");
  });

  it("un apodo repetido en la clase (el servidor lo lanza) se muestra como alerta y no entra", async () => {
    join.mockRejectedValue(new ConvexError("Ese apodo ya está en uso en tu clase. Elige otro."));
    const onJoined = renderJoin();
    fill("TEC-482", "Pingüino veloz");
    fireEvent.click(unirme());
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/Ese apodo ya está en uso/));
    expect(join).toHaveBeenCalledWith({ code: "TEC-482", nickname: "Pingüino veloz" });
    expect(onJoined).not.toHaveBeenCalled();
    expect(unirme().disabled).toBe(false); // puede corregir y volver a intentar
  });

  it("un código que no existe (el servidor lo devuelve para contar el intento) se muestra como alerta", async () => {
    join.mockResolvedValue({ error: "No encontramos esa clase. Revisa el código." });
    const onJoined = renderJoin();
    fill("ZZZ-999", "Pingüino veloz");
    fireEvent.click(unirme());
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/No encontramos esa clase/));
    expect(onJoined).not.toHaveBeenCalled();
  });

  it("un error inesperado no filtra detalles: dice algo genérico", async () => {
    join.mockRejectedValue(new Error("Server Error: stack interno"));
    renderJoin();
    fill("TEC-482", "Pingüino veloz");
    fireEvent.click(unirme());
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Algo salió mal. Intenta de nuevo."));
  });

  it("con un código de clase y un apodo libres entra con su token", async () => {
    join.mockResolvedValue({ token: "t-1", displayName: "Pingüino veloz", classroomLabel: "Primaria · 5.º · Sección A" });
    const onJoined = renderJoin();
    fill("TEC-482", "Pingüino veloz");
    fireEvent.click(unirme());
    await waitFor(() => expect(onJoined).toHaveBeenCalledWith("t-1"));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

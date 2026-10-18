// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

// El servidor devuelve el error del ingreso (no lo lanza) para poder contar los intentos fallidos.
const signIn = vi.fn();
vi.mock("convex/react", () => ({ useMutation: () => signIn }));

import { StudentLogin } from "./StudentLogin";

afterEach(() => {
  cleanup();
  signIn.mockReset();
});

function submit(code: string) {
  fireEvent.change(screen.getByLabelText(/código/i), { target: { value: code } });
  fireEvent.submit(screen.getByLabelText(/código/i).closest("form")!);
}

describe("ingreso del alumno", () => {
  it("si el servidor devuelve un error, lo muestra y no entra", async () => {
    signIn.mockResolvedValue({ error: "No encontramos ese código. Pídele ayuda a tu profesora o profesor." });
    const onSignedIn = vi.fn();
    render(
      <MemoryRouter>
        <StudentLogin onSignedIn={onSignedIn} />
      </MemoryRouter>,
    );
    submit("ABC234");
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/No encontramos ese código/));
    expect(onSignedIn).not.toHaveBeenCalled();
  });

  it("con el código correcto entra con su token", async () => {
    signIn.mockResolvedValue({ token: "t-1", displayName: "Ana" });
    const onSignedIn = vi.fn();
    render(
      <MemoryRouter>
        <StudentLogin onSignedIn={onSignedIn} />
      </MemoryRouter>,
    );
    submit("ABC234");
    await waitFor(() => expect(onSignedIn).toHaveBeenCalledWith("t-1"));
  });
});

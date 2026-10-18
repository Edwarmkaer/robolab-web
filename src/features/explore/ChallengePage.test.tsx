// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../../shared/ui/Toast";

/** `robot.status` del servidor y las mutaciones (envío al robot, registro de la partida): las decide cada prueba. */
const status = vi.fn();
const mutation = vi.fn(async (_args?: unknown) => ({ robotName: "Kusi-12", letters: "FFF" }));
vi.mock("convex/react", () => ({
  useQuery: (_fn: unknown, args: unknown) => (args === "skip" ? undefined : status(args)),
  useMutation: () => mutation,
}));

import { ChallengeRoute } from "./ChallengePage";

const NOW = Date.UTC(2026, 9, 17, 20, 0);
const ROBOT_KEY = "robolab.robot";

function renderChallenge(id = "inicial-paseo") {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[`/reto/${id}`]}>
        <Routes>
          <Route path="/reto/:id" element={<ChallengeRoute />} />
          <Route path="*" element={<p>otra página</p>} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval", "setTimeout", "clearTimeout"] });
  vi.setSystemTime(NOW);
  window.localStorage.clear();
  status.mockReset();
  mutation.mockClear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("pantalla del reto: Robot y Ejecutar", () => {
  it("al empezar el reto el foco pasa al título, para que el lector de pantalla anuncie dónde está", () => {
    renderChallenge();
    fireEvent.click(screen.getByRole("button", { name: /Empezar el reto/ }));
    const title = screen.getByRole("heading", { level: 1 });
    expect(title.textContent).toBe("Primer paseo.");
    expect(document.activeElement).toBe(title);
  });

  it("Robot y Ejecutar van juntos en la barra de acciones (fija al pie en el celular)", () => {
    renderChallenge();
    fireEvent.click(screen.getByRole("button", { name: /Empezar el reto/ }));
    const bar = document.querySelector<HTMLElement>(".action-bar");
    expect(bar).not.toBeNull();
    expect(within(bar!).getByRole("button", { name: /^Robot/ })).toBeTruthy();
    expect(within(bar!).getByRole("button", { name: /Ejecutar/ })).toBeTruthy();
    // La pantalla reserva el espacio de la barra para que no tape el final del contenido.
    expect(document.querySelector(".game.has-action-bar")).not.toBeNull();
  });

  it("con un robot conectado, Ejecutar también manda la secuencia al robot", async () => {
    window.localStorage.setItem(ROBOT_KEY, "K7Q4MZ");
    status.mockReturnValue({ name: "Kusi-12", lastSeenAt: NOW - 1000, codeExpiresAt: NOW + 3_600_000, lastCommand: null });
    renderChallenge();
    fireEvent.click(screen.getByRole("button", { name: /Empezar el reto/ }));
    fireEvent.click(screen.getByRole("button", { name: "Avanzar" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Ejecutar/ }));
    });
    expect(mutation).toHaveBeenCalledWith(expect.objectContaining({ code: "K7Q4MZ", program: [{ kind: "move", command: "FORWARD" }] }));
  });

  it("sin robot conectado, Ejecutar no manda nada al robot", async () => {
    status.mockReturnValue(undefined);
    renderChallenge();
    fireEvent.click(screen.getByRole("button", { name: /Empezar el reto/ }));
    fireEvent.click(screen.getByRole("button", { name: "Avanzar" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Ejecutar/ }));
    });
    expect(mutation).not.toHaveBeenCalled();
  });
});

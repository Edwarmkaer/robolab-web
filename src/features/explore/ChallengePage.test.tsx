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

describe("pantalla del reto: al lograrlo", () => {
  it("al llegar a la estrella aparece '¡Reto logrado!' con el foco en su título y las cifras de la partida", async () => {
    renderChallenge();
    fireEvent.click(screen.getByRole("button", { name: /Empezar el reto/ }));
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole("button", { name: "Avanzar" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Ejecutar/ }));
      // La animación (4 pasos de 450 ms) y el momento de ver a Kusi en la estrella (1,2 s).
      await vi.advanceTimersByTimeAsync(4000);
    });
    const title = screen.getByRole("heading", { level: 1, name: "¡Reto logrado!" });
    expect(document.activeElement).toBe(title);
    expect([...document.querySelectorAll(".stat-row .stat")].map((s) => s.querySelector("span")!.textContent)).toEqual(["intento", "pistas", "tiempo"]);
    expect(screen.getByRole("link", { name: /Siguiente reto/ }).getAttribute("href")).toBe("/reto/inicial-gira");
    // Solo estadística anónima: se registra la partida del dispositivo.
    expect(mutation).toHaveBeenCalledWith(expect.objectContaining({ challengeId: "inicial-paseo", runs: 1, hints: 0 }));
  });

  it("'Repetir' vuelve a jugar el mismo reto y el foco regresa al título del reto", async () => {
    renderChallenge();
    fireEvent.click(screen.getByRole("button", { name: /Empezar el reto/ }));
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole("button", { name: "Avanzar" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Ejecutar/ }));
      await vi.advanceTimersByTimeAsync(4000);
    });
    fireEvent.click(screen.getByRole("button", { name: /Repetir/ }));
    const title = screen.getByRole("heading", { level: 1 });
    expect(title.textContent).toBe("Primer paseo.");
    expect(document.activeElement).toBe(title);
  });
});

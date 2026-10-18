// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../../shared/ui/Toast";

const recordPlay = vi.fn();
const recordChallengePlay = vi.fn();
vi.mock("convex/react", () => ({
  useQuery: () => undefined, // el envío al robot (RobotSend) consulta su estado; aquí no importa
  useMutation: (ref: unknown) => (getFunctionName(ref as never) === "student:recordChallengePlay" ? recordChallengePlay : recordPlay),
}));

import { ChallengeRoute } from "./ChallengePage";

beforeEach(() => {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo; // jsdom no hace scroll: cada fase nueva pide empezar arriba
  window.localStorage.clear();
  recordPlay.mockResolvedValue({ solved: true });
  recordChallengePlay.mockResolvedValue({ solved: true });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  recordPlay.mockReset();
  recordChallengePlay.mockReset();
});

/** "Primer paseo" (S..G): tres bloques de Avanzar y Ejecutar. */
async function solvePaseo() {
  render(
    <MemoryRouter initialEntries={["/reto/inicial-paseo"]}>
      <ToastProvider>
        <Routes>
          <Route path="/reto/:id" element={<ChallengeRoute />} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: /empezar el reto/i }));
  fireEvent.click(await screen.findByRole("button", { name: "Botones" }));
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole("button", { name: /^Avanzar$/ }));
  fireEvent.click(screen.getByRole("button", { name: /ejecutar/i }));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10_000);
  });
}

describe("partida de un reto resuelto", () => {
  it("sin sesión de alumno solo se registra la partida anónima del dispositivo", async () => {
    await solvePaseo();
    expect(screen.getByRole("heading", { name: /reto logrado/i })).toBeTruthy();
    expect(recordPlay).toHaveBeenCalledTimes(1);
    expect(recordChallengePlay).not.toHaveBeenCalled();
  });

  it("con sesión de alumno, además se manda a su clase con el token y el mismo programa", async () => {
    window.localStorage.setItem("robolab.alumno.token", "t-1");
    await solvePaseo();
    expect(recordPlay).toHaveBeenCalledTimes(1);
    expect(recordChallengePlay).toHaveBeenCalledTimes(1);
    const sent = recordChallengePlay.mock.calls[0]![0];
    expect(sent).toMatchObject({ token: "t-1", challengeId: "inicial-paseo", runs: 1, hints: 0 });
    expect(sent.program).toEqual(recordPlay.mock.calls[0]![0].program);
    expect(sent.program).toHaveLength(3);
    expect(sent).not.toHaveProperty("deviceId");
  });

  it("si el servidor rechaza la partida de la clase, el niño igual ve su resultado", async () => {
    window.localStorage.setItem("robolab.alumno.token", "t-1");
    recordChallengePlay.mockRejectedValue(new Error("sin red"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await solvePaseo();
    expect(screen.getByRole("heading", { name: /reto logrado/i })).toBeTruthy();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

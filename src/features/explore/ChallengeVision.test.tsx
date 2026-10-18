// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { ToastProvider } from "../../shared/ui/Toast";
import type { GestureSample } from "../vision/gestureGate";
import { ChallengeRoute } from "./ChallengePage";

const boundary = vi.hoisted(() => ({
  onSample: null as ((sample: GestureSample, time: number) => void) | null,
  record: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("convex/react", () => ({ useMutation: () => boundary.record, useQuery: () => undefined }));
vi.mock("../vision/cameraSession", () => ({
  startCameraSession: (_video: HTMLVideoElement, callbacks: { onSample: typeof boundary.onSample; onReady: () => void }) => {
    boundary.onSample = callbacks.onSample;
    callbacks.onReady();
    return () => { boundary.onSample = null; };
  },
}));
afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); localStorage.clear(); });

it("los cuatro movimientos, incluido retroceder, generan el programa que ejecuta el reto y registra el servidor", async () => {
  render(<MemoryRouter initialEntries={["/reto/inicial-paseo"]}><ToastProvider><Routes><Route path="/reto/:id" element={<ChallengeRoute />} /></Routes></ToastProvider></MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: "Empezar el reto" }));
  fireEvent.click(await screen.findByRole("button", { name: "Activar cámara" }));
  vi.useFakeTimers();
  let time = 0;
  function gesture(name: string, duration: number) {
    act(() => {
      for (let elapsed = 0; elapsed <= 400; elapsed += 100) boundary.onSample?.({ name: "", score: 0, hands: 0 }, time + elapsed);
    });
    time += 500;
    act(() => {
      for (let elapsed = 0; elapsed <= duration; elapsed += 100) boundary.onSample?.({ name, score: 0.95, hands: 1 }, time + elapsed);
    });
    time += duration + 100;
  }
  gesture("Pointing_Up", 800);
  gesture("Pointing_Down", 800);
  gesture("Pointing_Up", 800);
  gesture("Pointing_Up", 800);
  gesture("Pointing_Up", 800);
  expect(within(screen.getByRole("list", { name: "Tu secuencia" })).getAllByRole("listitem")).toHaveLength(5);
  expect(boundary.record).not.toHaveBeenCalled();
  gesture("Thumb_Up", 1200);
  expect((screen.getByRole("button", { name: "Ejecutar" }) as HTMLButtonElement).disabled).toBe(true);
  act(() => { vi.advanceTimersByTime(2700); });
  act(() => { vi.advanceTimersByTime(1200); });
  expect(screen.getByRole("heading", { name: "¡Reto logrado!" })).toBeTruthy();
  expect(boundary.record).toHaveBeenCalledWith(expect.objectContaining({
    challengeId: "inicial-paseo", runs: 1,
    program: [{ kind: "move", command: "FORWARD" }, { kind: "move", command: "BACKWARD" }, { kind: "move", command: "FORWARD" }, { kind: "move", command: "FORWARD" }, { kind: "move", command: "FORWARD" }],
  }));
});

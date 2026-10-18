// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useReducer } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { editorReducer, emptyEditor } from "@robolab/backend/domain/game/editor";
import { policyFor } from "@robolab/backend/domain/game/levels";
import { InitialProgramEditor } from "./InitialProgramEditor";
import type { GestureSample } from "./gestureGate";

const session = vi.hoisted(() => ({
  onSample: null as ((sample: GestureSample, time: number) => void) | null,
  stop: vi.fn(),
  start: vi.fn(),
}));
vi.mock("./cameraSession", () => ({
  startCameraSession: (_video: HTMLVideoElement, callbacks: { onSample: typeof session.onSample; onReady: () => void }) => {
    session.start();
    session.onSample = callbacks.onSample;
    callbacks.onReady();
    return session.stop;
  },
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); session.onSample = null; });

function Harness({ disabled = false, onExecute = vi.fn() }: { disabled?: boolean; onExecute?: () => void }) {
  const [state, dispatch] = useReducer(editorReducer, emptyEditor);
  return <InitialProgramEditor policy={policyFor("inicial")} state={state} dispatch={dispatch} disabled={disabled} onExecute={onExecute} />;
}

function sample(name: string, start: number, duration = 800) {
  act(() => { for (let t = start; t <= start + duration; t += 100) session.onSample?.({ name, score: 0.95, hands: 1 }, t); });
}
function release(start: number) {
  act(() => { for (let t = start; t <= start + 400; t += 100) session.onSample?.({ name: "", score: 0, hands: 0 }, t); });
}

describe("programar Inicial con gestos", () => {
  it("pide activar la cámara y conserva la alternativa con botones", () => {
    render(<Harness />);
    expect(session.start).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Botones" }));
    fireEvent.click(screen.getByRole("button", { name: "Avanzar" }));
    expect(screen.getByRole("listitem", { name: /Paso 1: Avanzar/ })).toBeTruthy();
  });

  it("muestra los bloques acumulados y confirma solo el programa visible", () => {
    const onExecute = vi.fn();
    render(<Harness onExecute={onExecute} />);
    fireEvent.click(screen.getByRole("button", { name: "Activar cámara" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar y ejecutar" }));
    expect(onExecute).not.toHaveBeenCalled();
    release(0);
    sample("Pointing_Up", 500);
    expect(screen.getByRole("listitem", { name: /Paso 1: Avanzar/ })).toBeTruthy();
    release(1400);
    sample("Pointing_Right", 1900);
    expect(screen.getByRole("listitem", { name: /Paso 2: Girar a la derecha/ })).toBeTruthy();
    expect(onExecute).not.toHaveBeenCalled();
    release(2800);
    sample("Pointing_Down", 3300);
    expect(screen.getByRole("listitem", { name: /Paso 3: Retroceder/ })).toBeTruthy();
    release(4200);
    sample("Pointing_Left", 4700);
    expect(screen.getByRole("listitem", { name: /Paso 4: Girar a la izquierda/ })).toBeTruthy();
    release(5600);
    sample("Thumb_Up", 6100, 1200);
    expect(onExecute).toHaveBeenCalledOnce();
  });

  it("un pulgar sostenido nunca ejecuta un programa vacío", () => {
    const onExecute = vi.fn();
    render(<Harness onExecute={onExecute} />);
    fireEvent.click(screen.getByRole("button", { name: "Activar cámara" }));
    release(0);
    sample("Thumb_Up", 500, 1200);
    expect(onExecute).not.toHaveBeenCalled();
  });

  it("ignora la cámara durante la ejecución y la libera al cambiar a botones", () => {
    const view = render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Activar cámara" }));
    view.rerender(<Harness disabled />);
    release(0);
    sample("Pointing_Up", 500);
    expect(screen.queryByRole("listitem")).toBeNull();
    view.rerender(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Botones" }));
    expect(session.stop).toHaveBeenCalledOnce();
  });
});

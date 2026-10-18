// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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
const activate = () => fireEvent.click(screen.getByRole("button", { name: "Activar cámara" }));
const sequence = () => within(screen.getByRole("list", { name: "Tu secuencia" }));

describe("programar Inicial: piezas y gestos en el mismo lugar", () => {
  it("no hay que elegir un modo: las piezas están a la vista y la cámara es opcional y no arranca sola", () => {
    render(<Harness />);
    expect(screen.queryByRole("button", { name: "Gestos" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Botones" })).toBeNull();
    expect(session.start).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Activar cámara" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Avanzar" }));
    expect(screen.getByRole("button", { name: /Paso 1: Avanzar/ })).toBeTruthy();
  });

  it("con la cámara encendida, los gestos agregan las mismas piezas y el pulgar ejecuta el programa visible", () => {
    const onExecute = vi.fn();
    render(<Harness onExecute={onExecute} />);
    activate();
    release(0);
    sample("Pointing_Up", 500);
    expect(screen.getByRole("button", { name: /Paso 1: Avanzar/ })).toBeTruthy();
    release(1400);
    sample("Pointing_Right", 1900);
    expect(screen.getByRole("button", { name: /Paso 2: Girar a la derecha/ })).toBeTruthy();
    expect(onExecute).not.toHaveBeenCalled();
    release(2800);
    sample("Pointing_Down", 3300);
    expect(screen.getByRole("button", { name: /Paso 3: Retroceder/ })).toBeTruthy();
    release(4200);
    sample("Pointing_Left", 4700);
    expect(screen.getByRole("button", { name: /Paso 4: Girar a la izquierda/ })).toBeTruthy();
    release(5600);
    sample("Thumb_Up", 6100, 1200);
    expect(onExecute).toHaveBeenCalledOnce();
  });

  it("se pueden mezclar: una pieza tocada y otra por gesto quedan en la misma secuencia", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Girar a la izquierda" }));
    activate();
    release(0);
    sample("Pointing_Up", 500);
    expect(sequence().getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual([
      "Paso 1: Girar a la izquierda. Toca para quitar.",
      "Paso 2: Avanzar. Toca para quitar.",
    ]);
  });

  it("un pulgar sostenido nunca ejecuta un programa vacío", () => {
    const onExecute = vi.fn();
    render(<Harness onExecute={onExecute} />);
    activate();
    release(0);
    sample("Thumb_Up", 500, 1200);
    expect(onExecute).not.toHaveBeenCalled();
  });

  it("ignora la cámara durante la ejecución y la libera al apagarla", () => {
    const view = render(<Harness />);
    activate();
    view.rerender(<Harness disabled />);
    release(0);
    sample("Pointing_Up", 500);
    expect(sequence().queryAllByRole("listitem")).toHaveLength(0);
    view.rerender(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Apagar cámara" }));
    expect(session.stop).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Activar cámara" })).toBeTruthy();
  });

  it("apagar la cámara no pierde el programa", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Avanzar" }));
    activate();
    fireEvent.click(screen.getByRole("button", { name: "Apagar cámara" }));
    expect(screen.getByRole("button", { name: /Paso 1: Avanzar/ })).toBeTruthy();
  });

  describe("el gesto de cada pieza va en la bandeja, sin texto", () => {
    it("cada pieza lleva su gesto como insignia y el ⓘ explica cómo hacerlo", () => {
      render(<Harness />);
      const frames = [...screen.getByRole("group", { name: "Piezas" }).querySelectorAll(".piece")];
      expect(frames.map((f) => f.querySelector(".piece-gesture")?.textContent)).toEqual(["☝️", "👇", "👈", "👉"]);
      expect(frames[0]!.querySelector(".piece-tip-detail")?.textContent).toBe("Apunta arriba");
    });

    it("la pieza del gesto que la cámara está viendo se resalta", () => {
      render(<Harness />);
      activate();
      release(0);
      act(() => { for (let t = 500; t <= 700; t += 100) session.onSample?.({ name: "Pointing_Right", score: 0.95, hands: 1 }, t); });
      const flags = within(screen.getByRole("group", { name: "Piezas" })).getAllByRole("button").map((b) => b.hasAttribute("data-current"));
      expect(flags).toEqual([false, false, false, true]);
    });

    it("el pulgar (ejecutar) no es una pieza: «Ejecutar» queda fuera y se avisa con una insignia aparte", () => {
      render(<Harness />);
      expect(screen.queryByRole("button", { name: "Confirmar y ejecutar" })).toBeNull();
      expect(screen.getByText("👍")).toBeTruthy();
    });
  });

  it("las explicaciones de la cámara (cómo apuntar, privacidad) van en un solo ⓘ, y el lector de pantalla las oye una vez", () => {
    render(<Harness />);
    const copies = screen.getAllByText(/No se graba ni se envía/);
    expect(copies).toHaveLength(2);
    expect(copies.filter((n) => n.classList.contains("sr-only"))).toHaveLength(1);
    expect(copies.filter((n) => n.closest(".piece-tip"))).toHaveLength(1);
    const describedBy = screen.getByRole("button", { name: "Activar cámara" }).getAttribute("aria-describedby")!;
    expect(document.getElementById(describedBy)?.textContent).toMatch(/recoge los otros dedos/);
  });
});

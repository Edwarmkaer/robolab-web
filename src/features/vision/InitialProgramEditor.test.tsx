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

describe("programar Inicial con gestos", () => {
  it("empieza con botones; la cámara es opcional y no arranca sola", () => {
    render(<Harness />);
    expect(session.start).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Botones" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Avanzar" }));
    expect(screen.getByRole("button", { name: /Paso 1: Avanzar/ })).toBeTruthy();
  });

  it("muestra los bloques acumulados y confirma solo el programa visible", () => {
    const onExecute = vi.fn();
    render(<Harness onExecute={onExecute} />);
    fireEvent.click(screen.getByRole("button", { name: "Gestos" }));
    fireEvent.click(screen.getByRole("button", { name: "Activar cámara" }));
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

  it("un pulgar sostenido nunca ejecuta un programa vacío", () => {
    const onExecute = vi.fn();
    render(<Harness onExecute={onExecute} />);
    fireEvent.click(screen.getByRole("button", { name: "Gestos" }));
    fireEvent.click(screen.getByRole("button", { name: "Activar cámara" }));
    release(0);
    sample("Thumb_Up", 500, 1200);
    expect(onExecute).not.toHaveBeenCalled();
  });

  it("ignora la cámara durante la ejecución y la libera al cambiar a botones", () => {
    const view = render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Gestos" }));
    fireEvent.click(screen.getByRole("button", { name: "Activar cámara" }));
    view.rerender(<Harness disabled />);
    release(0);
    sample("Pointing_Up", 500);
    expect(within(screen.getByRole("list", { name: "Tu secuencia" })).queryAllByRole("listitem")).toHaveLength(0);
    view.rerender(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Botones" }));
    expect(session.stop).toHaveBeenCalledOnce();
  });
});

describe("guía de gestos sin texto: el nombre vive en el botón de información", () => {
  const openGestures = () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Gestos" }));
    return within(screen.getByRole("list", { name: "Guía de gestos" })).getAllByRole("listitem");
  };

  it("son cinco fichas; cada una dice por escrito solo al lector de pantalla qué gesto es y qué hace", () => {
    const items = openGestures();
    expect(items).toHaveLength(5);
    const spoken = items.map((item) => item.querySelector(".sr-only")?.textContent);
    expect(spoken).toEqual([
      "Apunta arriba: Avanzar",
      "Apunta abajo: Retroceder",
      "Apunta a la izquierda: Girar a la izquierda",
      "Apunta a la derecha: Girar a la derecha",
      "Mantén el pulgar arriba: Confirmar y ejecutar",
    ]);
  });

  it("a la vista solo hay el gesto y la pieza que agrega: ningún texto de ayuda fijo", () => {
    const items = openGestures();
    expect(document.querySelector(".vision-legend strong")).toBeNull();
    for (const item of items) {
      const visible = [...item.querySelectorAll(".gesture-tile *")].filter((n) => n.children.length === 0 && n.textContent?.trim() && !n.classList.contains("sr-only"));
      // Lo único con texto es el emoji de la mano, escondido para el lector de pantalla.
      expect(visible.every((n) => n.closest("[aria-hidden='true']"))).toBe(true);
    }
    expect(screen.queryByText(/recoge los otros dedos\. Sigue/)).toBeNull();
  });

  it("cada ficha lleva su ⓘ con el nombre del gesto y de la acción", () => {
    const items = openGestures();
    expect(items.every((item) => item.querySelector(".piece-info"))).toBe(true);
    const tip = items[3]!.querySelector(".piece-tip")!;
    expect(tip.textContent).toContain("Apunta a la derecha");
    expect(tip.querySelector(".piece-tip-detail")?.textContent).toBe("Girar a la derecha");
    expect(tip.getAttribute("aria-hidden")).toBe("true");
  });

  it("tocar una ficha abre su información (en tablet no hay mouse), tocar otra cambia, y Escape o tocar fuera la cierra", () => {
    const items = openGestures();
    const open = () => items.map((i) => i.hasAttribute("data-tip-open"));
    fireEvent.click(items[0]!);
    expect(open()).toEqual([true, false, false, false, false]);
    fireEvent.click(items[2]!);
    expect(open()).toEqual([false, false, true, false, false]);
    fireEvent.click(items[2]!);
    expect(open()).toEqual([false, false, false, false, false]);
    fireEvent.click(items[1]!);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(open()).toEqual([false, false, false, false, false]);
    fireEvent.click(items[4]!);
    fireEvent.pointerDown(document.body);
    expect(open()).toEqual([false, false, false, false, false]);
  });

  it("la ficha del gesto que la cámara está viendo se resalta", () => {
    const items = openGestures();
    fireEvent.click(screen.getByRole("button", { name: "Activar cámara" }));
    release(0);
    act(() => { for (let t = 500; t <= 700; t += 100) session.onSample?.({ name: "Pointing_Right", score: 0.95, hands: 1 }, t); });
    const current = items.map((i) => i.querySelector(".gesture-tile")?.hasAttribute("data-current"));
    expect(current).toEqual([false, false, false, true, false]);
  });

  it("ya no hay un segundo botón «Confirmar y ejecutar»: el pulgar y «Ejecutar» hacen lo mismo", () => {
    openGestures();
    expect(screen.queryByRole("button", { name: "Confirmar y ejecutar" })).toBeNull();
  });

  it("las explicaciones de la cámara (cómo apuntar, privacidad) van en un solo ⓘ, y el lector de pantalla las oye una vez", () => {
    openGestures();
    const copies = screen.getAllByText(/No se graba ni se envía/);
    expect(copies).toHaveLength(2);
    expect(copies.filter((n) => n.classList.contains("sr-only"))).toHaveLength(1);
    expect(copies.filter((n) => n.closest(".piece-tip"))).toHaveLength(1);
    const button = screen.getByRole("button", { name: "Activar cámara" });
    const describedBy = button.getAttribute("aria-describedby")!;
    expect(document.getElementById(describedBy)?.textContent).toMatch(/recoge los otros dedos/);
  });
});

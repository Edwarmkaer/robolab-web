// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { move } from "@robolab/backend/domain/game/program";
import { policyFor } from "@robolab/backend/domain/game/levels";
import { BlockEditor } from "./BlockEditor";

afterEach(cleanup);

describe("editor de bloques", () => {
  it("la secuencia es una lista real: cada paso es un <li> con su botón para quitarlo", () => {
    const dispatch = vi.fn();
    render(
      <BlockEditor
        policy={policyFor("inicial")}
        state={{ blocks: [move("FORWARD"), move("TURN_LEFT")], openRepeat: null }}
        dispatch={dispatch}
        disabled={false}
      />,
    );
    const list = screen.getByRole("list", { name: "Tu secuencia" });
    expect(list.tagName).toBe("UL");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items.every((li) => li.tagName === "LI")).toBe(true);

    const step = within(items[1]!).getByRole("button", { name: /Paso 2: Girar a la izquierda/ });
    fireEvent.click(step);
    expect(dispatch).toHaveBeenCalledWith({ type: "remove", path: [1] });
  });

  it("la paleta muestra las piezas del nivel y la secuencia vacía deja casillas punteadas para llenar", () => {
    render(<BlockEditor policy={policyFor("inicial")} state={{ blocks: [], openRepeat: null }} dispatch={() => undefined} disabled={false} />);
    const palette = screen.getByRole("group", { name: "Pasos" });
    const pieces = within(palette).getAllByRole("button");
    expect(pieces.map((b) => b.getAttribute("aria-label"))).toEqual(["Avanzar", "Retroceder", "Girar a la izquierda", "Girar a la derecha"]);
    expect(pieces.map((b) => b.getAttribute("data-piece"))).toEqual(["FORWARD", "BACKWARD", "TURN_LEFT", "TURN_RIGHT"]);
    // Inicial no tiene Retroceder ni Repetir.
    expect(within(palette).queryByRole("button", { name: /Repetir|Retroceder/ })).toBeNull();

    const list = screen.getByRole("list", { name: "Tu secuencia" });
    expect(within(list).queryAllByRole("listitem")).toHaveLength(0);
    expect(list.querySelectorAll(".slot-empty").length).toBeGreaterThan(0);
    expect(list.querySelector(".slot-empty")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("en Primaria la pieza Repetir lleva el número de veces dentro de la secuencia", () => {
    render(
      <BlockEditor
        policy={policyFor("primaria")}
        state={{ blocks: [{ kind: "repeat", times: 3, body: [move("FORWARD")] }], openRepeat: null }}
        dispatch={() => undefined}
        disabled={false}
      />,
    );
    const palette = screen.getByRole("group", { name: "Pasos" });
    expect(within(palette).getByRole("button", { name: "Retroceder" }).getAttribute("data-piece")).toBe("BACKWARD");
    expect(within(palette).getByRole("button", { name: "Repetir" }).getAttribute("data-piece")).toBe("repeat");
    // El primer elemento es el bloque Repetir; adentro lleva su propia lista.
    const repeat = within(screen.getByRole("list", { name: "Tu secuencia" })).getAllByRole("listitem")[0]!;
    expect(repeat.getAttribute("data-piece")).toBe("repeat");
    expect((within(repeat).getByRole("combobox", { name: "Veces" }) as HTMLSelectElement).value).toBe("3");
    expect(within(repeat).getByRole("list", { name: "Dentro de repetir" }).tagName).toBe("UL");
  });
});

describe("piezas sin texto: solo ícono, con su nombre en un ícono de información", () => {
  it("las piezas de la paleta no tienen texto visible; el nombre va en el aria-label y en la etiqueta del ícono (i)", () => {
    render(<BlockEditor policy={policyFor("primaria")} state={{ blocks: [], openRepeat: null }} dispatch={() => undefined} disabled={false} />);
    const palette = screen.getByRole("group", { name: "Pasos" });
    const buttons = within(palette).getAllByRole("button");
    expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual(["Avanzar", "Retroceder", "Girar a la izquierda", "Girar a la derecha", "Repetir"]);
    for (const button of buttons) {
      // Sin texto visible: solo la imagen decorativa.
      expect(button.textContent).toBe("");
      expect(button.querySelector("img")!.getAttribute("alt")).toBe("");
      // Arriba a la derecha de la pieza hay un ícono de información con el nombre.
      const frame = button.closest(".piece")!;
      expect(frame.querySelector(".piece-info svg")).not.toBeNull();
      expect(frame.querySelector(".piece-tip")!.textContent).toBe(button.getAttribute("aria-label"));
    }
  });

  it("el ícono y su etiqueta son solo visuales: no repiten el nombre al lector ni suman paradas de Tab", () => {
    render(<BlockEditor policy={policyFor("inicial")} state={{ blocks: [move("FORWARD")], openRepeat: null }} dispatch={() => undefined} disabled={false} />);
    for (const hidden of document.querySelectorAll(".piece-info, .piece-tip")) {
      expect(hidden.getAttribute("aria-hidden")).toBe("true");
      expect(hidden.matches("button, a, [tabindex]")).toBe(false);
    }
    // Un botón de pieza = una parada de Tab: 4 de la paleta, 1 del paso y la papelera.
    expect(screen.getAllByRole("button")).toHaveLength(4 + 1 + 1);
  });

  it("los pasos de la secuencia también muestran su nombre en el ícono de información", () => {
    render(
      <BlockEditor policy={policyFor("inicial")} state={{ blocks: [move("TURN_RIGHT")], openRepeat: null }} dispatch={() => undefined} disabled={false} />,
    );
    const step = screen.getByRole("button", { name: /Paso 1: Girar a la derecha/ });
    expect(step.closest("li")!.classList.contains("piece")).toBe(true);
    expect(step.closest("li")!.querySelector(".piece-tip")!.textContent).toBe("Girar a la derecha");
    expect(step.textContent).toBe("1");
  });

  it("en Repetir el nombre queda para el lector de pantalla y el ícono lleva su etiqueta", () => {
    render(
      <BlockEditor
        policy={policyFor("primaria")}
        state={{ blocks: [{ kind: "repeat", times: 3, body: [move("FORWARD")] }], openRepeat: null }}
        dispatch={() => undefined}
        disabled={false}
      />,
    );
    const repeat = within(screen.getByRole("list", { name: "Tu secuencia" })).getAllByRole("listitem")[0]!;
    expect(within(repeat).getByText("Repetir", { selector: ".sr-only" })).toBeTruthy();
    expect(repeat.querySelector(":scope > .piece .piece-tip")!.textContent).toBe("Repetir");
  });

  it("Escape esconde la etiqueta sin quitar el foco, y sale del botón la devuelve", () => {
    render(<BlockEditor policy={policyFor("inicial")} state={{ blocks: [], openRepeat: null }} dispatch={() => undefined} disabled={false} />);
    const button = screen.getByRole("button", { name: "Avanzar" });
    const frame = button.closest(".piece")!;
    button.focus();
    fireEvent.keyDown(button, { key: "Escape" });
    expect(frame.getAttribute("data-tip-dismissed")).toBe("true");
    expect(document.activeElement).toBe(button);

    fireEvent.blur(button);
    expect(frame.getAttribute("data-tip-dismissed")).toBeNull();
  });
});

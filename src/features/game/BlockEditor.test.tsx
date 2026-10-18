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
    expect(pieces.map((b) => b.textContent)).toEqual(["Avanzar", "Girar a la izquierda", "Girar a la derecha"]);
    expect(pieces.map((b) => b.getAttribute("data-piece"))).toEqual(["FORWARD", "TURN_LEFT", "TURN_RIGHT"]);
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

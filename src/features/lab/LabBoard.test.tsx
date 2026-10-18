// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { missionById } from "@robolab/backend/domain/lab/mission";
import { LabBoard } from "./LabBoard";

const RUTA = missionById("primaria-tecnologia-materiales")!;

afterEach(cleanup);

describe("tablero del laboratorio", () => {
  it("pinta las paredes, el terreno difícil, las estaciones A y B, la meta y el robot en el inicio", () => {
    const { container } = render(<LabBoard mission={RUTA} robot={{ cell: RUTA.start, heading: 90 }} mood="idle" stepMs={450} />);
    const board = screen.getByRole("img", { name: /Tablero de 6 por 6/ });
    expect(board.querySelectorAll(".lab-tile")).toHaveLength(36);
    expect(board.querySelectorAll('[data-kind="wall"]')).toHaveLength(RUTA.walls.length);
    expect(board.querySelectorAll('[data-kind="rough"]')).toHaveLength(RUTA.rough.length);
    expect(board.querySelectorAll('[data-kind="station"]')).toHaveLength(2);
    expect(screen.getByText("A")).toBeTruthy();
    expect(screen.getByText("B")).toBeTruthy();
    expect(board.querySelectorAll('[data-kind="goal"] .lab-star')).toHaveLength(1);
    // La estación A está arriba a la derecha: la última casilla de la primera fila.
    const tiles = [...board.querySelectorAll(".lab-tile")];
    expect(tiles[5]?.getAttribute("data-kind")).toBe("station");
    expect(tiles[35]?.getAttribute("data-kind")).toBe("goal");
    expect(container.querySelector(".robot img")?.getAttribute("src")).toBe("/robot/robot.svg");
  });

  it("marca las casillas visitadas y mueve al robot con la cara de éxito", () => {
    const { container } = render(
      <LabBoard mission={RUTA} robot={{ cell: [5, 5], heading: 180 }} visited={new Set(["0,0", "1,0", "2,0"])} mood="success" stepMs={200} />,
    );
    expect(container.querySelectorAll("[data-visited]")).toHaveLength(3);
    expect(container.querySelector(".robot img")?.getAttribute("src")).toBe("/robot/robot-exito.svg");
    expect((container.querySelector(".robot") as HTMLElement).style.transform).toBe("rotate(360deg)");
  });
});

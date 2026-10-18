// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TOPICS } from "@robolab/backend/domain/explore/challenges";
import { parseMap } from "@robolab/backend/domain/game/map";
import { Board } from "./Board";

afterEach(cleanup);

const map = parseMap("ambiente", ["SWP", "..G"], 90);
const robot = { cell: map.start, heading: map.startHeading };

const draw = (topic?: Parameters<typeof Board>[0]["topic"]) =>
  render(<Board map={map} robot={robot} mood="idle" stepMs={100} {...(topic ? { topic } : {})} />).container;

describe("tablero ambientado por tópico", () => {
  it("sin tópico se ve como el jardín de siempre: sin ambiente ni marca de meta", () => {
    const board = draw().querySelector(".board")!;
    expect(board.getAttribute("data-topic")).toBeNull();
    expect(board.querySelector(".goal-mark")).toBeNull();
    expect(board.querySelector('[data-kind="water"] .tile-mark')?.textContent).toBe("💧");
    expect(board.querySelector(".tile[data-goal] .star")).not.toBeNull();
  });

  it.each(TOPICS.map((t) => [t.id] as const))("%s marca el tablero, la meta y el obstáculo de su ambiente", (topic) => {
    const board = draw(topic).querySelector(".board")!;
    expect(board.getAttribute("data-topic")).toBe(topic);
    const goal = board.querySelector(".tile[data-goal]")!;
    expect(goal.querySelector(".star")).not.toBeNull(); // la estrella sigue siendo la meta
    expect(goal.querySelector(".goal-mark")?.getAttribute("aria-hidden")).toBe("true");
    expect(board.querySelectorAll(".tile[data-goal]")).toHaveLength(1);
    expect(board.querySelector('[data-kind="water"] .tile-mark')).not.toBeNull();
  });

  it("cada ambiente pone su propia marca de meta y de obstáculo", () => {
    const marks = Object.fromEntries(
      TOPICS.map((t) => {
        const board = draw(t.id).querySelector(".board")!;
        const pair = [board.querySelector(".goal-mark")?.textContent, board.querySelector('[data-kind="water"] .tile-mark')?.textContent];
        cleanup();
        return [t.id, pair];
      }),
    );
    expect(marks).toEqual({
      tecnologia: ["🌻", "💧"],
      ciencia: ["🧪", "💧"],
      ingenieria: ["⚙️", "🛢️"],
      artes: ["🖼️", "🎨"],
      matematicas: ["🔢", "💧"],
    });
  });

  it("las banderas de las paradas se dibujan igual en todos los ambientes", () => {
    for (const t of TOPICS) {
      const board = draw(t.id).querySelector(".board")!;
      expect(board.textContent).toContain("🚩");
      cleanup();
    }
  });
});

// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { QuestionDialog } from "./QuestionDialog";

const question = { stage: 0, prompt: "¿Qué animal dice miau?", options: ["Gato", "Perro"], points: 1 };

afterEach(cleanup);

describe("diálogo de la pregunta", () => {
  it("es un diálogo nativo (atrapa el foco) con la pregunta como título y el error adentro, donde el niño lo ve", () => {
    render(<QuestionDialog question={question} busy={false} error="Se perdió la conexión." onAnswer={() => undefined} />);
    const dialog = screen.getByRole("dialog", { name: question.prompt });
    expect(dialog.tagName).toBe("DIALOG");
    expect(within(dialog).getByRole("alert").textContent).toBe("Se perdió la conexión.");
    expect(within(dialog).getAllByRole("button", { name: /^[AB]\. / })).toHaveLength(2);
  });

  it("mientras se envía la respuesta, las alternativas quedan deshabilitadas y no hay error", () => {
    render(<QuestionDialog question={question} busy={true} onAnswer={() => undefined} />);
    const dialog = screen.getByRole("dialog");
    const options = within(dialog).getAllByRole("button", { name: /^[AB]\. / }) as HTMLButtonElement[];
    expect(options.every((b) => b.disabled)).toBe(true);
    expect(within(dialog).queryByRole("alert")).toBeNull();
  });
});

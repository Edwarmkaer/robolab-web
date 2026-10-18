// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("convex/react", () => ({
  useQuery: () => [{ _id: "c1", label: "Inicial · 5 años · Sección A", studentCount: 3 }],
  useMutation: () => vi.fn(),
}));

import { ToastProvider } from "../../../shared/ui/Toast";
import { EvaluationForm } from "./EvaluationForm";

beforeEach(() => {
  // jsdom no hace scroll: el formulario lleva al primer campo marcado.
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

describe("formulario de evaluación", () => {
  it("al guardar sin título, el error se anuncia (role=alert) y está unido al campo", () => {
    const { container } = render(
      <ToastProvider>
        <MemoryRouter>
          <EvaluationForm />
        </MemoryRouter>
      </ToastProvider>,
    );
    fireEvent.submit(container.querySelector("form")!);
    const alerts = screen.getAllByRole("alert").map((a) => a.textContent);
    expect(alerts.some((t) => t?.includes("Escribe un título"))).toBe(true);
    const title = screen.getByLabelText("Título");
    expect(title.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(title.getAttribute("aria-describedby")!)!.getAttribute("role")).toBe("alert");
  });
});

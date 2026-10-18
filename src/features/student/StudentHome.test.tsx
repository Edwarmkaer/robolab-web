// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const home = vi.fn();
vi.mock("convex/react", () => ({ useQuery: () => home(), useMutation: () => vi.fn() }));

import { StudentHome } from "./StudentHome";

afterEach(cleanup);

describe("portada del alumno", () => {
  it("sin evaluación, dice qué día está usando el servidor (no el reloj de la tablet)", () => {
    home.mockReturnValue({
      displayName: "Ana",
      level: "inicial",
      classroomLabel: "Inicial · 5 años · Sección A",
      today: "2026-10-17",
      evaluation: null,
      pendingCount: 0,
    });
    render(
      <MemoryRouter>
        <StudentHome token="t-1" onSignOut={() => undefined} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Hoy no tienes evaluaciones/)).toBeTruthy();
    expect(screen.getByText("Hoy es 17 oct.")).toBeTruthy();
  });
});

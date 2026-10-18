// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.fn();
vi.mock("convex/react", () => ({
  useQuery: () => query(),
  useMutation: () => vi.fn(),
}));

import { StudentHome } from "./StudentHome";
import { StudentLogin } from "./StudentLogin";

beforeEach(() => {
  query.mockReset();
  document.title = "";
});
afterEach(cleanup);

describe("portada del alumno", () => {
  it("pone su nombre en la pestaña", () => {
    query.mockReturnValue({
      displayName: "Ana",
      level: "inicial",
      classroomLabel: "Inicial · 5 años · Sección A",
      joinCode: null,
      classChallenges: [],
    });
    render(
      <MemoryRouter>
        <StudentHome token="t-1" onSignOut={() => undefined} />
      </MemoryRouter>,
    );
    expect(document.title).toBe("Mi clase · RoboLab");
  });
});

describe("ingreso del alumno", () => {
  it("pone su nombre en la pestaña", () => {
    render(
      <MemoryRouter>
        <StudentLogin onSignedIn={() => undefined} />
      </MemoryRouter>,
    );
    expect(document.title).toBe("Ingresar · RoboLab");
  });
});

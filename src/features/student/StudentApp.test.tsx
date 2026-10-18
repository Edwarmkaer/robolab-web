// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const join = vi.fn();
const HOME = {
  displayName: "Pingüino veloz",
  level: "inicial",
  classroomLabel: "Inicial · 5 años · Sección A",
  joinCode: "TEC-482",
  today: "2026-10-17",
  evaluation: null,
  pendingCount: 0,
  classChallenges: [
    { assignmentId: "a1", challengeId: "inicial-paseo", title: "Primer paseo", level: "inicial", kind: "sequence", solved: false },
  ],
};
vi.mock("convex/react", () => ({ useMutation: () => join, useQuery: () => HOME }));

import { StudentApp } from "./StudentApp";

beforeEach(() => window.localStorage.clear());
afterEach(() => {
  cleanup();
  join.mockReset();
});

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/alumno/*" element={<StudentApp />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("/alumno", () => {
  it("sin sesión pide el código de la clase y el apodo (no el código personal)", () => {
    renderAt("/alumno");
    expect(screen.getByRole("heading", { name: "Únete a tu clase" })).toBeTruthy();
    expect(screen.getByLabelText(/código de la clase/i)).toBeTruthy();
    expect(screen.getByLabelText(/tu apodo/i)).toBeTruthy();
  });

  it("al unirse guarda la sesión y llega a su portada con los retos de su clase", async () => {
    join.mockResolvedValue({ token: "t-1", displayName: "Pingüino veloz", classroomLabel: HOME.classroomLabel });
    renderAt("/alumno/juego/un-intento-viejo");
    fireEvent.change(screen.getByLabelText(/código de la clase/i), { target: { value: "tec-482" } });
    fireEvent.change(screen.getByLabelText(/tu apodo/i), { target: { value: "Pingüino veloz" } });
    fireEvent.click(screen.getByRole("button", { name: /unirme/i }));

    await waitFor(() => expect(screen.getByRole("heading", { name: "¡Hola, Pingüino veloz!" })).toBeTruthy());
    expect(window.localStorage.getItem("robolab.alumno.token")).toBe("t-1");
    expect(screen.getByRole("heading", { name: "Retos de tu clase" })).toBeTruthy();
    expect((screen.getByRole("link", { name: /Primer paseo/ }) as HTMLAnchorElement).getAttribute("href")).toBe("/reto/inicial-paseo");
  });

  it("las tarjetas con código por alumno de la fase 1 siguen entrando por /alumno/codigo", () => {
    renderAt("/alumno/codigo");
    expect(screen.getByLabelText(/escribe tu código/i)).toBeTruthy();
  });
});

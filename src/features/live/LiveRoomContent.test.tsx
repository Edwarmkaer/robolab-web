// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { ConvexError } from "convex/values";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RoomView } from "./types";

const mutate = vi.fn();
vi.mock("convex/react", () => ({
  useMutation: (ref: unknown) => (args: unknown) => mutate(getFunctionName(ref as never), args),
}));
import { LiveRoomContent } from "./LiveRoomContent";

const state = { cell: { row: 0, col: 0 }, heading: 90 as const };
function room(overrides: Partial<RoomView> = {}): RoomView {
  return {
    roomId: "r1", classroomId: "c1", classroomLabel: "Primaria A", joinCode: "TEC-482",
    title: "Jardín de caminos", mazeId: "jardin", mode: "race", status: "waiting",
    startedAt: null, closedAt: null, participants: [],
    shared: { program: [], revision: 0, runs: 0, outcome: null, finishedAt: null, state },
    me: null, ...overrides,
  } as RoomView;
}
const me = { studentId: "s1" as NonNullable<RoomView["me"]>["studentId"], program: [], runs: 0, outcome: null, finishedAt: null, state } as NonNullable<RoomView["me"]>;
function view(value: RoomView, token: string | null = "token") {
  return <MemoryRouter><LiveRoomContent room={value} token={token ?? undefined} /></MemoryRouter>;
}
beforeEach(() => mutate.mockResolvedValue(null));
afterEach(() => { cleanup(); mutate.mockReset(); });

describe("sala en vivo", () => {
  it("unirse no adelanta la fase ni muestra un editor antes del inicio confirmado", async () => {
    render(view(room()));
    fireEvent.click(screen.getByRole("button", { name: "Unirme a la partida" }));
    await waitFor(() => expect(mutate).toHaveBeenCalledWith("liveRooms:join", { roomId: "r1", token: "token" }));
    expect(screen.getByText("Sala de espera")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Ejecutar programa" })).toBeNull();
  });

  it("habilita el juego cuando llega el inicio por la consulta reactiva", () => {
    const { rerender } = render(view(room({ me })));
    expect(screen.queryByRole("button", { name: "Avanzar" })).toBeNull();
    rerender(view(room({ me, status: "running", startedAt: 1000 })));
    expect(screen.getByRole("button", { name: "Avanzar" })).toBeTruthy();
  });

  it("ejecutar no anuncia victoria hasta recibir el resultado del servidor", async () => {
    const initial = room({ status: "running", startedAt: 1000, me });
    const { rerender } = render(view(initial));
    fireEvent.click(screen.getByRole("button", { name: "Avanzar" }));
    fireEvent.click(screen.getByRole("button", { name: "Ejecutar programa" }));
    await waitFor(() => expect(mutate).toHaveBeenCalledWith("liveRooms:run", expect.objectContaining({
      token: "token", roomId: "r1", program: ["FORWARD"], requestId: expect.any(String),
    })));
    expect(screen.queryByText(/¡Laberinto resuelto!/)).toBeNull();
    rerender(view(room({ ...initial, me: { ...me, outcome: "GOAL", finishedAt: 2000, runs: 1 },
      participants: [{ studentId: me.studentId, displayName: "Cóndor", runs: 1, outcome: "GOAL", finishedAt: 2000, place: 1 }],
    })));
    expect(screen.getByText(/¡Laberinto resuelto! Llegaste en el puesto 1/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Ejecutar programa" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("el error del servidor conserva el programa para corregir o reintentar", async () => {
    mutate.mockRejectedValue(new ConvexError("La partida ya terminó."));
    render(view(room({ status: "running", me })));
    fireEvent.click(screen.getByRole("button", { name: "Avanzar" }));
    fireEvent.click(screen.getByRole("button", { name: "Ejecutar programa" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("La partida ya terminó."));
    expect(screen.getByRole("list", { name: "Tu programa" }).textContent).toContain("Avanzar");
  });

  it("en equipo envía la revisión y refleja cambios compartidos confirmados", async () => {
    const initial = room({ status: "running", mode: "cooperative", me });
    const { rerender } = render(view(initial));
    fireEvent.click(screen.getByRole("button", { name: "Avanzar" }));
    await waitFor(() => expect(mutate).toHaveBeenCalledWith("liveRooms:editShared", {
      token: "token", roomId: "r1", revision: 0, action: "append", command: "FORWARD",
    }));
    expect(screen.getByRole("list", { name: "Programa del equipo" }).textContent).not.toContain("Avanzar");
    rerender(view(room({ ...initial, shared: { ...initial.shared, program: ["FORWARD"], revision: 1 } })));
    expect(screen.getByRole("list", { name: "Programa del equipo" }).textContent).toContain("Avanzar");
    fireEvent.click(screen.getByRole("button", { name: "Ejecutar programa" }));
    await waitFor(() => expect(mutate).toHaveBeenCalledWith("liveRooms:run", expect.objectContaining({
      revision: 1, roomId: "r1", token: "token",
    })));
    const call = mutate.mock.calls.at(-1)![1] as Record<string, unknown>;
    expect(call).not.toHaveProperty("program");
  });

  it("un alumno sin inscribirse antes del inicio no puede entrar tarde", () => {
    render(view(room({ status: "running" })));
    expect(screen.queryByRole("button", { name: "Unirme a la partida" })).toBeNull();
    expect(screen.getByText(/Esta partida ya empezó/)).toBeTruthy();
  });

  it("el docente solo inicia con participantes y conserva resultados al cerrar", () => {
    const { rerender } = render(view(room(), null));
    expect((screen.getByRole("button", { name: "Iniciar partida" }) as HTMLButtonElement).disabled).toBe(true);
    rerender(view(room({ status: "closed" }), null));
    expect(screen.getByText("Partida finalizada")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Iniciar partida" })).toBeNull();
  });
});

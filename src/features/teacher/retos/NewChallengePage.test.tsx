// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { ConvexError } from "convex/values";
import { MISSIONS } from "@robolab/backend/domain/lab/mission";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../../../shared/ui/Toast";

const create = vi.fn();
const assign = vi.fn();
const classes = [{ _id: "c1", label: "Primaria · 5.º · Sección A", joinCode: "TEC-482", studentCount: 5, level: "primaria" }];
vi.mock("convex/react", () => ({
  useQuery: () => classes,
  useMutation: (ref: unknown) => (getFunctionName(ref as never).endsWith(":assign") ? assign : create),
}));

import { NewChallengePage } from "./NewChallengePage";

afterEach(() => {
  cleanup();
  create.mockReset();
  assign.mockReset();
});

function renderCreator() {
  render(
    <MemoryRouter>
      <ToastProvider>
        <NewChallengePage />
      </ToastProvider>
    </MemoryRouter>,
  );
}

const button = (name: RegExp) => screen.getByRole("button", { name }) as HTMLButtonElement;

describe("creador de retos (T3 → T4 → T6 → T7)", () => {
  it("no deja continuar hasta elegir tópico y nivel, ni usar un juego sin elegirlo", () => {
    renderCreator();
    expect(document.title).toBe("Nuevo reto · RoboLab");
    expect(screen.getByRole("listitem", { current: "step" }).textContent).toMatch(/Tópico y nivel/);
    expect(button(/continuar/i).disabled).toBe(true);

    fireEvent.click(button(/Tecnología/));
    expect(button(/continuar/i).disabled).toBe(true); // falta el nivel
    fireEvent.click(button(/^Inicial/));
    expect(button(/continuar/i).disabled).toBe(false);

    fireEvent.click(button(/continuar/i));
    expect(screen.getByRole("heading", { name: /elige un juego/i })).toBeTruthy();
    expect(screen.getByRole("listitem", { current: "step" }).textContent).toMatch(/Juego/);
    expect(button(/usar este juego/i).disabled).toBe(true);
    expect(create).not.toHaveBeenCalled();
  });

  it("al publicar muestra el enlace <origen>/reto/<id> y deja asignarlo a una clase", async () => {
    create.mockResolvedValue("asg-1");
    assign.mockResolvedValue("asg-1");
    renderCreator();
    fireEvent.click(button(/Tecnología/));
    fireEvent.click(button(/^Inicial/));
    fireEvent.click(button(/continuar/i));
    fireEvent.click(button(/El charquito/));
    fireEvent.click(button(/usar este juego/i));

    expect(create).not.toHaveBeenCalled(); // elegir el juego no publica nada todavía
    expect(screen.getByRole("listitem", { current: "step" }).textContent).toMatch(/Publicar/);
    expect((screen.getByLabelText(/^Público/) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(button(/publicar reto/i));

    await waitFor(() => expect(create).toHaveBeenCalledWith({ challengeId: "inicial-charquito", visibility: "public" }));
    expect(screen.getByRole("heading", { name: /tu reto está publicado/i })).toBeTruthy();
    const link = screen.getByRole("link", { name: "localhost:3000/reto/inicial-charquito" }) as HTMLAnchorElement;
    expect(link.href).toBe("http://localhost:3000/reto/inicial-charquito");
    expect((screen.getByRole("link", { name: /ver mi reto/i }) as HTMLAnchorElement).getAttribute("href")).toBe("/reto/inicial-charquito");

    fireEvent.click(button(/asignar a una clase/i));
    fireEvent.change(screen.getByLabelText(/^Clase$/), { target: { value: "c1" } });
    fireEvent.click(button(/^asignar$/i));
    await waitFor(() => expect(assign).toHaveBeenCalledWith({ assignmentId: "asg-1", classroomId: "c1" }));
    expect((screen.getByRole("link", { name: /ver en primaria/i }) as HTMLAnchorElement).getAttribute("href")).toBe("/docente/clases/c1/retos");
  });

  it("«Solo mi clase» pide la clase antes de publicar y la manda al crear", async () => {
    create.mockResolvedValue("asg-2");
    renderCreator();
    fireEvent.click(button(/Tecnología/));
    fireEvent.click(button(/^Inicial/));
    fireEvent.click(button(/continuar/i));
    fireEvent.click(button(/Primer paseo/));
    fireEvent.click(button(/usar este juego/i));

    fireEvent.click(screen.getByLabelText(/solo mi clase/i));
    expect(button(/publicar reto/i).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/a qué clase/i), { target: { value: "c1" } });
    expect(button(/publicar reto/i).disabled).toBe(false);
    fireEvent.click(button(/publicar reto/i));
    await waitFor(() => expect(create).toHaveBeenCalledWith({ challengeId: "inicial-paseo", visibility: "class", classroomId: "c1" }));
    // Ya quedó en su clase: no hace falta volver a asignarlo.
    expect(screen.queryByRole("button", { name: /asignar a una clase/i })).toBeNull();
  });

  it("en Inicial muestra retos de bloques con su tablero; en Primaria, misiones con su miniatura 6 × 6", () => {
    const mission = MISSIONS.find((m) => m.topic === "ciencia")!;
    renderCreator();
    fireEvent.click(button(/Tecnología/));
    fireEvent.click(button(/^Inicial/));
    fireEvent.click(button(/continuar/i));
    const blocks = within(screen.getByRole("group", { name: "Juego" }));
    expect(blocks.getByRole("button", { name: /El charquito/ })).toBeTruthy();
    expect(screen.queryByRole("img", { name: /Misión de 6 por 6/ })).toBeNull();
    expect(document.querySelector(".game-thumb .board")).not.toBeNull();

    fireEvent.click(button(/volver/i));
    fireEvent.click(button(/Ciencia/));
    fireEvent.click(button(/^Primaria/));
    fireEvent.click(button(/continuar/i));
    const missions = within(screen.getByRole("group", { name: "Juego" }));
    expect(missions.getByRole("button", { name: new RegExp(mission.title) })).toBeTruthy();
    expect(missions.getAllByRole("img", { name: /Misión de 6 por 6/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Misión · \d estaciones?/).length).toBeGreaterThan(0);
  });

  it("al volver conserva lo elegido, y los pasos hechos quedan marcados", () => {
    renderCreator();
    fireEvent.click(button(/Tecnología/));
    fireEvent.click(button(/^Inicial/));
    fireEvent.click(button(/continuar/i));
    fireEvent.click(button(/El charquito/));
    fireEvent.click(button(/usar este juego/i));
    const done = screen.getAllByText("Hecho:", { exact: false }).map((mark) => mark.closest("li")?.textContent);
    expect(done).toHaveLength(2);
    expect(done[0]).toMatch(/Tópico y nivel/);
    expect(done[1]).toMatch(/Juego/);

    fireEvent.click(button(/volver/i));
    expect((button(/El charquito/)).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(button(/volver/i));
    expect(button(/Tecnología/).getAttribute("aria-pressed")).toBe("true");
    expect(button(/^Inicial/).getAttribute("aria-pressed")).toBe("true");
  });

  it("como borrador no se asigna a ninguna clase hasta que el docente lo decida, y lo dice", async () => {
    create.mockResolvedValue("asg-3");
    renderCreator();
    fireEvent.click(button(/Tecnología/));
    fireEvent.click(button(/^Inicial/));
    fireEvent.click(button(/continuar/i));
    fireEvent.click(button(/El charquito/));
    fireEvent.click(button(/usar este juego/i));
    fireEvent.click(screen.getByLabelText(/borrador/i));
    fireEvent.click(button(/guardar borrador/i));
    await waitFor(() => expect(create).toHaveBeenCalledWith({ challengeId: "inicial-charquito", visibility: "draft" }));
    expect(screen.getByRole("heading", { name: /tu borrador está guardado/i })).toBeTruthy();
    expect(screen.getByText(/tus alumnos no lo ven en su clase/i)).toBeTruthy();
  });

  it("si el servidor rechaza el reto, muestra la alerta y deja intentarlo de nuevo", async () => {
    create.mockRejectedValue(new ConvexError("Ese reto ya está en la clase."));
    renderCreator();
    fireEvent.click(button(/Tecnología/));
    fireEvent.click(button(/^Inicial/));
    fireEvent.click(button(/continuar/i));
    fireEvent.click(button(/El charquito/));
    fireEvent.click(button(/usar este juego/i));
    fireEvent.click(button(/publicar reto/i));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Ese reto ya está en la clase."));
    expect(button(/publicar reto/i).disabled).toBe(false);
  });

  it("«Crear otro» vuelve al primer paso con todo en blanco", async () => {
    create.mockResolvedValue("asg-4");
    renderCreator();
    fireEvent.click(button(/Tecnología/));
    fireEvent.click(button(/^Inicial/));
    fireEvent.click(button(/continuar/i));
    fireEvent.click(button(/El charquito/));
    fireEvent.click(button(/usar este juego/i));
    fireEvent.click(button(/publicar reto/i));
    await waitFor(() => expect(screen.getByRole("heading", { name: /tu reto está publicado/i })).toBeTruthy());
    fireEvent.click(button(/crear otro/i));
    expect(screen.getByRole("listitem", { current: "step" }).textContent).toMatch(/Tópico y nivel/);
    expect(button(/continuar/i).disabled).toBe(true);
    expect(button(/Tecnología/).getAttribute("aria-pressed")).toBe("false");
  });
});

// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { TOPICS } from "@robolab/backend/domain/explore/challenges";
import { saveSolved } from "../explore/testProgress";
import { Landing } from "./Landing";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const renderLanding = () =>
  render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>,
  );

/** La tarjeta de un tópico: el enlace de la cuadrícula cuyo nombre es ese tópico. */
const card = (name: string) => screen.getByText(name, { selector: ".topic-card > strong" }).closest("a") as HTMLElement;

describe("portada: tarjetas de tópico con su avance", () => {
  it("sin avance cada tópico muestra 0 de todo lo que tiene (retos de Inicial y misiones de Primaria)", () => {
    renderLanding();
    expect(TOPICS.every((t) => t.available)).toBe(true);
    const totals = { Ciencia: 12, Tecnología: 12, Ingeniería: 10, Artes: 9, Matemáticas: 11 };
    for (const [name, total] of Object.entries(totals)) {
      const link = card(name);
      expect(within(link).getByText(`0/${total} ✓`), name).toBeTruthy();
      expect(within(link).getByText(`0 de ${total} retos resueltos`), name).toBeTruthy();
    }
  });

  it("cuenta juntos los retos de bloques y las misiones resueltos en este dispositivo", () => {
    saveSolved("inicial-ciencia-probeta", "inicial-ciencia-lupa", "primaria-ciencia-huerto", "inicial-paseo");
    renderLanding();
    expect(within(card("Ciencia")).getByText("3/12 ✓")).toBeTruthy();
    expect(within(card("Tecnología")).getByText("1/12 ✓")).toBeTruthy();
    expect(within(card("Artes")).getByText("0/9 ✓")).toBeTruthy();
  });

  it("un reto de bloques de Primaria que ya no se lista no suma al avance", () => {
    saveSolved("primaria-casa");
    renderLanding();
    expect(within(card("Tecnología")).getByText("0/12 ✓")).toBeTruthy();
  });

  it("cada tarjeta enlaza a su tópico y muestra su tagline", () => {
    renderLanding();
    expect(card("Ciencia").getAttribute("href")).toBe("/explorar/ciencia");
    expect(card("Matemáticas").getAttribute("href")).toBe("/explorar/matematicas");
    expect(within(card("Ciencia")).getByText("Explora el laboratorio.")).toBeTruthy();
    expect(within(card("Tecnología")).getByText("Programa al robot.")).toBeTruthy();
    expect(within(card("Ingeniería")).getByText("Construye en el taller.")).toBeTruthy();
    expect(within(card("Artes")).getByText("Recorre la galería.")).toBeTruthy();
    expect(within(card("Matemáticas")).getByText("Cuenta los pasos.")).toBeTruthy();
  });

  it("marca la tarjeta como completa cuando se resolvió todo el tópico", () => {
    saveSolved(
      "inicial-ciencia-probeta",
      "inicial-ciencia-lupa",
      "inicial-ciencia-derrame",
      "inicial-ciencia-muestras",
      "inicial-ciencia-donde",
      "inicial-ciencia-arregla",
      "primaria-ciencia-hormigas",
      "primaria-ciencia-rocas",
      "primaria-ciencia-telescopio",
      "primaria-ciencia-huerto",
      "primaria-ciencia-lluvia",
      "primaria-ciencia-imanes",
    );
    renderLanding();
    const chip = within(card("Ciencia")).getByText("12/12 ✓").closest(".progress-chip");
    expect(chip?.hasAttribute("data-complete")).toBe(true);
    expect(within(card("Artes")).getByText("0/9 ✓").closest(".progress-chip")?.hasAttribute("data-complete")).toBe(false);
  });
});

describe("portada: entradas", () => {
  it("ya no ofrece el Laboratorio multigrado", () => {
    renderLanding();
    expect(screen.queryByText("Laboratorio multigrado")).toBeNull();
    expect(screen.queryByRole("link", { name: /Ver misiones/ })).toBeNull();
    expect(document.querySelector('a[href="/laboratorio"]')).toBeNull();
  });

  it("deja la entrada de alumnos con código y la de docentes, que habla de retos", () => {
    renderLanding();
    const join = screen.getAllByRole("link", { name: /Unirme a una clase/ });
    expect(join.length).toBeGreaterThan(0);
    expect(join.every((l) => l.getAttribute("href") === "/alumno")).toBe(true);
    expect(screen.getByRole("link", { name: /Iniciar sesión/ }).getAttribute("href")).toBe("/docente");
    expect(screen.getByText("Crea retos para tu clase y sigue cómo aprende cada alumno.")).toBeTruthy();
    expect(screen.queryByText(/evaluaciones/i)).toBeNull();
  });
});

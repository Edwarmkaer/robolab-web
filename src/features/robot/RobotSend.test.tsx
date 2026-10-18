// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { move } from "@robolab/backend/domain/game/program";
import { ToastProvider } from "../../shared/ui/Toast";

/** `robot.status` del servidor: lo decide cada prueba. */
const status = vi.fn();
vi.mock("convex/react", () => ({
  useQuery: (_fn: unknown, args: unknown) => (args === "skip" ? undefined : status(args)),
  useMutation: () => vi.fn(),
}));

import { RobotSend } from "./RobotSend";
import { useRobotLink } from "./useRobotLink";

const NOW = Date.UTC(2026, 9, 17, 20, 0);
const ROBOT_KEY = "robolab.robot";

function Linked({ program }: { program: readonly ReturnType<typeof move>[] }) {
  const robot = useRobotLink();
  return <RobotSend robot={robot} program={program} disabled={false} />;
}

function Harness({ program = [move("FORWARD")] }: { program?: readonly ReturnType<typeof move>[] }) {
  return (
    <ToastProvider>
      <Linked program={program} />
    </ToastProvider>
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval", "setTimeout", "clearTimeout"] });
  vi.setSystemTime(NOW);
  window.localStorage.removeItem(ROBOT_KEY);
  status.mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("sincronizar con robot (wifi)", () => {
  it("sin robot vinculado: el botón dice Robot y la hoja explica los tres pasos con el chip 'Robot sin conectar'", () => {
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: /Robot/ });
    expect(trigger.textContent).toContain("Robot");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(trigger);
    const sheet = screen.getByRole("dialog", { name: "Sincronizar con robot" });
    expect(sheet.tagName).toBe("DIALOG");
    const steps = within(sheet).getAllByRole("listitem").map((li) => li.textContent);
    expect(steps).toEqual(["1Enciende el robot", "2Mira su código en la pantalla o en el monitor", "3Escríbelo aquí"]);
    expect(within(sheet).getByRole("status").textContent).toBe("Robot sin conectar");
    expect(within(sheet).getByLabelText("Código del robot")).toBeTruthy();
    // Por wifi no hay lista de dispositivos que elegir.
    expect(within(sheet).queryByRole("list", { name: /dispositivos/i })).toBeNull();
    expect(within(sheet).getByRole("button", { name: "Conectar" })).toBeTruthy();
  });

  it("con un código guardado y el servidor sin responder todavía: 'Buscando robot…'", () => {
    window.localStorage.setItem(ROBOT_KEY, "K7Q4MZ");
    status.mockReturnValue(undefined);
    render(<Harness />);
    expect(screen.getByRole("button", { name: /Buscando/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Buscando/ }));
    expect(within(screen.getByRole("dialog")).getByRole("status").textContent).toBe("Buscando robot…");
  });

  it("si el robot dio señal hace poco: 'Robot conectado', botón Robot OK y se puede enviar la secuencia", () => {
    window.localStorage.setItem(ROBOT_KEY, "K7Q4MZ");
    status.mockReturnValue({ name: "Kusi-12", lastSeenAt: NOW - 1000, codeExpiresAt: NOW + 3_600_000, lastCommand: null });
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /Robot OK/ }));
    const sheet = screen.getByRole("dialog");
    expect(within(sheet).getByRole("status").textContent).toBe("Robot conectado");
    expect(within(sheet).getByText("Kusi-12")).toBeTruthy();
    expect((within(sheet).getByRole("button", { name: "Enviar al robot" }) as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(within(sheet).getByRole("button", { name: "Robot OK" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("si el robot lleva más de 10 s sin dar señal vuelve a 'Robot sin conectar' y explica qué revisar", () => {
    window.localStorage.setItem(ROBOT_KEY, "K7Q4MZ");
    status.mockReturnValue({ name: "Kusi-12", lastSeenAt: NOW - 60_000, codeExpiresAt: NOW + 3_600_000, lastCommand: null });
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /Robot/ }));
    const sheet = screen.getByRole("dialog");
    expect(within(sheet).getByRole("status").textContent).toBe("Robot sin conectar");
    expect(within(sheet).getByText(/encendido y con wifi/)).toBeTruthy();
    expect((within(sheet).getByRole("button", { name: "Enviar al robot" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { formatClock } from "./format";

describe("formatClock (tiempo de '¡Reto logrado!')", () => {
  it("escribe minutos y segundos con dos cifras de segundos", () => {
    expect(formatClock(192_000)).toBe("3:12");
    expect(formatClock(42_000)).toBe("0:42");
    expect(formatClock(65_000)).toBe("1:05");
  });

  it("redondea al segundo más cercano y no pasa de 59 segundos", () => {
    expect(formatClock(59_600)).toBe("1:00");
    expect(formatClock(1_400)).toBe("0:01");
  });

  it("un tiempo negativo o vacío es 0:00, no un número raro", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(-5_000)).toBe("0:00");
  });

  it("más de una hora sigue contando minutos", () => {
    expect(formatClock(3_725_000)).toBe("62:05");
  });
});

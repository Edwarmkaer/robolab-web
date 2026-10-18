import { describe, expect, it } from "vitest";
import { clock } from "./format";

describe("clock (tiempo de '¡Reto logrado!')", () => {
  it("escribe minutos y segundos con dos cifras de segundos", () => {
    expect(clock(192_000)).toBe("3:12");
    expect(clock(42_000)).toBe("0:42");
    expect(clock(65_000)).toBe("1:05");
  });

  it("redondea al segundo más cercano y no pasa de 59 segundos", () => {
    expect(clock(59_600)).toBe("1:00");
    expect(clock(1_400)).toBe("0:01");
  });

  it("un tiempo negativo o vacío es 0:00, no un número raro", () => {
    expect(clock(0)).toBe("0:00");
    expect(clock(-5_000)).toBe("0:00");
  });

  it("más de una hora sigue contando minutos", () => {
    expect(clock(3_725_000)).toBe("62:05");
  });
});

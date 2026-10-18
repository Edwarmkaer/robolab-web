import { vi } from "vitest";

/** Solo para pruebas. jsdom no trae `matchMedia`: simula un celular (≤ 640 px) o una pantalla ancha. */
export function pretendViewport(mobile: boolean): void {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: mobile,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

/** Quita el simulacro: las demás pruebas vuelven al comportamiento sin `matchMedia` (pantalla ancha). */
export function resetViewport(): void {
  Reflect.deleteProperty(window, "matchMedia");
}

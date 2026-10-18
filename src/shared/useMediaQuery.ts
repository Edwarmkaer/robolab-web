import { useCallback, useSyncExternalStore } from "react";

/** Pantalla angosta: celulares en vertical. Mismo corte que las reglas `@media` de los estilos. */
export const MOBILE_QUERY = "(max-width: 640px)";

/**
 * ¿Se cumple la consulta de medios ahora? Se actualiza al girar el celular o
 * cambiar el ancho. Donde no existe `matchMedia` (pruebas, navegadores viejos)
 * responde `false`, es decir, la versión de escritorio.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window.matchMedia !== "function") return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  const snapshot = useCallback(() => (typeof window.matchMedia === "function" ? window.matchMedia(query).matches : false), [query]);
  return useSyncExternalStore(subscribe, snapshot, () => false);
}

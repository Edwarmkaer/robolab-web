import { useCallback } from "react";

/**
 * Lleva el foco a un elemento apenas aparece (el título de una etapa o fase
 * nueva). Sin esto, al cambiar de pantalla el foco cae a <body> y el lector
 * de pantalla no anuncia nada. El elemento necesita `tabIndex={-1}`.
 */
export function useFocusOnMount<T extends HTMLElement>() {
  return useCallback((el: T | null) => {
    el?.focus({ preventScroll: true });
  }, []);
}

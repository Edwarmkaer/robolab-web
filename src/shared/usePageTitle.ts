import { useEffect } from "react";
import { APP_NAME } from "./brand";

/** Título de la pestaña: "Página · RoboLab". Sin título, solo el nombre de la app. */
export const pageTitle = (title?: string): string => (title?.trim() ? `${title.trim()} · ${APP_NAME}` : APP_NAME);

/**
 * Cada pantalla pone su nombre en la pestaña del navegador: el historial, las
 * pestañas abiertas y el lector de pantalla dejan de decir solo "RoboLab".
 */
export function usePageTitle(title?: string): void {
  useEffect(() => {
    document.title = pageTitle(title);
  }, [title]);
}

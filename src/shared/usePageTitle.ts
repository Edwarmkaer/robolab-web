import { useEffect } from "react";
import { APP_NAME } from "./brand";

/** Título de la pestaña: "Mis clases · RoboLab". Al salir de la página vuelve el anterior. */
export function usePageTitle(title: string | undefined) {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = `${title} · ${APP_NAME}`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

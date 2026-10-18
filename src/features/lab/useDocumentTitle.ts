import { useEffect } from "react";
import { APP_NAME } from "../../shared/brand";

/** Título de la pestaña mientras la página está montada; al salir vuelve el anterior. */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · ${APP_NAME}`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

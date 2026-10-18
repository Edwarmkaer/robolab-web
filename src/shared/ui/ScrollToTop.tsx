import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Al ir a otra página, la nueva empieza arriba: sin esto se queda donde estaba
 * la anterior (a mitad de pantalla en el celular). Al volver atrás (POP) se
 * respeta la posición que recuerda el navegador.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();
  const type = useNavigationType();
  useEffect(() => {
    if (type !== "POP") window.scrollTo(0, 0);
  }, [pathname, type]);
  return null;
}

import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ErrorBoundary } from "../../../shared/ui/ErrorBoundary";
import { Icon } from "../../../shared/ui/Icon";

/**
 * Una clase o un reto que ya no existe (o que no es del docente): el servidor
 * lo dice al consultar y la consulta lanza al pintar. Aquí se convierte en un
 * mensaje claro con salida a «Mis clases», en vez de la pantalla de error de
 * toda la aplicación. Quien lo usa pone `key` con el id para que cambiar de
 * clase vuelva a intentar.
 */
export function NotFoundBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={(message) => (
        <div className="empty">
          <Icon name="alert" size={32} />
          <p role="alert">{message}</p>
          <Link className="btn" to="/docente/clases">
            Volver a mis clases
          </Link>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

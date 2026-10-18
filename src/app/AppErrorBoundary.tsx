import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ErrorBoundary } from "../shared/ui/ErrorBoundary";

/**
 * Última red de toda la app. Una consulta que falla al renderizar (sesión
 * vencida, enlace a algo que no existe o no es tuyo) muestra un mensaje y una
 * salida, nunca una pantalla en blanco. Cambiar de página la reinicia.
 */
export function AppErrorBoundary({ children }: { readonly children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary key={pathname} fallback={(message, reset) => <ErrorScreen message={message} reset={reset} />}>
      {children}
    </ErrorBoundary>
  );
}

function ErrorScreen({ message, reset }: { readonly message: string; readonly reset: () => void }) {
  const navigate = useNavigate();
  return (
    <main className="hero">
      <div className="card stack" style={{ textAlign: "center", maxWidth: 480 }}>
        <h1 style={{ margin: 0 }}>Algo salió mal</h1>
        <p className="alert alert-error" role="alert">
          {message}
        </p>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => {
            reset();
            navigate("/");
          }}
        >
          Volver al inicio
        </button>
      </div>
    </main>
  );
}

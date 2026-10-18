import { Navigate, Route, Routes } from "react-router-dom";
import { StudentLivePage, StudentLiveRoom } from "../live/StudentLivePage";
import { ErrorBoundary } from "../../shared/ui/ErrorBoundary";
import { JoinClass } from "./JoinClass";
import { StudentHome } from "./StudentHome";
import { StudentLogin } from "./StudentLogin";
import { useStudentToken } from "./session";

export function StudentApp() {
  const [token, setToken] = useStudentToken();

  if (!token) {
    return (
      <Routes>
        <Route index element={<JoinClass onJoined={setToken} />} />
        {/* Las tarjetas con código por alumno de la fase 1 siguen entrando por aquí. */}
        <Route path="codigo" element={<StudentLogin onSignedIn={setToken} />} />
        {/* Sin sesión, un enlace viejo a un juego lleva a "Únete a tu clase"; al unirse, ya está en la portada. */}
        <Route path="*" element={<Navigate to="/alumno" replace />} />
      </Routes>
    );
  }

  return (
    <ErrorBoundary
      fallback={(message, reset) => (
        <main className="hero kid">
          <div className="card stack" style={{ textAlign: "center", maxWidth: 480 }}>
            <p className="alert alert-error" role="alert">
              {message}
            </p>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                setToken(null);
                reset();
              }}
            >
              Volver a unirme a mi clase
            </button>
          </div>
        </main>
      )}
    >
      <Routes>
        <Route path="en-vivo" element={<StudentLivePage token={token} />} />
        <Route path="en-vivo/:roomId" element={<StudentLiveRoom token={token} />} />
        <Route index element={<StudentHome token={token} onSignOut={() => setToken(null)} />} />
        <Route path="*" element={<Navigate to="/alumno" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

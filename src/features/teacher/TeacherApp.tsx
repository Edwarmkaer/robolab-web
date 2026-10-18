import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { api } from "@robolab/backend/convex/_generated/api";
import { APP_NAME } from "../../shared/brand";
import { type IconName, Icon } from "../../shared/ui/Icon";
import { ErrorBoundary } from "../../shared/ui/ErrorBoundary";
import { IconButton } from "../../shared/ui/IconButton";
import { useToast } from "../../shared/ui/Toast";
import { LabCreatePage } from "../lab/LabCreatePage";
import { LabResultsPage } from "../lab/LabResultsPage";
import { TeacherAuth } from "./auth/TeacherAuth";
import { ClassDetailPage } from "./classes/ClassDetailPage";
import { ClassesPage } from "./classes/ClassesPage";
import { HomePage } from "./home/HomePage";
import { ProgressPage } from "./progress/ProgressPage";
import { LegacyResultsRedirect } from "./retos/LegacyRoutes";
import { NewChallengePage } from "./retos/NewChallengePage";
import { RetoDetailPage } from "./retos/RetoDetailPage";
import { RetosPage } from "./retos/RetosPage";
import "./teacher.css";

const TABS: readonly { to: string; label: string; icon: IconName; end: boolean }[] = [
  { to: "/docente", label: "Inicio", icon: "home", end: true },
  { to: "/docente/clases", label: "Mis clases", icon: "users", end: false },
  { to: "/docente/retos", label: "Retos", icon: "clipboard", end: false },
  { to: "/docente/progreso", label: "Progreso", icon: "chart", end: false },
];

function TeacherShell() {
  const { signOut } = useAuthActions();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const toast = useToast();
  const me = useQuery(api.users.me);
  const initial = me?.name.trim().charAt(0).toUpperCase() ?? "";

  return (
    <div className="has-bottom-nav">
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" to="/docente">
            {APP_NAME}
          </Link>
          <div className="user-chip">
            {me && (
              <>
                <span className="avatar" aria-hidden="true">
                  {initial}
                </span>
                <span className="user-name small" title={me.email}>
                  {me.name}
                </span>
              </>
            )}
            <IconButton
              icon="logOut"
              label="Cerrar sesión"
              // Al salir vuelve a la portada, donde se elige "Soy alumno" o "Soy docente".
              onClick={() =>
                void signOut()
                  .then(() => navigate("/"))
                  .catch(() => toast("No pudimos cerrar la sesión. Intenta de nuevo.", { tone: "error" }))
              }
            />
          </div>
        </div>
      </header>
      <div className="page">
        <nav className="tabs" aria-label="Secciones del docente">
          {TABS.map((tab) => (
            <NavLink key={tab.to} to={tab.to} end={tab.end} className="tab">
              <Icon name={tab.icon} />
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <main>
          {/* Si una pantalla no carga, la barra y las pestañas siguen; cambiar de pestaña lo reinicia. */}
          <ErrorBoundary
            key={pathname}
            fallback={(message, reset) => (
              <div className="empty">
                <Icon name="alert" size={32} />
                <p>No pudimos cargar esta pantalla.</p>
                <p className="small" role="alert">
                  {message}
                </p>
                <div className="row">
                  <button type="button" className="btn btn-primary" onClick={reset}>
                    Reintentar
                  </button>
                  <Link className="btn" to="/docente">
                    Ir al inicio
                  </Link>
                </div>
              </div>
            )}
          >
            <Routes>
              <Route index element={<HomePage />} />
              <Route path="clases" element={<ClassesPage />} />
              <Route path="clases/nueva" element={<ClassesPage creating />} />
              <Route path="clases/:classroomId" element={<ClassDetailPage tab="students" />} />
              <Route path="clases/:classroomId/retos" element={<ClassDetailPage tab="challenges" />} />
              <Route path="clases/:classroomId/retos/:assignmentId" element={<LegacyResultsRedirect />} />
              <Route path="retos" element={<RetosPage />} />
              <Route path="retos/nuevo" element={<NewChallengePage />} />
              <Route path="retos/:assignmentId" element={<RetoDetailPage />} />
              <Route path="evaluaciones/*" element={<Navigate to="/docente/retos" replace />} />
              <Route path="progreso" element={<ProgressPage />} />
              <Route path="laboratorio/nueva" element={<LabCreatePage />} />
              <Route path="laboratorio/:missionId/resultados" element={<LabResultsPage />} />
              <Route path="*" element={<Navigate to="/docente" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export function TeacherApp() {
  return (
    <>
      <AuthLoading>
        <p className="page muted">Cargando…</p>
      </AuthLoading>
      <Unauthenticated>
        <TeacherAuth />
      </Unauthenticated>
      <Authenticated>
        <TeacherShell />
      </Authenticated>
    </>
  );
}

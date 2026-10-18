import { Navigate, useParams } from "react-router-dom";

/** Los enlaces guardados a los resultados de un reto dentro de la clase abren su detalle en Retos. */
export function LegacyResultsRedirect() {
  const { assignmentId = "" } = useParams();
  return <Navigate to={`/docente/retos/${assignmentId}`} replace />;
}

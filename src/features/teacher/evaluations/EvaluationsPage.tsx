import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "@robolab/backend/convex/_generated/api";
import { localCalendarDate, shortLabel } from "@robolab/backend/domain/evaluation/calendar";
import { Icon } from "../../../shared/ui/Icon";
import { MOBILE_QUERY, useMediaQuery } from "../../../shared/useMediaQuery";
import "./evaluations.css";

export function EvaluationsPage() {
  const evaluations = useQuery(api.evaluations.listMine);
  const today = localCalendarDate();
  // En el celular la tabla se recortaba y partía la columna Clase palabra por palabra: van tarjetas.
  const mobile = useMediaQuery(MOBILE_QUERY);

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Evaluaciones</h1>
        <Link className="btn btn-primary" to="/docente/evaluaciones/nueva">
          <Icon name="plus" /> Nueva evaluación
        </Link>
      </div>
      {evaluations === undefined ? (
        <p className="muted">Cargando…</p>
      ) : evaluations.length === 0 ? (
        <div className="empty">
          <Icon name="clipboard" size={32} />
          <p>Aún no creaste evaluaciones. Cada pregunta aparece cuando el robot llega a una estrella.</p>
          <Link className="btn btn-primary" to="/docente/evaluaciones/nueva">
            <Icon name="plus" /> Crear la primera
          </Link>
        </div>
      ) : mobile ? (
        <ul className="eval-cards" aria-label="Evaluaciones">
          {evaluations.map((e) => (
            <li key={e._id}>
              <Link className="card card-link eval-card" to={`/docente/evaluaciones/${e._id}`}>
                <span className="row spread">
                  <strong>{e.title}</strong>
                  {e.scheduledDate === today && <span className="badge">Hoy</span>}
                </span>
                <span className="muted small">{e.classroomLabel}</span>
                <span className="eval-meta small">
                  <span>{shortLabel(e.scheduledDate)}</span>
                  <span>
                    {e.questionCount} {e.questionCount === 1 ? "pregunta" : "preguntas"}
                  </span>
                  <span>
                    {e.finishedCount} de {e.studentCount} terminaron
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Día</th>
                <th>Título</th>
                <th>Clase</th>
                <th>Preguntas</th>
                <th>Terminaron</th>
                <th>
                  <span className="sr-only">Ver</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((e) => (
                <tr key={e._id}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {shortLabel(e.scheduledDate)} {e.scheduledDate === today && <span className="badge">Hoy</span>}
                  </td>
                  <td>
                    <Link className="row-link" to={`/docente/evaluaciones/${e._id}`}>
                      {e.title}
                    </Link>
                  </td>
                  <td className="small">{e.classroomLabel}</td>
                  <td>{e.questionCount}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {e.finishedCount} de {e.studentCount}
                  </td>
                  <td style={{ width: 48, textAlign: "right" }}>
                    <Link
                      className="icon-btn"
                      to={`/docente/evaluaciones/${e._id}`}
                      aria-label={`Ver resultados de ${e.title}`}
                      data-tooltip="Ver resultados"
                    >
                      <Icon name="eye" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useQuery } from "convex/react";
import { Link, useParams } from "react-router-dom";
import { api } from "@robolab/backend/convex/_generated/api";
import type { Id } from "@robolab/backend/convex/_generated/dataModel";
import { topicInfo } from "@robolab/backend/domain/explore/challenges";
import { clock, decimal } from "../../../shared/format";
import { Icon } from "../../../shared/ui/Icon";
import { usePageTitle } from "../../../shared/usePageTitle";
import { LEVEL_INFO } from "../../explore/ExploreLayout";
import { NotFoundBoundary } from "./NotFoundBoundary";
import { StatusBadge } from "./status";
import "./classes.css";

/** Resultados de un reto en una clase (T9): cifras, tabla por apodo y lo que se observó. */
export function ResultsPage() {
  const { classroomId = "", assignmentId = "" } = useParams();
  return (
    <NotFoundBoundary key={assignmentId}>
      <Results classroomId={classroomId} assignmentId={assignmentId} />
    </NotFoundBoundary>
  );
}

function Results({ classroomId, assignmentId }: { classroomId: string; assignmentId: string }) {
  const results = useQuery(api.assignments.results, { assignmentId: assignmentId as Id<"assignments"> });
  usePageTitle(results ? `Resultados: ${results.title}` : undefined);

  if (results === undefined) return <p className="muted">Cargando…</p>;

  const topic = topicInfo(results.topic);
  const { observed } = results;
  // Sin partidas, el servidor no inventa promedios (null): se muestra una raya.
  const average = (value: number | null, format: (n: number) => string) => (value === null ? "—" : format(value));

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div>
        <Link className="link-btn" to={`/docente/clases/${classroomId}/retos`}>
          <Icon name="arrowLeft" size={18} /> Retos de la clase
        </Link>
      </div>
      <div className="row" style={{ gap: 14 }}>
        <h2 className="class-title">
          {results.title} · Clase {results.classroomLabel}
        </h2>
        <span className="badge">
          {topic?.emoji} {topic?.name ?? results.topic} · {LEVEL_INFO[results.level].name}
        </span>
      </div>

      <div className="results-stats" aria-label="Resumen">
        <div className="card result-stat">
          <strong>{results.solvedPercent}%</strong>
          <span className="small muted">lo lograron</span>
        </div>
        <div className="card result-stat">
          <strong>{average(results.avgTries, decimal)}</strong>
          <span className="small muted">intentos promedio</span>
        </div>
        <div className="card result-stat">
          <strong>{average(results.avgHints, decimal)}</strong>
          <span className="small muted">pistas promedio</span>
        </div>
        <div className="card result-stat">
          <strong>{average(results.avgMs, clock)}</strong>
          <span className="small muted">tiempo promedio</span>
        </div>
      </div>

      <div className="results-grid">
        <div className="card table-wrap">
          {results.rows.length === 0 ? (
            <div className="empty">
              <Icon name="users" size={32} />
              <p>Todavía nadie se unió a esta clase.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Apodo</th>
                  <th>Intentos</th>
                  <th>Pistas</th>
                  <th>Tiempo</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {results.rows.map((r) => {
                  const idle = r.status === "not_started";
                  return (
                    <tr key={r.studentId}>
                      <td>
                        <strong>{r.displayName}</strong>
                      </td>
                      <td>{idle ? <span className="muted">—</span> : r.tries}</td>
                      <td>{idle ? <span className="muted">—</span> : r.hints}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{idle ? <span className="muted">—</span> : clock(r.ms)}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <aside className="card stack observed" aria-labelledby="observed-title">
          <h3 id="observed-title" style={{ margin: 0 }}>
            Qué se observó
          </h3>
          <div className="observed-box" data-tone="hints">
            <strong>Pistas</strong>
            <span className="small">
              {observed.hintsTotal === 0
                ? "Todavía nadie jugó este reto."
                : `${observed.hintsUsed} de ${observed.hintsTotal} usaron al menos una pista.`}
            </span>
          </div>
          <div className="observed-box" data-tone="fix">
            <strong>Corrección</strong>
            <span className="small">
              {observed.correctedTotal === 0
                ? "Nadie falló el primer intento."
                : `${observed.correctedAlone} de ${observed.correctedTotal} corrigieron solos, sin pistas, tras fallar el primer intento.`}
            </span>
          </div>
          <p className="small muted">Solo mostramos lo observable. No diagnosticamos.</p>
        </aside>
      </div>
    </div>
  );
}

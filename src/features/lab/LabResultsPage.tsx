import { useQuery } from "convex/react";
import { Link, useParams } from "react-router-dom";
import { api } from "@robolab/backend/convex/_generated/api";
import type { Id } from "@robolab/backend/convex/_generated/dataModel";
import { Icon } from "../../shared/ui/Icon";
import { useDocumentTitle } from "./useDocumentTitle";
import "./lab.css";

const SHOWN = 12;
const when = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** /docente/laboratorio/:missionId/resultados: indicadores observables de una misión. */
export function LabResultsPage() {
  const { missionId = "" } = useParams();
  const data = useQuery(api.lab.results, { missionId: missionId as Id<"labMissions"> });
  useDocumentTitle(data ? `Resultados · ${data.title}` : "Resultados de la misión");

  if (data === undefined) return <p className="muted">Cargando…</p>;

  function exportJson() {
    const blob = new Blob([JSON.stringify({ title: data!.title, plays: data!.plays, completed: data!.completed, hints: data!.hints, levels: data!.levels, attempts: data!.recent }, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "robolab-intentos.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="stack">
      <div>
        <Link className="link-btn" to="/docente/laboratorio/nueva">
          <Icon name="arrowLeft" size={18} /> Crear misión
        </Link>
      </div>
      <div className="page-head">
        <div>
          <h2>Resumen de actividad</h2>
          <p className="muted">
            {data.title} · Indicadores observables; no estimamos aprendizaje ni habilidad latente.
          </p>
        </div>
        <button className="btn" type="button" onClick={exportJson} disabled={data.plays === 0}>
          <Icon name="arrowDown" /> Exportar JSON
        </button>
      </div>

      <div className="lab-kpis">
        <div className="impact-stat">
          <strong>{data.plays}</strong>
          <span>Ejecuciones registradas</span>
        </div>
        <div className="impact-stat">
          <strong>{data.completed}</strong>
          <span>Misiones completadas</span>
        </div>
        <div className="impact-stat">
          <strong>{data.hints}</strong>
          <span>Pistas solicitadas</span>
        </div>
      </div>

      <div className="two-col">
        <section className="card stack" aria-labelledby="recent-title">
          <h3 id="recent-title" style={{ margin: 0 }}>
            Últimos intentos
          </h3>
          {data.recent.length === 0 ? (
            <p className="muted small">Aún no hay intentos.</p>
          ) : (
            <ul className="lab-logs">
              {data.recent.slice(0, SHOWN).map((a) => (
                <li key={a._id} className="lab-log" data-ok={a.ok || undefined}>
                  <strong>{a.levelName}</strong> · {when.format(new Date(a.createdAt))}
                  <br />
                  {a.ok ? "Completada" : a.error} · {a.steps} {a.steps === 1 ? "movimiento" : "movimientos"} · {a.energy}
                  {a.budget !== null && `/${a.budget}`} energía{a.hints > 0 && ` · ${a.hints} ${a.hints === 1 ? "pista" : "pistas"}`}
                </li>
              ))}
            </ul>
          )}
          {data.levels.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nivel</th>
                    <th>Ejecuciones</th>
                    <th>Completadas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.levels.map((l) => (
                    <tr key={l.name}>
                      <td>{l.name}</td>
                      <td>{l.plays}</td>
                      <td>{l.completed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="card stack" aria-labelledby="observe-title">
          <h3 id="observe-title" style={{ margin: 0 }}>
            ¿Qué puede observar el docente?
          </h3>
          <p className="small muted">
            La plataforma identifica eventos verificables: llegada a la meta, energía excedida, choque con obstáculos, estación no visitada y cantidad de intentos.
          </p>
          <p className="alert alert-info small">
            No se infiere un porcentaje de aprendizaje. Para evaluar aprendizaje se necesitarían instrumentos, estudios y validación pedagógica adicionales.
          </p>
          <Link className="btn" to={`/laboratorio/${missionId}`}>
            Abrir laboratorio <Icon name="chevronRight" size={18} />
          </Link>
        </section>
      </div>
    </div>
  );
}

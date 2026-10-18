import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@robolab/backend/convex/_generated/api";
import { Icon } from "../../../shared/ui/Icon";
import { MOBILE_QUERY, useMediaQuery } from "../../../shared/useMediaQuery";
import { usePageTitle } from "../../../shared/usePageTitle";
import { LEVEL_INFO } from "../../explore/ExploreLayout";
import "./retos.css";

type Reto = FunctionReturnType<typeof api.assignments.listMine>[number];
type Estado = "all" | "active" | "closed";

const ESTADOS: readonly { value: Estado; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "closed", label: "Cerrados" },
];

/** Un reto sin clase es un borrador; uno cerrado ya no lo ven los alumnos; el resto está activo. */
export function retoStatus(reto: Pick<Reto, "closed" | "visibility">): "active" | "closed" | "draft" {
  if (reto.closed) return "closed";
  return reto.visibility === "draft" ? "draft" : "active";
}

const STATUS_BADGE = {
  active: { text: "Activo", className: "badge badge-ok" },
  closed: { text: "Cerrado", className: "badge badge-muted" },
  draft: { text: "Borrador", className: "badge badge-warn" },
} as const;

const NEW_RETO = "/docente/retos/nuevo";
const unique = <T,>(values: readonly T[]) => [...new Set(values)];

function Progress({ reto }: { reto: Reto }) {
  if (!reto.classroomId) return <span className="muted">—</span>;
  return (
    <span className="reto-progress">
      <span className="meter" role="img" aria-label={`${reto.solvedPercent} % de la clase lo logró`}>
        <span style={{ ["--value" as string]: reto.solvedPercent / 100 }} />
      </span>
      <strong>{reto.solvedPercent} %</strong>
    </span>
  );
}

/**
 * Retos del docente: el lugar donde se crea, se asigna y se revisa todo. Junta
 * los retos de todas sus clases (y los que aún no asignó) en una lista que se
 * filtra por clase, tópico y estado.
 */
export function RetosPage() {
  usePageTitle("Retos");
  const retos = useQuery(api.assignments.listMine);
  const mobile = useMediaQuery(MOBILE_QUERY);
  const [classroomId, setClassroomId] = useState("");
  const [topic, setTopic] = useState("");
  const [estado, setEstado] = useState<Estado>("all");

  const head = (
    <div className="page-head">
      <h1>Retos</h1>
      <Link className="btn btn-primary" to={NEW_RETO}>
        <Icon name="plus" /> Nuevo reto
      </Link>
    </div>
  );
  if (retos === undefined) {
    return (
      <div className="stack">
        {head}
        <p className="muted">Cargando…</p>
      </div>
    );
  }
  if (retos.length === 0) {
    return (
      <div className="stack">
        {head}
        <div className="empty">
          <Icon name="clipboard" size={32} />
          <p>Aún no creaste retos. Elige un juego, asígnalo a tu clase y mira cómo les va.</p>
          <Link className="btn btn-primary" to={NEW_RETO}>
            <Icon name="plus" /> Crear el primero
          </Link>
        </div>
      </div>
    );
  }

  const classes = unique(retos.flatMap((r) => (r.classroomId ? [`${r.classroomId}\u0000${r.classroomLabel ?? ""}`] : [])))
    .map((key) => ({ id: key.split("\u0000")[0]!, label: key.split("\u0000")[1]! }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
  const topics = unique(retos.map((r) => `${r.topic}\u0000${r.topicName}`))
    .map((key) => ({ id: key.split("\u0000")[0]!, name: key.split("\u0000")[1]! }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  const shown = retos.filter((r) => {
    if (classroomId && r.classroomId !== classroomId) return false;
    if (topic && r.topic !== topic) return false;
    const status = retoStatus(r);
    return estado === "all" || (estado === "active" ? status === "active" : status === "closed");
  });
  const clearFilters = () => {
    setClassroomId("");
    setTopic("");
    setEstado("all");
  };

  return (
    <div className="stack">
      {head}
      <div className="retos-filters">
        <div className="field">
          <label htmlFor="retos-clase">Clase</label>
          <select id="retos-clase" className="select" value={classroomId} onChange={(e) => setClassroomId(e.target.value)}>
            <option value="">Todas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="retos-topico">Tópico</label>
          <select id="retos-topico" className="select" value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="">Todos</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="segmented" role="group" aria-label="Estado">
          {ESTADOS.map((e) => (
            <button key={e.value} type="button" aria-pressed={estado === e.value} onClick={() => setEstado(e.value)}>
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="empty">
          <Icon name="clipboard" size={32} />
          <p>Ningún reto coincide con esos filtros.</p>
          <button type="button" className="btn" onClick={clearFilters}>
            Quitar filtros
          </button>
        </div>
      ) : mobile ? (
        <ul className="reto-cards" aria-label="Retos">
          {shown.map((r) => (
            <li key={r.assignmentId}>
              <Link className="card card-link reto-card" to={`/docente/retos/${r.assignmentId}`}>
                <span className="row spread">
                  <strong>
                    <span aria-hidden="true">{r.emoji} </span>
                    {r.title}
                  </strong>
                  <span className={STATUS_BADGE[retoStatus(r)].className}>{STATUS_BADGE[retoStatus(r)].text}</span>
                </span>
                <span className="muted small">{r.classroomLabel ?? "Sin asignar"}</span>
                <span className="reto-meta small">
                  <span>
                    {r.topicName} · {LEVEL_INFO[r.level].name}
                  </span>
                  {r.classroomId && (
                    <span>
                      {r.studentsSolved} de {r.studentCount} lo lograron
                    </span>
                  )}
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
                <th>Reto</th>
                <th>Tópico · Nivel</th>
                <th>Clase</th>
                <th>Lo lograron</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.assignmentId}>
                  <td>
                    <Link className="row-link" to={`/docente/retos/${r.assignmentId}`}>
                      <span aria-hidden="true">{r.emoji} </span>
                      {r.title}
                    </Link>
                  </td>
                  <td className="small">
                    {r.topicName} · {LEVEL_INFO[r.level].name}
                  </td>
                  <td className="small">{r.classroomLabel ?? <span className="muted">Sin asignar</span>}</td>
                  <td>
                    <Progress reto={r} />
                  </td>
                  <td>
                    <span className={STATUS_BADGE[retoStatus(r)].className}>{STATUS_BADGE[retoStatus(r)].text}</span>
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

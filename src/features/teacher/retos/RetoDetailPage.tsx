import { useMutation, useQuery } from "convex/react";
import { type FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "@robolab/backend/convex/_generated/api";
import type { Id } from "@robolab/backend/convex/_generated/dataModel";
import { topicInfo } from "@robolab/backend/domain/explore/challenges";
import { clock, decimal } from "../../../shared/format";
import { userMessage } from "../../../shared/errors";
import { Icon } from "../../../shared/ui/Icon";
import { useToast } from "../../../shared/ui/Toast";
import { usePageTitle } from "../../../shared/usePageTitle";
import { LEVEL_INFO } from "../../explore/ExploreLayout";
import { NotFoundBoundary } from "../classes/NotFoundBoundary";
import { StatusBadge } from "../classes/status";
import "../classes/classes.css";

/** Detalle de un reto (T9): sus resultados en la clase y, arriba, lo que el docente puede hacer con él. */
export function RetoDetailPage() {
  const { assignmentId = "" } = useParams();
  return (
    <NotFoundBoundary key={assignmentId} backTo="/docente/retos" backLabel="Volver a Retos">
      <RetoDetail assignmentId={assignmentId as Id<"assignments">} />
    </NotFoundBoundary>
  );
}

type ActionsProps = {
  readonly assignmentId: Id<"assignments">;
  /** La clase donde está hoy; null si aún no tiene. */
  readonly classroomId: string | null;
  readonly closed: boolean;
};

/** «Asignar» (a otra clase o a la primera) y «Cerrar / Reabrir»; cerrar pide confirmar. */
function RetoActions({ assignmentId, classroomId, closed }: ActionsProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const classes = useQuery(api.classrooms.listMine);
  const assign = useMutation(api.assignments.assign);
  const close = useMutation(api.assignments.close);
  const reopen = useMutation(api.assignments.reopen);
  const [assigning, setAssigning] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [choice, setChoice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignLabel = classroomId ? "Asignar a otra clase" : "Asignar a una clase";
  const options = (classes ?? []).filter((c) => c._id !== classroomId);

  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (e) {
      setError(userMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function onAssign(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      const target = options.find((c) => c._id === choice);
      const id = await assign({ assignmentId, classroomId: choice as Id<"classrooms"> });
      toast(`Asignaste el reto a ${target?.label ?? "la clase"}.`);
      setAssigning(false);
      setChoice("");
      // Si la clase actual ya tenía el reto, el servidor crea una copia para la nueva: se abre esa.
      if (id !== assignmentId) navigate(`/docente/retos/${id}`);
    });
  }

  return (
    <div className="stack-sm">
      <div className="row">
        <button type="button" className="btn" aria-expanded={assigning} onClick={() => setAssigning((v) => !v)}>
          <Icon name="users" /> {assignLabel}
        </button>
        {classroomId &&
          (closed ? (
            <button type="button" className="btn" disabled={busy} onClick={() =>
                void run(async () => {
                  await reopen({ assignmentId });
                })
              }>
              <Icon name="rotate" /> Reabrir reto
            </button>
          ) : (
            <button type="button" className="btn" onClick={() => setConfirmingClose(true)}>
              Cerrar reto
            </button>
          ))}
      </div>
      {confirmingClose && (
        <div className="card confirm-box stack-sm" role="alertdialog" aria-labelledby="close-title" aria-describedby="close-text">
          <strong id="close-title">¿Cerrar este reto?</strong>
          <p id="close-text" className="small">
            Tus alumnos dejarán de verlo. Sus resultados se conservan y puedes reabrirlo cuando quieras.
          </p>
          <div className="row">
            <button
              type="button"
              className="btn btn-sm btn-primary"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await close({ assignmentId });
                  setConfirmingClose(false);
                })
              }
            >
              Sí, cerrar
            </button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirmingClose(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
      {assigning && (
        <form className="card stack-sm" onSubmit={(e) => void onAssign(e)} aria-label={assignLabel}>
          <div className="row" style={{ alignItems: "end" }}>
            <div className="field" style={{ flex: "1 1 220px" }}>
              <label htmlFor="assign-to">Clase</label>
              <select id="assign-to" className="select" value={choice} onChange={(e) => setChoice(e.target.value)} required>
                <option value="">Elige una clase</option>
                {options.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={!choice || busy} aria-busy={busy}>
              {busy ? "Asignando…" : "Asignar"}
            </button>
          </div>
        </form>
      )}
      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function RetoDetail({ assignmentId }: { assignmentId: Id<"assignments"> }) {
  const reto = useQuery(api.assignments.get, { assignmentId });
  const mine = useQuery(api.assignments.listMine);
  const results = useQuery(api.assignments.results, reto?.classroomId ? { assignmentId } : "skip");
  usePageTitle(reto ? (reto.classroomId ? `Resultados: ${reto.title}` : reto.title) : undefined);

  if (reto === undefined) return <p className="muted">Cargando…</p>;
  const closed = mine?.find((r) => r.assignmentId === assignmentId)?.closed ?? false;
  const topic = topicInfo(reto.topic);
  const back = (
    <div>
      <Link className="link-btn" to="/docente/retos">
        <Icon name="arrowLeft" size={18} /> Retos
      </Link>
    </div>
  );
  const badge = (
    <span className="badge">
      {topic?.emoji} {topic?.name ?? reto.topic} · {LEVEL_INFO[reto.level].name}
    </span>
  );

  if (!reto.classroomId) {
    return (
      <div className="stack" style={{ gap: 20 }}>
        {back}
        <div className="row" style={{ gap: 14 }}>
          <h1 className="class-title">{reto.title}</h1>
          {badge}
        </div>
        <p className="muted">Este reto todavía no está asignado a ninguna clase, así que aún no hay resultados.</p>
        <RetoActions assignmentId={assignmentId} classroomId={null} closed={false} />
      </div>
    );
  }
  if (results === undefined) return <p className="muted">Cargando…</p>;

  const { observed } = results;
  // Sin partidas, el servidor no inventa promedios (null): se muestra una raya.
  const average = (value: number | null, format: (n: number) => string) => (value === null ? "—" : format(value));

  return (
    <div className="stack" style={{ gap: 20 }}>
      {back}
      <div className="row" style={{ gap: 14 }}>
        <h1 className="class-title">
          {results.title} · Clase {results.classroomLabel}
        </h1>
        {badge}
        {closed && <span className="badge badge-muted">Cerrado</span>}
      </div>

      <RetoActions assignmentId={assignmentId} classroomId={results.classroomId} closed={closed} />

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

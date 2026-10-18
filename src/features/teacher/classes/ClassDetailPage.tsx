import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import { api } from "@robolab/backend/convex/_generated/api";
import type { Id } from "@robolab/backend/convex/_generated/dataModel";
import { userMessage } from "../../../shared/errors";
import { Icon } from "../../../shared/ui/Icon";
import { useToast } from "../../../shared/ui/Toast";
import { usePageTitle } from "../../../shared/usePageTitle";
import { LEVEL_INFO } from "../../explore/ExploreLayout";
import { kindLabel } from "../../explore/catalog";
import { CodeChip } from "./CodeChip";
import { NotFoundBoundary } from "./NotFoundBoundary";
import { StatusBadge } from "./status";
import { useEnsureJoinCodes } from "./useEnsureJoinCodes";
import "./classes.css";

/** «Eliminar clase»: primero pide confirmación; la página es la que borra (ver `ClassDetailPage`). */
function DeleteClass({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button type="button" className="link-btn delete-link" onClick={() => setConfirming(true)}>
        <Icon name="trash" size={18} /> Eliminar clase
      </button>
    );
  }
  return (
    <div className="card confirm-box stack-sm" role="alertdialog" aria-labelledby="delete-title" aria-describedby="delete-text">
      <strong id="delete-title">¿Eliminar la clase {label}?</strong>
      <p id="delete-text" className="small">
        Se borran sus alumnos, sus retos asignados y todos sus resultados. No se puede deshacer.
      </p>
      <div className="row">
        <button type="button" className="btn btn-sm btn-danger" onClick={onConfirm}>
          Sí, eliminar
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirming(false)}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

type Classroom = NonNullable<FunctionReturnType<typeof api.classrooms.get>>;

function StudentsTab({ classroom }: { classroom: Classroom }) {
  const joinUrl = `${window.location.origin}/alumno`.replace(/^https?:\/\//, "");

  if (classroom.students.length === 0) {
    return (
      <div className="empty">
        <Icon name="users" size={32} />
        <p>Todavía nadie se unió.</p>
        <p className="small">
          Tus alumnos entran en <strong>{joinUrl}</strong>, escriben el código <strong className="code">{classroom.joinCode ?? "…"}</strong> y
          eligen un apodo.
        </p>
      </div>
    );
  }
  return (
    <div className="card table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Apodo</th>
            <th>Retos hechos</th>
            <th>Último reto</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {classroom.students.map((s) => (
            <tr key={s._id}>
              <td>
                <strong>{s.displayName}</strong>
              </td>
              <td style={{ whiteSpace: "nowrap" }}>
                {s.retosHechos} de {s.retosTotal}
              </td>
              <td>{s.lastChallengeTitle ?? <span className="muted">—</span>}</td>
              <td>
                <StatusBadge status={s.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChallengesTab({ classroomId }: { classroomId: Id<"classrooms"> }) {
  const assignments = useQuery(api.assignments.listForClassroom, { classroomId });
  if (assignments === undefined) return <p className="muted">Cargando…</p>;

  if (assignments.length === 0) {
    return (
      <div className="empty">
        <Icon name="clipboard" size={32} />
        <p>Todavía no asignaste retos a esta clase.</p>
        <Link className="btn btn-primary" to="/docente/retos/nuevo">
          <Icon name="plus" /> Crear un reto
        </Link>
      </div>
    );
  }
  return (
    <div className="stack">
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Reto</th>
              <th>Lo lograron</th>
              <th>Resultados</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.assignmentId}>
                <td>
                  <strong>{a.title}</strong>
                  <span className="small muted">
                    {" "}
                    · {LEVEL_INFO[a.level].name} · {kindLabel(a.kind)}
                  </span>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <strong>{a.solvedPercent}%</strong>
                  <span className="small muted">
                    {" "}
                    ({a.studentsSolved} de {a.studentCount})
                  </span>
                </td>
                <td>
                  <Link className="link-btn" to={`/docente/retos/${a.assignmentId}`}>
                    Ver resultados
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <Link className="link-btn" to="/docente/retos/nuevo">
          <Icon name="plus" size={18} /> Crear otro reto
        </Link>
      </div>
    </div>
  );
}

/**
 * Una clase (T8/T8b): su código, eliminarla y las pestañas Estudiantes / Retos.
 *
 * Al eliminar, el servidor ya no encuentra la clase y sus consultas lanzarían
 * un error al volver a pintar (la mutación solo termina cuando la web ya vio su
 * efecto). Por eso, desde que se confirma, la página suelta esas consultas y
 * muestra «Eliminando la clase…» hasta salir a la lista.
 */
export function ClassDetailPage({ tab }: { tab: "students" | "challenges" }) {
  const { classroomId = "" } = useParams();
  return (
    <NotFoundBoundary key={classroomId}>
      <ClassDetail classroomId={classroomId} tab={tab} />
    </NotFoundBoundary>
  );
}

function ClassDetail({ classroomId, tab }: { classroomId: string; tab: "students" | "challenges" }) {
  const id = classroomId as Id<"classrooms">;
  const navigate = useNavigate();
  const toast = useToast();
  const remove = useMutation(api.classrooms.remove);
  const [leaving, setLeaving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const classroom = useQuery(api.classrooms.get, leaving ? "skip" : { classroomId: id });
  usePageTitle(classroom ? `Clase ${classroom.label}` : undefined);
  useEnsureJoinCodes(classroom?.joinCode === null);

  async function removeClass(label: string) {
    setRemoveError(null);
    setLeaving(true);
    try {
      await remove({ classroomId: id });
      toast(`Eliminaste la clase ${label}.`);
      navigate("/docente/clases");
    } catch (e) {
      setRemoveError(userMessage(e));
      setLeaving(false);
    }
  }

  if (leaving) {
    return (
      <p className="muted" role="status">
        Eliminando la clase…
      </p>
    );
  }
  return (
    <div className="stack">
      <div>
        <Link className="link-btn" to="/docente/clases">
          <Icon name="arrowLeft" size={18} /> Mis clases
        </Link>
      </div>
      {removeError && (
        <p className="alert alert-error" role="alert">
          {removeError}
        </p>
      )}
      {classroom === undefined ? (
        <p className="muted">Cargando…</p>
      ) : (
        <>
          <div className="page-head">
            <div className="row" style={{ gap: 14 }}>
              <h2 className="class-title">Clase {classroom.label}</h2>
              <CodeChip code={classroom.joinCode} />
            </div>
            <DeleteClass label={classroom.label} onConfirm={() => void removeClass(classroom.label)} />
          </div>
          <nav className="subtabs" aria-label="Secciones de la clase">
            <NavLink to={`/docente/clases/${classroomId}`} end className="subtab">
              Estudiantes <span className="subtab-count">{classroom.studentCount}</span>
            </NavLink>
            <NavLink to={`/docente/clases/${classroomId}/retos`} className="subtab">
              Retos
            </NavLink>
          </nav>
          {tab === "students" ? <StudentsTab classroom={classroom} /> : <ChallengesTab classroomId={id} />}
        </>
      )}
    </div>
  );
}

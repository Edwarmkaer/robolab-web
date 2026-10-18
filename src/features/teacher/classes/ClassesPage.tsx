import { useMutation, useQuery } from "convex/react";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@robolab/backend/convex/_generated/api";
import { LIMITS } from "@robolab/backend/domain/evaluation/rules";
import { EDUCATION_LEVELS, type EducationLevel, LEVEL_LABEL } from "@robolab/backend/domain/game/levels";
import { userMessage } from "../../../shared/errors";
import { Icon } from "../../../shared/ui/Icon";
import { IconButton } from "../../../shared/ui/IconButton";
import { usePageTitle } from "../../../shared/usePageTitle";
import { CodeChip, useCopyCode } from "./CodeChip";
import { useEnsureJoinCodes } from "./useEnsureJoinCodes";
import "./classes.css";

const GRADE_SUGGESTIONS: Record<EducationLevel, readonly string[]> = {
  inicial: ["3 años", "4 años", "5 años"],
  primaria: ["1.er grado", "2.º grado", "3.er grado", "4.º grado", "5.º grado", "6.º grado"],
  secundaria: ["1.er año", "2.º año", "3.er año", "4.º año", "5.º año"],
};

function CreateClassForm({ onCreated, onCancel }: { onCreated: (classroomId: string) => void; onCancel?: () => void }) {
  const create = useMutation(api.classrooms.create);
  const [level, setLevel] = useState<EducationLevel>("inicial");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // El servidor devuelve el Id; el código llega por la lista en vivo y se muestra en `CreatedClass`.
      onCreated(await create({ level, grade, section }));
    } catch (e) {
      setError(userMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card stack" onSubmit={onSubmit} aria-labelledby="new-class-title">
      <div className="row spread">
        <h3 id="new-class-title" style={{ margin: 0 }}>
          Nueva clase
        </h3>
        {onCancel && <IconButton icon="x" label="Cerrar" onClick={onCancel} />}
      </div>
      <div className="field">
        <label htmlFor="level">Nivel</label>
        <select id="level" className="select" value={level} onChange={(e) => setLevel(e.target.value as EducationLevel)}>
          {EDUCATION_LEVELS.map((l) => (
            <option key={l} value={l}>
              {LEVEL_LABEL[l]}
            </option>
          ))}
        </select>
      </div>
      <div className="row" style={{ alignItems: "start" }}>
        <div className="field" style={{ flex: "2 1 150px" }}>
          <label htmlFor="grade">Grado o edad</label>
          <input
            id="grade"
            className="input"
            list="grade-suggestions"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder={GRADE_SUGGESTIONS[level][GRADE_SUGGESTIONS[level].length - 1]}
            maxLength={LIMITS.gradeMax}
            required
          />
          <datalist id="grade-suggestions">
            {GRADE_SUGGESTIONS[level].map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </div>
        <div className="field" style={{ flex: "1 1 90px" }}>
          <label htmlFor="section">Sección</label>
          <input
            id="section"
            className="input"
            value={section}
            onChange={(e) => setSection(e.target.value.toUpperCase())}
            placeholder="A"
            maxLength={LIMITS.sectionMax}
            required
          />
        </div>
      </div>
      <p className="hint">Al crearla recibe un código como ABC-123: con él tus alumnos se unen con su apodo, sin cuenta.</p>
      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-primary" type="submit" disabled={busy || !grade.trim() || !section.trim()} aria-busy={busy}>
        {busy ? "Creando…" : "Crear clase"}
      </button>
    </form>
  );
}

type ClassRow = { readonly _id: string; readonly label: string; readonly joinCode: string | null };

/** La clase recién creada: su código bien grande para dictarlo o copiarlo. */
function CreatedClass({ classroom, onAnother }: { classroom: ClassRow | undefined; onAnother: () => void }) {
  const copy = useCopyCode();
  const code = classroom?.joinCode ?? null;
  const joinUrl = `${window.location.host}/alumno`;
  return (
    <section className="card stack created-class" aria-labelledby="created-title" aria-live="polite">
      <h3 id="created-title" style={{ margin: 0 }}>
        ¡Clase creada!
      </h3>
      {classroom && <span className="small muted">{classroom.label}</span>}
      <span className="created-code" aria-label={code ? `Código de la clase: ${code}` : "Generando el código de la clase"}>
        {code ?? "…"}
      </span>
      <p className="hint">
        Tus alumnos abren <strong>{joinUrl}</strong>, escriben este código y eligen un apodo. No necesitan cuenta.
      </p>
      <div className="row" style={{ justifyContent: "center" }}>
        <button type="button" className="btn btn-primary" disabled={code === null} onClick={() => code && void copy(code)}>
          <Icon name="copy" /> Copiar código
        </button>
        {classroom && (
          <Link className="btn" to={`/docente/clases/${classroom._id}`}>
            Ir a la clase
          </Link>
        )}
        <button type="button" className="link-btn" onClick={onAnother}>
          <Icon name="plus" size={18} /> Crear otra clase
        </button>
      </div>
    </section>
  );
}

/** Mis clases (T10): cada clase con su código; crear una nueva muestra el código al instante. */
export function ClassesPage({ creating = false }: { creating?: boolean }) {
  usePageTitle("Mis clases");
  const navigate = useNavigate();
  const classes = useQuery(api.classrooms.listMine);
  const [createdId, setCreatedId] = useState<string | null>(null);
  useEnsureJoinCodes(classes?.some((c) => c.joinCode === null) ?? false);
  const noClasses = classes !== undefined && classes.length === 0;
  const showForm = creating || noClasses;

  return (
    <div className="stack">
      <div className="page-head">
        <h2>Mis clases</h2>
        {!showForm && (
          <Link className="btn btn-primary" to="/docente/clases/nueva">
            <Icon name="plus" /> Nueva clase
          </Link>
        )}
      </div>
      <div className="two-col">
        <div className="stack">
          {classes === undefined ? (
            <p className="muted">Cargando…</p>
          ) : noClasses ? (
            <div className="empty">
              <Icon name="users" size={32} />
              <p>Crea tu primera clase con su nivel, grado y sección. Tus alumnos entran con el código que te damos.</p>
            </div>
          ) : (
            <ul className="class-cards" aria-label="Tus clases">
              {classes.map((c) => (
                <li key={c._id} className="card class-card">
                  <div className="class-card-text">
                    <Link className="class-card-title" to={`/docente/clases/${c._id}`}>
                      {c.label}
                    </Link>
                    <span className="small muted">
                      {c.studentCount} {c.studentCount === 1 ? "estudiante" : "estudiantes"}
                    </span>
                  </div>
                  <CodeChip code={c.joinCode} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="stack">
          {createdId !== null ? (
            <CreatedClass
              classroom={classes?.find((c) => c._id === createdId)}
              onAnother={() => {
                setCreatedId(null);
                if (!showForm) navigate("/docente/clases/nueva");
              }}
            />
          ) : (
            showForm && <CreateClassForm onCreated={setCreatedId} {...(noClasses ? {} : { onCancel: () => navigate("/docente/clases") })} />
          )}
        </div>
      </div>
    </div>
  );
}

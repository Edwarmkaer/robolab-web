import { useMutation, useQuery } from "convex/react";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@robolab/backend/convex/_generated/api";
import type { Id } from "@robolab/backend/convex/_generated/dataModel";
import type { Topic } from "@robolab/backend/domain/explore/challenges";
import type { EducationLevel } from "@robolab/backend/domain/game/levels";
import { userMessage } from "../../../shared/errors";
import { copyText } from "../../../shared/format";
import { Icon } from "../../../shared/ui/Icon";
import { useToast } from "../../../shared/ui/Toast";
import { usePageTitle } from "../../../shared/usePageTitle";
import { type Game, gameById, gamesFor } from "../../explore/catalog";
import { type CreatorStep, CreatorStepper } from "./CreatorStepper";
import { GameStep, PublishStep, TopicStep, type Visibility } from "./steps";
import "./retos.css";

type Published = {
  readonly assignmentId: string;
  readonly game: Game;
  readonly visibility: Visibility;
  /** Clase a la que quedó asignado, si ya lo está. */
  readonly classroomId: string | null;
};

/** El enlace que se comparte: sirve para retos de bloques y para misiones. */
export const challengeUrl = (id: string) => `${window.location.origin}/reto/${id}`;

/** Creador de retos del docente: tópico y nivel → juego → publicar (T3 → T4 → T6 → T7). */
export function NewChallengePage() {
  usePageTitle("Nuevo reto");
  const navigate = useNavigate();
  const create = useMutation(api.assignments.create);
  const classes = useQuery(api.classrooms.listMine);

  const [step, setStep] = useState<CreatorStep>(0);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [level, setLevel] = useState<EducationLevel | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [classroomId, setClassroomId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [published, setPublished] = useState<Published | null>(null);

  const game = gameId ? gameById(gameId) : undefined;
  const canContinue = topic !== null && level !== null && gamesFor(topic, level).length > 0;
  const canPublish = game !== undefined && !busy && (visibility !== "class" || classroomId !== "");

  function startOver() {
    setStep(0);
    setTopic(null);
    setLevel(null);
    setGameId(null);
    setVisibility("public");
    setClassroomId("");
    setError(null);
    setPublished(null);
  }

  async function publish(event: FormEvent) {
    event.preventDefault();
    if (!game || !gameId || !canPublish) return;
    setBusy(true);
    setError(null);
    try {
      const withClass = visibility === "class" ? { classroomId: classroomId as Id<"classrooms"> } : {};
      const assignmentId = await create({ challengeId: gameId, visibility, ...withClass });
      setPublished({ assignmentId: String(assignmentId), game, visibility, classroomId: visibility === "class" ? classroomId : null });
    } catch (e) {
      setError(userMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (published) return <PublishedView published={published} classes={classes} onAnother={startOver} />;

  return (
    <form className="stack creator" onSubmit={publish} aria-labelledby="creator-heading">
      <h2 id="creator-heading" className="sr-only">
        Nuevo reto
      </h2>
      <CreatorStepper current={step} />

      {step === 0 && (
        <TopicStep
          topic={topic}
          level={level}
          onTopic={(t) => {
            setTopic(t);
            setGameId(null);
            // Si el nivel elegido no tiene juegos en este tópico, se vuelve a elegir.
            if (level && gamesFor(t, level).length === 0) setLevel(null);
          }}
          onLevel={(l) => {
            setLevel(l);
            setGameId(null);
          }}
        />
      )}
      {step === 1 && topic && level && <GameStep topic={topic} level={level} gameId={gameId} onPick={setGameId} />}
      {step === 2 && game && topic && level && (
        <PublishStep
          game={game}
          topic={topic}
          level={level}
          visibility={visibility}
          classroomId={classroomId}
          classes={classes}
          onVisibility={setVisibility}
          onClassroom={setClassroomId}
        />
      )}

      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}

      {/* `key` por paso: el botón de cada paso es un nodo distinto. Si React reutilizara el mismo
          <button> y lo volviera type="submit" durante el clic, el navegador enviaría el formulario. */}
      <div key={step} className="row creator-actions">
        {step === 0 ? (
          <>
            <button type="button" className="link-btn" onClick={() => navigate("/docente")}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" disabled={!canContinue} onClick={() => setStep(1)}>
              Continuar
            </button>
          </>
        ) : step === 1 ? (
          <>
            <button type="button" className="link-btn" onClick={() => setStep(0)}>
              Volver
            </button>
            <button type="button" className="btn btn-primary" disabled={!game} onClick={() => setStep(2)}>
              Usar este juego
            </button>
          </>
        ) : (
          <>
            <button type="button" className="link-btn" onClick={() => setStep(1)}>
              Volver
            </button>
            <button type="submit" className="btn btn-primary" disabled={!canPublish} aria-busy={busy}>
              {busy ? "Publicando…" : visibility === "draft" ? "Guardar borrador" : "Publicar reto"}
            </button>
          </>
        )}
      </div>
    </form>
  );
}

type ClassOption = { readonly _id: string; readonly label: string };

type PublishedProps = {
  readonly published: Published;
  readonly classes: readonly ClassOption[] | undefined;
  readonly onAnother: () => void;
};

/** T7: el enlace para compartir, y asignarlo a una clase sin salir de aquí. */
function PublishedView({ published, classes, onAnother }: PublishedProps) {
  const toast = useToast();
  const assign = useMutation(api.assignments.assign);
  const id = published.game.kind === "blocks" ? published.game.challenge.id : published.game.mission.id;
  const url = challengeUrl(id);
  const [assignedTo, setAssignedTo] = useState<string | null>(published.classroomId);
  const [choosing, setChoosing] = useState(false);
  const [choice, setChoice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const assignedLabel = classes?.find((c) => c._id === assignedTo)?.label ?? "tu clase";

  async function copy() {
    toast((await copyText(url)) ? "Enlace copiado." : "No se pudo copiar. Selecciona el enlace y cópialo a mano.", {
      tone: "ok",
    });
  }

  async function confirmAssign(event: FormEvent) {
    event.preventDefault();
    if (!choice) return;
    setBusy(true);
    setError(null);
    try {
      await assign({ assignmentId: published.assignmentId as Id<"assignments">, classroomId: choice as Id<"classrooms"> });
      setAssignedTo(choice);
      setChoosing(false);
      toast(`Reto asignado a ${classes?.find((c) => c._id === choice)?.label ?? "la clase"}.`);
    } catch (e) {
      setError(userMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="published stack" aria-labelledby="published-title">
      <span className="done-burst" aria-hidden="true">
        {published.visibility === "draft" ? "📝" : "✅"}
      </span>
      <h2 id="published-title" className="creator-title">
        {published.visibility === "draft" ? "Tu borrador está guardado" : "¡Tu reto está publicado!"}
      </h2>
      <div className="card link-box stack-sm">
        <span className="small muted">Enlace del reto</span>
        <div className="row spread" style={{ flexWrap: "nowrap" }}>
          <a className="link-url" href={url}>
            {url.replace(/^https?:\/\//, "")}
          </a>
          <button type="button" className="link-btn" onClick={() => void copy()}>
            <Icon name="copy" size={18} /> Copiar
          </button>
        </div>
      </div>
      {published.visibility === "draft" && (
        <p className="small muted">Es un borrador: tus alumnos no lo ven en su clase hasta que lo asignes.</p>
      )}
      <div className="row" style={{ justifyContent: "center" }}>
        {assignedTo ? (
          <Link className="btn btn-primary" to={`/docente/retos/${published.assignmentId}`}>
            <Icon name="users" /> Ver en {assignedLabel}
          </Link>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => setChoosing(true)} aria-expanded={choosing}>
            <Icon name="users" /> Asignar a una clase
          </button>
        )}
        <Link className="btn" to={`/reto/${id}`}>
          <Icon name="play" /> Ver mi reto
        </Link>
        <button type="button" className="link-btn" onClick={onAnother}>
          <Icon name="plus" size={18} /> Crear otro
        </button>
      </div>
      {choosing && !assignedTo && (
        <form className="card stack assign-form" onSubmit={confirmAssign} aria-label="Asignar a una clase">
          {classes === undefined ? (
            <p className="muted small">Cargando tus clases…</p>
          ) : classes.length === 0 ? (
            <p className="hint">
              Todavía no tienes clases. <Link to="/docente/clases/nueva">Crea una</Link> y vuelve a asignar el reto.
            </p>
          ) : (
            <div className="row" style={{ alignItems: "end" }}>
              <div className="field" style={{ flex: "1 1 220px" }}>
                <label htmlFor="assign-to">Clase</label>
                <select id="assign-to" className="select" value={choice} onChange={(e) => setChoice(e.target.value)} required>
                  <option value="">Elige una clase</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={!choice || busy} aria-busy={busy}>
                {busy ? "Asignando…" : "Asignar"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setChoosing(false)}>
                Cancelar
              </button>
            </div>
          )}
          {error && (
            <p className="alert alert-error" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  );
}

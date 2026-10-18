import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@robolab/backend/convex/_generated/api";
import { shortLabel } from "@robolab/backend/domain/evaluation/calendar";
import { userMessage } from "../../shared/errors";
import { Icon } from "../../shared/ui/Icon";
import { usePageTitle } from "../../shared/usePageTitle";
import { ExploreLayout, LEVEL_INFO } from "../explore/ExploreLayout";
import { emojiFor, kindLabel } from "../explore/catalog";
import { speak } from "./speech";
import "./join.css";

type Props = { token: string; onSignOut: () => void };

/** Portada del alumno: su clase, la evaluación de hoy y los retos que le asignó su docente. */
export function StudentHome({ token, onSignOut }: Props) {
  usePageTitle("Mi clase");
  // El día lo decide el servidor (hora de Perú), no el reloj de la tablet.
  const home = useQuery(api.student.home, { token });
  const start = useMutation(api.student.start);
  const retry = useMutation(api.student.retry);
  const signOut = useMutation(api.student.signOut);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const evaluation = home?.evaluation ?? null;
  const challenges = home?.classChallenges ?? [];
  const name = home?.displayName;
  useEffect(() => {
    if (name) speak(`¡Hola, ${name}!`);
  }, [name]);

  async function begin() {
    if (!evaluation) return;
    setError(null);
    setBusy(true);
    try {
      const attemptId = evaluation.attemptId ?? (await start({ token, evaluationId: evaluation.evaluationId }));
      navigate(`/alumno/juego/${attemptId}`);
    } catch (e) {
      setError(userMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function playAgain() {
    if (!evaluation) return;
    setError(null);
    setBusy(true);
    try {
      navigate(`/alumno/juego/${await retry({ token, evaluationId: evaluation.evaluationId })}`);
    } catch (e) {
      setError(userMessage(e));
    } finally {
      setBusy(false);
    }
  }

  // Al salir vuelve a la portada, donde se elige un tópico o "Unirme a una clase".
  async function leave() {
    await signOut({ token }).catch(() => undefined);
    onSignOut();
    navigate("/");
  }

  return (
    <ExploreLayout>
      {home === undefined ? (
        <p className="muted">Cargando…</p>
      ) : (
        <div className="kid stack" style={{ maxWidth: 720, width: "100%", margin: "0 auto" }}>
          <div className="row spread" style={{ alignItems: "flex-start" }}>
            <div className="stack-sm">
              <h1 style={{ margin: 0 }}>¡Hola, {home.displayName}!</h1>
              <span className="class-tag">
                <Icon name="users" size={16} /> {home.joinCode ? `Clase ${home.joinCode} · ` : ""}
                {home.classroomLabel}
              </span>
            </div>
            <button className="btn btn-ghost" type="button" onClick={() => void leave()}>
              <Icon name="logOut" /> Salir
            </button>
          </div>

          <section className="card stack" style={{ textAlign: "center" }} aria-labelledby="today-title">
            <h2 id="today-title" style={{ margin: 0 }}>
              {evaluation ? evaluation.title : "Evaluación de hoy"}
            </h2>
            {!evaluation ? (
              <div className="empty">
                <Icon name="calendar" size={32} />
                <p>Hoy no tienes evaluaciones. ¡Vuelve pronto!</p>
                <p className="small muted">Hoy es {shortLabel(home.today)}.</p>
              </div>
            ) : (
              <>
                <p>
                  {evaluation.finished
                    ? "¡Ya terminaste! Mira cómo te fue."
                    : evaluation.questionCount === 1
                      ? "Lleva al robot a la estrella. Ahí hay una pregunta."
                      : `Lleva al robot a ${evaluation.questionCount} estrellas. En cada estrella hay una pregunta.`}
                </p>
                {error && (
                  <p className="alert alert-error" role="alert">
                    {error}
                  </p>
                )}
                <button className="btn btn-primary" type="button" disabled={busy} aria-busy={busy} onClick={() => void begin()}>
                  {!evaluation.finished && <Icon name="play" />}
                  {evaluation.finished ? "Ver mi resultado" : evaluation.attemptId ? "Seguir jugando" : "¡Empezar!"}
                </button>
                {evaluation.finished && (
                  <button className="btn" type="button" disabled={busy} aria-busy={busy} onClick={() => void playAgain()}>
                    <Icon name="rotate" /> Intentar de nuevo
                  </button>
                )}
              </>
            )}
          </section>

          <section className="card stack" aria-labelledby="class-challenges-title">
            <h2 id="class-challenges-title" style={{ margin: 0 }}>
              Retos de tu clase
            </h2>
            {challenges.length === 0 ? (
              <div className="empty">
                <Icon name="clipboard" size={32} />
                <p>Tu docente todavía no asignó retos. Mientras tanto puedes explorar.</p>
                <Link className="btn" to="/">
                  Explorar retos
                </Link>
              </div>
            ) : (
              <ul className="class-challenges">
                {challenges.map((c) => {
                  return (
                    <li key={c.assignmentId}>
                      <Link className="class-challenge" to={`/reto/${c.challengeId}`} data-solved={c.solved || undefined}>
                        <span className="class-challenge-art" aria-hidden="true">
                          {emojiFor(c.challengeId)}
                        </span>
                        <span className="class-challenge-info">
                          <strong>{c.title}</strong>
                          <span className="small muted">
                            {LEVEL_INFO[c.level].name} · {kindLabel(c.kind)}
                          </span>
                        </span>
                        {c.solved ? (
                          <span className="badge badge-ok">
                            <Icon name="check" size={14} /> Logrado
                          </span>
                        ) : (
                          <Icon name="chevronRight" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </ExploreLayout>
  );
}

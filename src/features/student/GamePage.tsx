import { useMutation, useQuery } from "convex/react";
import { useReducer, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@robolab/backend/convex/_generated/api";
import type { Id } from "@robolab/backend/convex/_generated/dataModel";
import { editorReducer, emptyEditor } from "@robolab/backend/domain/game/editor";
import { type Feedback, feedbackFor } from "@robolab/backend/domain/game/feedback";
import { type EducationLevel, policyFor } from "@robolab/backend/domain/game/levels";
import type { Outcome } from "@robolab/backend/domain/game/simulator";
import { userMessage } from "../../shared/errors";
import { ActionBar } from "../../shared/ui/ActionBar";
import { Guide } from "../../shared/ui/Guide";
import { Icon } from "../../shared/ui/Icon";
import { useFocusOnMount } from "../../shared/useFocusOnMount";
import { BlockEditor } from "../game/BlockEditor";
import { Board } from "../game/Board";
import { RobotSend } from "../robot/RobotSend";
import { useRobotLink } from "../robot/useRobotLink";
import { STEP_MS, useRunner } from "../game/useRunner";
import { type PublicQuestion, QuestionDialog } from "./QuestionDialog";
import { ResultView } from "./ResultView";
import { speak } from "./speech";
import "./student.css";

type Stage = { level: EducationLevel; stage: number; questionCount: number };

function StageView({
  token,
  attemptId,
  stage,
  pendingQuestion,
}: {
  token: string;
  attemptId: Id<"attempts">;
  stage: Stage;
  pendingQuestion: PublicQuestion | null;
}) {
  const policy = policyFor(stage.level);
  const map = policy.mapFor(stage.stage);
  const submitRun = useMutation(api.student.submitRun);
  const answer = useMutation(api.student.answer);
  const [editor, dispatch] = useReducer(editorReducer, emptyEditor);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [question, setQuestion] = useState<PublicQuestion | null>(pendingQuestion);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const robot = useRobotLink();
  const focusTitle = useFocusOnMount<HTMLHeadingElement>();

  async function onFinish(outcome: Outcome) {
    const fb = feedbackFor(outcome);
    setFeedback(fb);
    speak(`${fb.title} ${fb.detail}`);
    // Toda ejecución se envía: el servidor la simula, la cuenta y, si llegó, abre la pregunta.
    try {
      const run = await submitRun({ token, attemptId, program: editor.blocks });
      if (run.question) setQuestion(run.question);
    } catch (e) {
      setError(userMessage(e));
    }
  }

  const { state: runner, run, reset } = useRunner(map, (outcome) => void onFinish(outcome));

  function onRun() {
    setError(null);
    setFeedback(null);
    run(editor.blocks);
    // Si hay un robot conectado, hace el mismo recorrido.
    if (robot.state === "on") void robot.send(editor.blocks);
  }

  async function onAnswer(option: number) {
    setBusy(true);
    try {
      await answer({ token, attemptId, chosenOption: option, program: editor.blocks });
      // El servidor avanza la etapa; la consulta reactiva monta la siguiente.
    } catch (e) {
      setError(userMessage(e));
      setBusy(false);
    }
  }

  const mood = runner.outcome?.kind === "GOAL" ? "success" : runner.outcome?.kind === "OFF_PATH" ? "error" : "idle";
  const highlight = runner.activePath
    ? { path: runner.activePath, tone: "active" as const }
    : runner.errorPath
      ? { path: runner.errorPath, tone: "error" as const }
      : null;

  return (
    <div className="game has-action-bar">
      <div className="stack">
        {/* Cada etapa nueva recibe el foco: el lector de pantalla anuncia en qué estrella va. */}
        <h1 className="stage-title" tabIndex={-1} ref={focusTitle}>
          Estrella {stage.stage + 1} de {stage.questionCount}
        </h1>
        <Board map={map} robot={runner.robot} mood={mood} stepMs={STEP_MS} />
        {/* Wayra acompaña, pero en una evaluación no da pistas: la nota es del alumno. */}
        <Guide
          mood={
            !feedback
              ? "idle"
              : feedback.tone === "success"
                ? "happy"
                : runner.outcome?.kind === "OFF_PATH"
                  ? "surprised"
                  : "thinking"
          }
          message={feedback ? `${feedback.title} ${feedback.detail}` : "Arma el programa y lleva al robot a la estrella. ¡Tú puedes!"}
        />
        {error && !question && (
          <p className="alert alert-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="stack">
        <BlockEditor
          policy={policy}
          state={editor}
          dispatch={dispatch}
          disabled={runner.running || question !== null}
          active={highlight}
          onClear={() => {
            setFeedback(null);
            reset();
          }}
        />
        <ActionBar>
          <RobotSend robot={robot} program={editor.blocks} disabled={runner.running || question !== null} />
          <button className="btn btn-primary" type="button" disabled={runner.running || editor.blocks.length === 0 || question !== null} onClick={onRun}>
            <Icon name="play" /> Ejecutar
          </button>
        </ActionBar>
      </div>
      {question && <QuestionDialog question={question} busy={busy} error={error} onAnswer={(o) => void onAnswer(o)} />}
    </div>
  );
}

export function GamePage({ token }: { token: string }) {
  const { attemptId } = useParams();
  const id = attemptId as Id<"attempts">;
  const attempt = useQuery(api.student.attempt, { token, attemptId: id });

  if (attempt === undefined) return <p className="page muted">Cargando…</p>;

  return (
    <main className="page kid stack">
      <div className="row spread">
        <Link className="brand" to="/alumno">
          <img src="/robot/robot.svg" alt="" />
          {attempt.title}
        </Link>
        <div className="progress-dots" role="img" aria-label={`Estrella ${Math.min(attempt.stage + 1, attempt.questionCount)} de ${attempt.questionCount}`}>
          {Array.from({ length: attempt.questionCount }, (_, i) => (
            <span key={i} data-state={i < attempt.stage ? "done" : i === attempt.stage ? "current" : "next"} />
          ))}
        </div>
      </div>
      {attempt.finished ? (
        <ResultView token={token} attemptId={id} />
      ) : (
        <StageView
          // Una etapa (o un intento) nueva monta un editor y un tablero nuevos.
          key={`${id}-${attempt.stage}`}
          token={token}
          attemptId={id}
          stage={{ level: attempt.level, stage: attempt.stage, questionCount: attempt.questionCount }}
          pendingQuestion={attempt.pendingQuestion}
        />
      )}
    </main>
  );
}

import { useEffect, useRef } from "react";
import { Icon } from "../../shared/ui/Icon";
import { canSpeak, speak, stopSpeaking } from "./speech";

export type PublicQuestion = {
  readonly stage: number;
  readonly prompt: string;
  readonly options: readonly string[];
  readonly points: number;
};

type Props = {
  readonly question: PublicQuestion;
  readonly busy: boolean;
  /** Si responder falló (red, sesión vencida), se muestra aquí adentro, donde el niño lo ve. */
  readonly error?: string | null;
  readonly onAnswer: (option: number) => void;
};

const LETTERS = ["A", "B", "C", "D"];

const readAloud = (q: PublicQuestion) =>
  speak(`${q.prompt}. ${q.options.map((o, i) => `${LETTERS[i]}: ${o}`).join(". ")}.`);

/** `showModal` atrapa el foco y bloquea el fondo; donde no existe (navegadores viejos) se abre sin modal. */
function open(dialog: HTMLDialogElement) {
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

/**
 * La pregunta se responde, no se evita: Escape no la cierra y, si el navegador
 * la cerrara igual, vuelve a abrirse.
 */
export function QuestionDialog({ question, busy, error = null, onAnswer }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const first = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (dialog.current && !dialog.current.open) open(dialog.current);
    first.current?.focus();
    readAloud(question);
    return stopSpeaking;
  }, [question]);

  return (
    <dialog
      ref={dialog}
      className="dialog kid"
      aria-labelledby="question-title"
      onCancel={(e) => e.preventDefault()}
      onClose={() => dialog.current && open(dialog.current)}
    >
      <div className="row spread">
        <span className="badge">Pregunta {question.stage + 1}</span>
        {canSpeak() && (
          <button className="btn" type="button" onClick={() => readAloud(question)} aria-label="Escuchar otra vez">
            <Icon name="volume" /> Escuchar
          </button>
        )}
      </div>
      <h2 id="question-title" style={{ marginTop: 12 }}>
        {question.prompt}
      </h2>
      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}
      <div className="options">
        {question.options.map((option, i) => (
          <button
            key={i}
            ref={i === 0 ? first : undefined}
            className="option"
            type="button"
            disabled={busy}
            aria-label={`${LETTERS[i]}. ${option}`}
            onClick={() => onAnswer(i)}
          >
            <span className="option-letter" aria-hidden="true">
              {LETTERS[i]}
            </span>
            <span>{option}</span>
          </button>
        ))}
      </div>
    </dialog>
  );
}

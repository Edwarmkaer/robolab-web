import { Link } from "react-router-dom";
import { type Challenge, nextChallenge, topicInfo } from "@robolab/backend/domain/explore/challenges";
import { formatClock } from "../../shared/format";
import { Guide } from "../../shared/ui/Guide";
import { Icon } from "../../shared/ui/Icon";
import { useFocusOnMount } from "../../shared/useFocusOnMount";
import { LEVEL_INFO } from "./ExploreLayout";
import { listPath } from "./paths";
import "./challenge.css";

type Props = {
  readonly challenge: Challenge;
  readonly stats: { readonly runs: number; readonly hints: number; readonly ms: number };
  readonly onRepeat: () => void;
};

/**
 * "¡Reto logrado!" (M6): intentos, pistas y tiempo (mm:ss), y qué hacer ahora.
 * El título recibe el foco al aparecer: sin eso, el lector de pantalla se
 * queda en el botón "Ejecutar", que ya no existe.
 */
export function ChallengeDone({ challenge, stats, onRepeat }: Props) {
  const focusTitle = useFocusOnMount<HTMLHeadingElement>();
  const topic = topicInfo(challenge.topic)!;
  const next = nextChallenge(challenge);

  return (
    <section className="card stack done" aria-labelledby="done-title">
      <div className="done-top">
        <span className="done-burst" aria-hidden="true">
          🎉
        </span>
        <h1 id="done-title" tabIndex={-1} ref={focusTitle}>
          ¡Reto logrado!
        </h1>
        <p className="muted">
          {challenge.title} · {topic.name} · {LEVEL_INFO[challenge.level].name}
        </p>
        <div className="stat-row">
          <div className="stat">
            <strong>{stats.runs}</strong>
            <span>{stats.runs === 1 ? "intento" : "intentos"}</span>
          </div>
          <div className="stat">
            <strong>{stats.hints}</strong>
            <span>{stats.hints === 1 ? "pista" : "pistas"}</span>
          </div>
          <div className="stat">
            <strong>{formatClock(stats.ms)}</strong>
            <span>tiempo</span>
          </div>
        </div>
      </div>
      <Guide
        mood="happy"
        message={stats.hints === 0 ? "¡Sin pistas! ¡Qué buen trabajo!" : "¡Bien hecho! La próxima vez intenta con menos pistas."}
      />
      <div className="done-actions">
        {next && (
          <Link className="btn btn-primary" to={`/reto/${next.id}`}>
            Siguiente reto <Icon name="chevronRight" size={18} />
          </Link>
        )}
        <button className="btn" type="button" onClick={onRepeat}>
          <Icon name="rotate" /> Repetir
        </button>
        <Link className="link-btn" to={listPath(challenge)}>
          Volver a la lista
        </Link>
        <p className="saved-note small">
          <Icon name="save" size={16} /> Tu avance se guarda en este dispositivo.
        </p>
      </div>
    </section>
  );
}

import { TOPICS, type Topic, topicInfo } from "@robolab/backend/domain/explore/challenges";
import type { EducationLevel } from "@robolab/backend/domain/game/levels";
import { Icon } from "../../../shared/ui/Icon";
import { CREATOR_LEVELS, type Game, gameId, gameSubtitle, gameTitle, gamesFor } from "../../explore/catalog";
import { LEVEL_INFO, TOPIC_COLOR } from "../../explore/ExploreLayout";
import { GameThumb } from "./GameThumb";
import "./retos.css";

export type Visibility = "public" | "class" | "draft";

/** Lo que juega cada nivel, dicho para el docente. */
const LEVEL_GAME: Record<EducationLevel, string> = {
  inicial: "Retos de bloques: avanzar, girar y repetir.",
  primaria: "Misiones en un tablero de 6 × 6 con flechas y energía.",
  secundaria: "Próximamente.",
};

const countFor = (topic: Topic) => CREATOR_LEVELS.reduce((sum, level) => sum + gamesFor(topic, level).length, 0);
const plural = (n: number) => `${n} ${n === 1 ? "juego" : "juegos"}`;

type TopicStepProps = {
  readonly topic: Topic | null;
  readonly level: EducationLevel | null;
  readonly onTopic: (topic: Topic) => void;
  readonly onLevel: (level: EducationLevel) => void;
};

/** Paso 1 (T3): tarjetas de tópico y de nivel; cada una dice cuántos juegos tiene. */
export function TopicStep({ topic, level, onTopic, onLevel }: TopicStepProps) {
  return (
    <div className="stack" style={{ gap: 20 }}>
      <h2 className="creator-title">¿Qué tópico y nivel?</h2>
      <div className="topic-grid" role="group" aria-label="Tópico">
        {TOPICS.map((t) => {
          const count = countFor(t.id);
          return (
            <button
              key={t.id}
              type="button"
              className="topic-card pick-card"
              style={{ ["--topic" as string]: TOPIC_COLOR[t.id] }}
              aria-pressed={topic === t.id}
              disabled={count === 0}
              onClick={() => onTopic(t.id)}
            >
              <span className="topic-emoji" aria-hidden="true">
                {t.emoji}
              </span>
              <strong>{t.name}</strong>
              <span className="small muted">{t.tagline}</span>
              <span className={count > 0 ? "badge" : "badge badge-muted"}>{count > 0 ? plural(count) : "Próximamente"}</span>
            </button>
          );
        })}
      </div>
      <div className="level-grid" role="group" aria-label="Nivel">
        {CREATOR_LEVELS.map((l) => {
          const info = LEVEL_INFO[l];
          const count = topic ? gamesFor(topic, l).length : null;
          return (
            <button
              key={l}
              type="button"
              className="level-card pick-card"
              aria-pressed={level === l}
              disabled={count === 0}
              onClick={() => onLevel(l)}
            >
              <span className="level-dots" aria-hidden="true">
                {[1, 2, 3].map((d) => (
                  <span key={d} data-on={d <= info.dots} />
                ))}
              </span>
              <strong className="level-name">{info.name}</strong>
              <span className="level-ages">{info.ages}</span>
              <span className="small muted">{LEVEL_GAME[l]}</span>
              {count !== null && (
                <span className={count > 0 ? "badge" : "badge badge-muted"}>{count > 0 ? plural(count) : "Próximamente"}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type GameStepProps = {
  readonly topic: Topic;
  readonly level: EducationLevel;
  readonly gameId: string | null;
  readonly onPick: (id: string) => void;
};

/** Paso 2 (T4): los juegos ya hechos para ese tópico y nivel, con la miniatura de su mapa. */
export function GameStep({ topic, level, gameId: picked, onPick }: GameStepProps) {
  const info = topicInfo(topic)!;
  const games = gamesFor(topic, level);
  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="row" style={{ gap: 12 }}>
        <h2 className="creator-title">Elige un juego</h2>
        <span className="badge">
          {info.emoji} {info.name} · {LEVEL_INFO[level].name}
        </span>
        <span className="small muted">Ya están hechos: elige uno y úsalo con tu clase.</span>
      </div>
      {games.length === 0 ? (
        <div className="empty">
          <Icon name="clipboard" size={32} />
          <p>Todavía no hay juegos para {info.name} en {LEVEL_INFO[level].name}.</p>
        </div>
      ) : (
        <div className="game-grid" role="group" aria-label="Juego">
          {games.map((game) => {
            const id = gameId(game);
            return (
              <button key={id} type="button" className="game-card" aria-pressed={picked === id} onClick={() => onPick(id)}>
                <GameThumb game={game} />
                <span className="game-info">
                  <strong>{gameTitle(game)}</strong>
                  <span className="small muted">{gameSubtitle(game)}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

type ClassOption = { readonly _id: string; readonly label: string };

type PublishStepProps = {
  readonly game: Game;
  readonly topic: Topic;
  readonly level: EducationLevel;
  readonly visibility: Visibility;
  readonly classroomId: string;
  readonly classes: readonly ClassOption[] | undefined;
  readonly onVisibility: (v: Visibility) => void;
  readonly onClassroom: (id: string) => void;
};

/** Paso 3 (T6): quién podrá verlo, y a la derecha cómo lo verá el estudiante. */
export function PublishStep({ game, topic, level, visibility, classroomId, classes, onVisibility, onClassroom }: PublishStepProps) {
  const info = topicInfo(topic)!;
  const where = `${info.name} · ${LEVEL_INFO[level].name}`;
  const options: readonly { value: Visibility; name: string; hint: string }[] = [
    { value: "public", name: "Público", hint: `Aparece en ${where} para todos.` },
    { value: "class", name: "Solo mi clase", hint: "Se accede con el código de la clase." },
    { value: "draft", name: "Borrador", hint: "Solo tú lo ves." },
  ];
  return (
    <div className="publish-grid">
      <fieldset className="card visibility">
        <legend className="creator-title">¿Quién podrá verlo?</legend>
        {options.map((o) => (
          <label key={o.value} className="visibility-option">
            <input
              type="radio"
              name="visibility"
              value={o.value}
              className="sr-only"
              checked={visibility === o.value}
              onChange={() => onVisibility(o.value)}
            />
            <span className="visibility-text">
              <strong>{o.name}</strong>
              <span className="small muted">{o.hint}</span>
            </span>
          </label>
        ))}
        {visibility === "class" && (
          <div className="field">
            <label htmlFor="assign-classroom">¿A qué clase?</label>
            {classes === undefined ? (
              <p className="muted small">Cargando tus clases…</p>
            ) : classes.length === 0 ? (
              <p className="hint">Todavía no tienes clases. Crea una en "Mis clases" o publica el reto como público.</p>
            ) : (
              <select id="assign-classroom" className="select" value={classroomId} onChange={(e) => onClassroom(e.target.value)} required>
                <option value="">Elige una clase</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </fieldset>
      <aside className="card preview stack" aria-label="Así lo verá el estudiante">
        <span className="small muted">Así lo verá el estudiante</span>
        <span className="badge" style={{ justifySelf: "start" }}>
          {info.emoji} {where}
        </span>
        <h3 style={{ margin: 0 }}>{gameTitle(game)}</h3>
        <GameThumb game={game} />
      </aside>
    </div>
  );
}

import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "@robolab/backend/convex/_generated/api";
import { topicInfo } from "@robolab/backend/domain/explore/challenges";
import { Icon } from "../../../shared/ui/Icon";
import { usePageTitle } from "../../../shared/usePageTitle";
import { LEVEL_INFO } from "../../explore/ExploreLayout";
import { emojiFor } from "../../explore/catalog";
import { useEnsureJoinCodes } from "../classes/useEnsureJoinCodes";
import "./home.css";

const SHOWN_CHALLENGES = 6;

/** Inicio del docente (T2): tres cifras, los retos disponibles y sus clases con su código. */
export function HomePage() {
  usePageTitle("Inicio");
  const home = useQuery(api.teacherHome.home);
  const available = useQuery(api.assignments.available);
  useEnsureJoinCodes(home?.classes.some((c) => c.joinCode === null) ?? false);

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="row spread" style={{ alignItems: "center", flexWrap: "wrap" }}>
        <h1 className="home-greeting" style={{ margin: 0 }}>
          {home?.firstName ? `Hola, ${home.firstName}` : "Hola"}
        </h1>
        <Link className="btn" to="/docente/laboratorio/nueva">
          <Icon name="plus" /> Crear misión multigrado
        </Link>
      </div>

      <div className="stat-grid" role="group" aria-label="Resumen">
        <Stat value={home?.activeClasses} label={home?.activeClasses === 1 ? "clase activa" : "clases activas"} />
        <Stat value={home?.students} label={home?.students === 1 ? "estudiante" : "estudiantes"} />
        <Stat value={home?.availableChallenges} label="retos disponibles" />
      </div>

      <div className="home-grid">
        <section className="card stack" aria-labelledby="available-title">
          <div className="row spread">
            <h3 id="available-title" style={{ margin: 0 }}>
              Retos disponibles
            </h3>
            <Link className="link-btn small" to="/docente/retos/nuevo">
              <Icon name="plus" size={16} /> Crear reto
            </Link>
          </div>
          {available === undefined ? (
            <p className="muted">Cargando…</p>
          ) : available.length === 0 ? (
            <div className="empty">
              <Icon name="clipboard" size={32} />
              <p>Todavía no hay retos listos.</p>
            </div>
          ) : (
            <ul className="home-list">
              {available.slice(0, SHOWN_CHALLENGES).map((c) => (
                <li key={c.challengeId} className="home-item">
                  <span className="home-item-art" aria-hidden="true">
                    {emojiFor(c.challengeId)}
                  </span>
                  <span className="home-item-text">
                    <Link to={`/reto/${c.challengeId}`}>{c.title}</Link>
                    <span className="small muted">
                      {topicInfo(c.topic)?.name ?? c.topic} · {LEVEL_INFO[c.level].name}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {available !== undefined && available.length > SHOWN_CHALLENGES && (
            <Link className="link-btn small" to="/docente/retos/nuevo">
              Ver los {available.length} retos <Icon name="chevronRight" size={16} />
            </Link>
          )}
        </section>

        <section className="card stack" aria-labelledby="classes-title">
          <div className="row spread">
            <h3 id="classes-title" style={{ margin: 0 }}>
              Mis clases
            </h3>
            <Link className="link-btn small" to="/docente/clases/nueva">
              <Icon name="plus" size={16} /> Nueva clase
            </Link>
          </div>
          {home === undefined ? (
            <p className="muted">Cargando…</p>
          ) : home.classes.length === 0 ? (
            <div className="empty">
              <Icon name="users" size={32} />
              <p>Todavía no tienes clases. Crea la primera: tus alumnos entran con su código.</p>
              <Link className="btn btn-primary" to="/docente/clases/nueva">
                <Icon name="plus" /> Crear clase
              </Link>
            </div>
          ) : (
            <ul className="home-list">
              {home.classes.map((c) => (
                <li key={c._id} className="home-item">
                  <span className="home-item-text">
                    <Link to={`/docente/clases/${c._id}`}>{c.label}</Link>
                    <span className="small muted">
                      {c.studentCount} {c.studentCount === 1 ? "estudiante" : "estudiantes"} · {LEVEL_INFO[c.level].name}
                    </span>
                  </span>
                  {c.joinCode === null ? (
                    <span className="badge badge-muted">Generando código…</span>
                  ) : (
                    <span className="badge code-badge">Código {c.joinCode}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="stack" aria-labelledby="today-title">
        <div className="row spread">
          <h3 id="today-title" style={{ margin: 0 }}>
            Evaluaciones de hoy
          </h3>
          <Link className="link-btn small" to="/docente/evaluaciones/nueva">
            <Icon name="plus" size={16} /> Nueva evaluación
          </Link>
        </div>
        {home === undefined ? (
          <p className="muted">Cargando…</p>
        ) : home.todays.length === 0 ? (
          <div className="empty">
            <Icon name="calendar" size={32} />
            <p>No tienes evaluaciones programadas para hoy.</p>
          </div>
        ) : (
          <div className="grid-cards">
            {home.todays.map((e) => {
              const share = e.studentCount === 0 ? 0 : Math.round((e.finishedCount / e.studentCount) * 100);
              return (
                <Link key={e._id} className="card card-link" to={`/docente/evaluaciones/${e._id}`}>
                  <div className="row spread">
                    <strong>{e.title}</strong>
                    {e.playingCount > 0 && <span className="live">En vivo</span>}
                  </div>
                  <span className="muted small">{e.classroomLabel}</span>
                  <div className="meter" role="img" aria-label={`${share} % de la clase terminó`}>
                    <span style={{ ["--value" as string]: share / 100 }} />
                  </div>
                  <span className="small">
                    <strong>{e.finishedCount}</strong> de {e.studentCount} terminaron
                    {e.playingCount > 0 && ` · ${e.playingCount} jugando`}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: number | undefined; label: string }) {
  return (
    <div className="card stat-card">
      <strong>{value ?? "…"}</strong>
      <span className="small muted">{label}</span>
    </div>
  );
}

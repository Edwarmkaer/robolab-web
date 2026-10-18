import { Link } from "react-router-dom";
import type { Topic } from "@robolab/backend/domain/explore/challenges";
import type { EducationLevel } from "@robolab/backend/domain/game/levels";
import type { ProgressSummary } from "@robolab/backend/domain/explore/progress";
import { countLabel } from "./catalog";
import { LEVEL_INFO } from "./ExploreLayout";
import { ProgressChip } from "./ProgressChip";
import "./explore-topics.css";

/** La tarjeta de un nivel dentro de un tópico (S2/M2): edades, descripción, cuántos retos y cuántos resueltos. */
export function LevelCard({ topic, level, progress }: { topic: Topic; level: EducationLevel; progress: ProgressSummary }) {
  const info = LEVEL_INFO[level];
  const count = progress.total;
  const body = (
    <>
      <span className="level-dots" aria-hidden="true">
        {[1, 2, 3].map((d) => (
          <span key={d} data-on={d <= info.dots} />
        ))}
      </span>
      <strong className="level-name">{info.name}</strong>
      <span className="level-ages">{info.ages}</span>
      <span className="small muted">{info.description}</span>
      <span className="level-chips">
        <span className={count > 0 ? "badge" : "badge badge-muted"}>{count > 0 ? countLabel(level, count) : "Próximamente"}</span>
        {count > 0 && <ProgressChip solved={progress.solved} total={count} />}
      </span>
    </>
  );
  return count > 0 ? (
    <Link className="level-card" to={`/explorar/${topic}/${level}`}>
      {body}
    </Link>
  ) : (
    <div className="level-card" aria-disabled="true">
      {body}
    </div>
  );
}

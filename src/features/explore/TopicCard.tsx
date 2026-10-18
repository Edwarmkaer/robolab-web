import { Link } from "react-router-dom";
import type { TopicInfo } from "@robolab/backend/domain/explore/challenges";
import type { ProgressSummary } from "@robolab/backend/domain/explore/progress";
import { Icon } from "../../shared/ui/Icon";
import { TOPIC_COLOR } from "./ExploreLayout";
import { ProgressChip } from "./ProgressChip";
import "./explore-topics.css";

/** La tarjeta de un tópico en la portada (S1) y en la lista del celular (M1), con su avance. */
export function TopicCard({ topic, progress }: { topic: TopicInfo; progress: ProgressSummary }) {
  const style = { ["--topic" as string]: TOPIC_COLOR[topic.id] };
  const body = (
    <>
      <span className="topic-emoji" aria-hidden="true">
        {topic.emoji}
      </span>
      <strong>{topic.name}</strong>
      <span className="small muted">{topic.tagline}.</span>
      {topic.available ? <ProgressChip solved={progress.solved} total={progress.total} /> : <span className="badge badge-muted">Próximamente</span>}
      <span className="topic-chevron" aria-hidden="true">
        <Icon name="chevronRight" size={18} />
      </span>
    </>
  );
  return topic.available ? (
    <Link className="topic-card" to={`/explorar/${topic.id}`} style={style}>
      {body}
    </Link>
  ) : (
    <div className="topic-card" aria-disabled="true" style={style}>
      {body}
    </div>
  );
}

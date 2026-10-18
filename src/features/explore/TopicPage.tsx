import { Navigate, useParams } from "react-router-dom";
import { topicInfo } from "@robolab/backend/domain/explore/challenges";
import { levelProgress } from "@robolab/backend/domain/explore/progress";
import { EDUCATION_LEVELS } from "@robolab/backend/domain/game/levels";
import { Breadcrumbs, ExploreLayout, TOPIC_COLOR } from "./ExploreLayout";
import { LevelCard } from "./LevelCard";
import { useExploreProgress } from "./storage";

/** Un tópico: elige tu nivel. */
export function TopicPage() {
  const { topic: topicId = "" } = useParams();
  const topic = topicInfo(topicId);
  const { progress } = useExploreProgress();
  if (!topic || !topic.available) return <Navigate to="/" replace />;

  return (
    <ExploreLayout>
      <Breadcrumbs items={[{ label: "Explorar", to: "/" }, { label: topic.name }]} />
      <div className="topic-head" style={{ ["--topic" as string]: TOPIC_COLOR[topic.id] }}>
        <span className="topic-emoji" aria-hidden="true">
          {topic.emoji}
        </span>
        <div>
          <h1 style={{ margin: 0 }}>{topic.name}</h1>
          <p className="muted">{topic.tagline}. Elige tu nivel.</p>
        </div>
      </div>
      <div className="level-grid">
        {EDUCATION_LEVELS.map((level) => (
          <LevelCard key={level} topic={topic.id} level={level} progress={levelProgress(progress, topic.id, level)} />
        ))}
      </div>
      <p className="small muted">Puedes cambiar de nivel cuando quieras.</p>
    </ExploreLayout>
  );
}

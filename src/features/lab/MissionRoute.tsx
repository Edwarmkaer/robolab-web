import { topicInfo } from "@robolab/backend/domain/explore/challenges";
import type { Mission } from "@robolab/backend/domain/lab/mission";
import { Breadcrumbs, ExploreLayout, LEVEL_INFO } from "../explore/ExploreLayout";
import { LabPlayer } from "./LabPlayer";
import { useDocumentTitle } from "./useDocumentTitle";

/** /reto/:id cuando el id es una misión de Primaria del modo abierto. */
export function MissionRoute({ mission }: { mission: Mission }) {
  const topic = topicInfo(mission.topic);
  const listPath = `/explorar/${mission.topic}/primaria`;
  useDocumentTitle(mission.title);
  return (
    <ExploreLayout>
      <Breadcrumbs
        items={[
          { label: "Explorar", to: "/" },
          ...(topic ? [{ label: topic.name, to: `/explorar/${topic.id}` }] : []),
          { label: LEVEL_INFO.primaria.name, to: listPath },
          { label: mission.title },
        ]}
      />
      <LabPlayer mission={mission} missionId={mission.id} back={{ to: listPath, label: "Volver a la lista" }} />
    </ExploreLayout>
  );
}

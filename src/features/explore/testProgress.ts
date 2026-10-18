import { emptyProgress, recordPlay } from "@robolab/backend/domain/explore/progress";

/** Las pruebas de pantalla guardan el avance como lo hace la app: en localStorage, bajo la misma clave. */
export function saveSolved(...ids: string[]) {
  let progress = emptyProgress();
  for (const id of ids) progress = recordPlay(progress, id, { solved: true, runs: 1, hints: 0, ms: 1000 }, 1);
  window.localStorage.setItem("robolab.avance", JSON.stringify(progress));
}

import type { Mission } from "@robolab/backend/domain/mission/contracts";
import "../retos.css";

const key = (row: number, col: number) => `${row},${col}`;

/** Miniatura de una misión del asistente: obstáculos (💧), terreno difícil, estaciones (📦), salida (🤖) y meta (⭐). */
export function MissionPreview({ mission }: { mission: Mission }) {
  const { rows, cols, cells } = mission.grid;
  const byPosition = new Map(cells.map((c) => [key(c.position.row, c.position.col), c]));
  const stations = new Set(mission.checkpoints.map((c) => key(c.position.row, c.position.col)));
  const start = key(mission.start.row, mission.start.col);
  const goal = key(mission.goal.row, mission.goal.col);
  const grid: { k: string; kind: string | undefined; mark: string }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const k = key(row, col);
      const cell = byPosition.get(k);
      const kind = k === start ? "start" : k === goal ? "goal" : stations.has(k) ? "station" : cell?.obstacle ? "wall" : cell?.terrain === "rough" ? "rough" : undefined;
      grid.push({ k, kind, mark: kind === "start" ? "🤖" : kind === "goal" ? "⭐" : kind === "station" ? "📦" : kind === "wall" ? "💧" : "" });
    }
  }
  const n = mission.checkpoints.length;
  return (
    <div
      className="mission-thumb mission-thumb-v1"
      style={{ ["--size" as string]: cols }}
      role="img"
      aria-label={`Tablero de ${rows} por ${cols} con ${n} ${n === 1 ? "estación" : "estaciones"}.`}
    >
      {grid.map(({ k, kind, mark }) => (
        <span key={k} className="mission-cell" data-kind={kind === "wall" ? "water" : kind}>
          {mark && <span aria-hidden="true">{mark}</span>}
        </span>
      ))}
    </div>
  );
}

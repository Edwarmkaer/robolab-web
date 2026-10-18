import "./retos.css";

type Cell = readonly [row: number, col: number];

/** Lo que hace falta para dibujar una misión; no depende del jugador del laboratorio. */
export type MissionShape = {
  readonly size: number;
  readonly walls: readonly Cell[];
  readonly rough: readonly Cell[];
  readonly stations: readonly Cell[];
  readonly start: Cell;
  readonly goal: Cell;
};

const key = ([row, col]: Cell) => `${row},${col}`;
const LETTERS = "ABCDEFGHIJ";

/** Miniatura de una misión 6 × 6: paredes oscuras, terreno difícil, estaciones A/B, salida y meta ✦. */
export function MissionThumb({ mission }: { mission: MissionShape }) {
  const walls = new Set(mission.walls.map(key));
  const rough = new Set(mission.rough.map(key));
  const stations = new Map(mission.stations.map((cell, i) => [key(cell), LETTERS[i] ?? String(i + 1)]));
  const start = key(mission.start);
  const goal = key(mission.goal);
  const cells: Cell[] = [];
  for (let row = 0; row < mission.size; row++) for (let col = 0; col < mission.size; col++) cells.push([row, col]);

  return (
    <div
      className="mission-thumb"
      style={{ ["--size" as string]: mission.size }}
      role="img"
      aria-label={`Misión de ${mission.size} por ${mission.size} con ${mission.stations.length} ${
        mission.stations.length === 1 ? "estación" : "estaciones"
      }.`}
    >
      {cells.map((cell) => {
        const k = key(cell);
        const kind = walls.has(k) ? "wall" : k === goal ? "goal" : k === start ? "start" : stations.has(k) ? "station" : rough.has(k) ? "rough" : undefined;
        return (
          <span key={k} className="mission-cell" data-kind={kind}>
            {kind === "station" && stations.get(k)}
            {kind === "goal" && "✦"}
            {kind === "start" && "●"}
          </span>
        );
      })}
    </div>
  );
}

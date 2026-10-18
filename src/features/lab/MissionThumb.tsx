import { type Cell, type Mission, cellSet } from "@robolab/backend/domain/lab/mission";
import { tileKind } from "./LabBoard";
import "./lab.css";

/** Miniatura del tablero de una misión para tarjetas y vistas previas (solo decorativa). */
export function MissionThumb({ mission, className }: { mission: Mission; className?: string }) {
  const walls = cellSet(mission.walls);
  const rough = cellSet(mission.rough);
  const rows = Array.from({ length: mission.size }, (_, row) => row);
  return (
    <div className={className ? `mission-thumb ${className}` : "mission-thumb"} aria-hidden="true" style={{ gridTemplateColumns: `repeat(${mission.size}, 1fr)` }}>
      {rows.flatMap((row) =>
        rows.map((col) => {
          const cell: Cell = [row, col];
          return <span key={`${row}-${col}`} data-kind={tileKind(mission, cell, walls, rough)} />;
        }),
      )}
    </div>
  );
}

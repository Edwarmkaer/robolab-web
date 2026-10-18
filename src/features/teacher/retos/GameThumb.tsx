import type { Game } from "../../explore/catalog";
import { Board } from "../../game/Board";
import { MissionThumb } from "./MissionThumb";
import "./retos.css";

/** Miniatura del mapa de un juego: el tablero de bloques o la cuadrícula de la misión. */
export function GameThumb({ game }: { game: Game }) {
  return (
    <div className="game-thumb">
      {game.kind === "blocks" ? (
        <Board
          map={game.challenge.map}
          robot={{ cell: game.challenge.map.start, heading: game.challenge.map.startHeading }}
          mood="idle"
          stepMs={0}
        />
      ) : (
        <MissionThumb mission={game.mission} />
      )}
    </div>
  );
}

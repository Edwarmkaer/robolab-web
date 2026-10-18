import { useMutation } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "@robolab/backend/convex/_generated/api";
import { mazeFor } from "@robolab/backend/domain/live/maze";
import { useFocusOnMount } from "../../shared/useFocusOnMount";
import { usePageTitle } from "../../shared/usePageTitle";
import { Board } from "../game/Board";
import { LivePlayer } from "./LivePlayer";
import { LiveStandings } from "./LiveStandings";
import { MODE_LABEL, PHASE_LABEL, type RoomView } from "./types";
import { useLiveAction } from "./useLiveAction";
import "./live.css";

export function LiveRoomContent({ room, token }: { room: RoomView; token?: string }) {
  usePageTitle(`${MODE_LABEL[room.mode]} · ${room.title}`);
  const focus = useFocusOnMount<HTMLHeadingElement>();
  const join = useMutation(api.liveRooms.join);
  const setStatus = useMutation(api.liveRooms.setStatus);
  const { busy, error, perform } = useLiveAction();
  const teacher = token === undefined;
  const map = mazeFor(room.mazeId);
  const back = teacher ? "/docente/en-vivo" : "/alumno/en-vivo";
  return (
    <div className="stack live-room">
      <Link className="link-btn" to={back}>← Partidas en vivo</Link>
      <div className="page-head">
        <div className="stack-sm">
          <h1 key={room.status} ref={focus} tabIndex={-1}>{room.title}</h1>
          <p className="muted">{MODE_LABEL[room.mode]} · {room.classroomLabel}</p>
        </div>
        <span className={`badge ${room.status === "running" ? "badge-ok" : ""}`}>{PHASE_LABEL[room.status]}</span>
      </div>
      <section className="card stack" aria-label="Estado de la partida">
        {teacher && room.joinCode && <p>Comparte el código de tu clase: <strong>{room.joinCode}</strong>. Los alumnos entran en «Jugar en vivo».</p>}
        {room.status === "waiting" && <>
          <p>{teacher ? "Espera a que todos se unan y luego inicia la partida." : room.me ? "Ya estás dentro. Espera a que tu docente inicie la partida." : "Únete antes de que empiece la partida."}</p>
          {teacher ? <div className="row">
            <button className="btn btn-primary" type="button" disabled={busy || room.participants.length === 0} aria-busy={busy}
              onClick={() => void perform(() => setStatus({ roomId: room.roomId, status: "running" }))}>Iniciar partida</button>
            <button className="btn btn-ghost" type="button" disabled={busy}
              onClick={() => void perform(() => setStatus({ roomId: room.roomId, status: "closed" }))}>Cerrar sala</button>
          </div> : !room.me && <button className="btn btn-primary" type="button" disabled={busy} aria-busy={busy}
            onClick={() => void perform(() => join({ token, roomId: room.roomId }))}>Unirme a la partida</button>}
        </>}
        {room.status === "running" && <>
          <p>{room.mode === "race" ? "Resuelve el laberinto antes que tus compañeros. El orden se confirma al ejecutar un programa que llega a la estrella." : "Armen un solo programa entre todos para llegar a la estrella."}</p>
          {teacher && <button type="button" className="btn" disabled={busy} aria-busy={busy}
            onClick={() => void perform(() => setStatus({ roomId: room.roomId, status: "closed" }))}>Finalizar partida</button>}
          {!teacher && !room.me && <p>Esta partida ya empezó. Podrás unirte a la siguiente.</p>}
        </>}
        {room.status === "closed" && <p>Los resultados de esta partida están guardados. Tu docente puede crear otra para volver a jugar.</p>}
        {error && <p role="alert" className="alert alert-error">{error}</p>}
      </section>
      {!teacher && token && room.me && room.status !== "waiting" ? (
        <LivePlayer key={room.roomId} room={room} token={token} />
      ) : (
        <section className="live-preview stack-sm" aria-label={room.mode === "cooperative" ? "Tablero del equipo" : "Laberinto de la partida"}>
          <Board map={map} robot={room.mode === "cooperative" ? room.shared.state : { cell: map.start, heading: map.startHeading }}
            mood={room.shared.finishedAt !== null ? "success" : "idle"} stepMs={0} />
          {room.mode === "cooperative" && <p role="status">{room.shared.finishedAt !== null ? "¡Lo lograron en equipo!" : `Ejecuciones del equipo: ${room.shared.runs}`}</p>}
        </section>
      )}
      <LiveStandings room={room} />
    </div>
  );
}

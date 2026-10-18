import { Link } from "react-router-dom";
import { MODE_LABEL, PHASE_LABEL, type RoomSummary } from "./types";

export function RoomList({ rooms, teacher = false }: { rooms: RoomSummary[]; teacher?: boolean }) {
  if (rooms.length === 0) return <p className="muted">{teacher ? "Crea una partida y comparte el código de la clase." : "Tu docente todavía no abrió una partida. Las nuevas aparecerán aquí automáticamente."}</p>;
  return (
    <ul className="live-rooms">{rooms.map((room) => (
      <li key={room.roomId}>
        <Link className="card live-room-link" to={`${teacher ? "/docente" : "/alumno"}/en-vivo/${room.roomId}`}>
          <span className="stack-sm"><strong>{room.title}</strong><span className="small muted">{MODE_LABEL[room.mode]} · {room.classroomLabel} · {room.participantCount} participantes</span></span>
          <span className="badge">{PHASE_LABEL[room.status]}</span>
        </Link>
      </li>
    ))}</ul>
  );
}

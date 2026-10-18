import type { RoomView } from "./types";

const RESULT = { GOAL: "Lo logró", OFF_PATH: "Reintentando", INCOMPLETE: "En camino", EMPTY: "Preparando" };

/** El orden de llegada viene del servidor; la tabla no deduce ganadores por el reloj local. */
export function LiveStandings({ room }: { room: RoomView }) {
  const participants = [...room.participants].sort((a, b) =>
    (a.place ?? Infinity) - (b.place ?? Infinity) || a.displayName.localeCompare(b.displayName, "es"),
  );
  return (
    <section className="stack-sm" aria-labelledby="live-participants">
      <h2 id="live-participants">Participantes · {participants.length}</h2>
      {participants.length === 0 ? <p className="muted">Los alumnos aparecerán aquí cuando se unan a la partida.</p> : (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Avance confirmado de los participantes</caption>
            <thead><tr>
              {room.mode === "race" && <th scope="col">Puesto</th>}
              <th scope="col">Apodo</th><th scope="col">Ejecuciones</th><th scope="col">Estado</th>
            </tr></thead>
            <tbody>{participants.map((p) => (
              <tr key={p.studentId}>
                {room.mode === "race" && <td>{p.place ? `${p.place}.º` : "—"}</td>}
                <th scope="row">{p.displayName}</th><td>{p.runs}</td>
                <td>{room.mode === "cooperative" && room.shared.finishedAt !== null ? "Logro en equipo" : p.outcome ? RESULT[p.outcome] : room.status === "waiting" ? "En espera" : "Sin ejecutar"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <p className="small muted">La lista muestra quién se unió; no indica quién está conectado ahora.</p>
    </section>
  );
}

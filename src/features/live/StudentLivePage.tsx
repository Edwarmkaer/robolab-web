import { useQuery } from "convex/react";
import type { ReactNode } from "react";
import { ErrorBoundary } from "../../shared/ui/ErrorBoundary";
import { Link, useParams } from "react-router-dom";
import { api } from "@robolab/backend/convex/_generated/api";
import type { Id } from "@robolab/backend/convex/_generated/dataModel";
import { useFocusOnMount } from "../../shared/useFocusOnMount";
import { usePageTitle } from "../../shared/usePageTitle";
import { ExploreLayout } from "../explore/ExploreLayout";
import { LiveRoomContent } from "./LiveRoomContent";
import { RoomList } from "./RoomList";
import "./live.css";

function StudentLiveList({ token }: { token: string }) {
  usePageTitle("Jugar en vivo");
  const focus = useFocusOnMount<HTMLHeadingElement>();
  const rooms = useQuery(api.liveRooms.listForStudent, { token });
  return <div className="stack live-student">
    <Link to="/alumno" className="link-btn">← Mi clase</Link>
    <h1 ref={focus} tabIndex={-1}>Jugar en vivo</h1>
    <p>Elige una partida de tu clase y únete antes de que empiece.</p>
    {rooms === undefined ? <p className="muted">Cargando partidas…</p> : <RoomList rooms={rooms} />}
  </div>;
}

/** Un enlace ajeno o desactualizado no debe borrar una sesión válida. */
function StudentLiveBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary fallback={(message, reset) => <LiveRoomError message={message} retry={reset} />}>{children}</ErrorBoundary>;
}

function LiveRoomError({ message, retry }: { message: string; retry: () => void }) {
  usePageTitle("No pudimos abrir esta partida");
  const focus = useFocusOnMount<HTMLHeadingElement>();
  return <div className="card stack">
    <h1 ref={focus} tabIndex={-1}>No pudimos abrir esta partida</h1>
    <p role="alert">{message}</p>
    <div className="row"><button type="button" className="btn btn-primary" onClick={retry}>Reintentar</button>
      <Link className="btn" to="/alumno/en-vivo">Volver a partidas</Link>
      <Link className="link-btn" to="/alumno">Volver a mi clase</Link></div>
  </div>;
}

export function StudentLivePage({ token }: { token: string }) {
  return <ExploreLayout><div className="live-student"><StudentLiveBoundary key="list"><StudentLiveList token={token} /></StudentLiveBoundary></div></ExploreLayout>;
}

function StudentRoomQuery({ token, roomId }: { token: string; roomId: string }) {
  const room = useQuery(api.liveRooms.studentView, { token, roomId: roomId as Id<"liveRooms"> });
  return room === undefined ? <p className="muted">Cargando partida…</p> : <LiveRoomContent room={room} token={token} />;
}

export function StudentLiveRoom({ token }: { token: string }) {
  const { roomId = "" } = useParams();
  return <ExploreLayout><div className="live-student"><StudentLiveBoundary key={roomId}><StudentRoomQuery token={token} roomId={roomId} /></StudentLiveBoundary></div></ExploreLayout>;
}

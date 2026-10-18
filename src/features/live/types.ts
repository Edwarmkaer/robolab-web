import type { FunctionReturnType } from "convex/server";
import type { api } from "@robolab/backend/convex/_generated/api";

export type RoomView = FunctionReturnType<typeof api.liveRooms.studentView>;
export type RoomSummary = FunctionReturnType<typeof api.liveRooms.listMine>[number];
export const MODE_LABEL = { race: "Carrera", cooperative: "En equipo" } as const;
export const PHASE_LABEL = { waiting: "Sala de espera", running: "Jugando", closed: "Partida finalizada" } as const;

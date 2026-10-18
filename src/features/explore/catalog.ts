/**
 * Catálogo de juegos que se pueden asignar a una clase, en un solo lugar:
 * en Inicial son los retos de bloques (`CHALLENGES`) y en Primaria las
 * misiones del laboratorio (`MISSIONS`, tablero 6 × 6 con flechas). Las dos
 * listas viven en el dominio compartido; aquí solo se eligen y se describen.
 */
import { CHALLENGES, type Challenge, KIND_LABEL, type Topic, challengeById } from "@robolab/backend/domain/explore/challenges";
import type { EducationLevel } from "@robolab/backend/domain/game/levels";
import { MISSIONS, type Mission, missionById } from "@robolab/backend/domain/lab/mission";

export type Game = { readonly kind: "blocks"; readonly challenge: Challenge } | { readonly kind: "mission"; readonly mission: Mission };

/** Niveles que tienen juego propio en el creador de retos (Secundaria todavía no). */
export const CREATOR_LEVELS: readonly EducationLevel[] = ["inicial", "primaria"];

export function gameById(id: string): Game | undefined {
  const challenge = challengeById(id);
  if (challenge) return { kind: "blocks", challenge };
  const mission = missionById(id);
  return mission ? { kind: "mission", mission } : undefined;
}

/** Los juegos de un tópico y nivel: bloques en Inicial, misiones en Primaria. */
export function gamesFor(topic: Topic, level: EducationLevel): Game[] {
  if (level === "primaria") {
    return MISSIONS.filter((m) => m.topic === topic).map((mission) => ({ kind: "mission", mission }));
  }
  return CHALLENGES.filter((c) => c.topic === topic && c.level === level).map((challenge) => ({ kind: "blocks", challenge }));
}

export const gameId = (game: Game) => (game.kind === "blocks" ? game.challenge.id : game.mission.id);
export const gameTitle = (game: Game) => (game.kind === "blocks" ? game.challenge.title : game.mission.title);
export const gameEmoji = (game: Game) => (game.kind === "blocks" ? game.challenge.emoji : game.mission.emoji);

/** "Nivel 2 · Secuencia" para un reto de bloques; "Misión · 2 estaciones" para una misión. */
export function gameSubtitle(game: Game): string {
  if (game.kind === "blocks") return `Nivel ${game.challenge.difficulty} · ${KIND_LABEL[game.challenge.kind]}`;
  const n = game.mission.stations.length;
  return `Misión · ${n} ${n === 1 ? "estación" : "estaciones"}`;
}

/** Nombre del tipo de reto como lo devuelve el servidor ("sequence", "mission"…). */
export function kindLabel(kind: string): string {
  if (kind === "mission") return "Misión";
  return (KIND_LABEL as Record<string, string>)[kind] ?? kind;
}

/** Emoji de un reto por su id, para listas que vienen del servidor. */
export function emojiFor(id: string): string {
  const game = gameById(id);
  return game ? gameEmoji(game) : "🎯";
}

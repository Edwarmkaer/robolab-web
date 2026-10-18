import { type Topic, challengesFor } from "@robolab/backend/domain/explore/challenges";
import type { EducationLevel } from "@robolab/backend/domain/game/levels";
import { missionsFor } from "@robolab/backend/domain/lab/mission";

/** Cuánto hay para jugar en un tópico y nivel: misiones en Primaria, retos de bloques en los demás. */
export const openCountFor = (topic: Topic, level: EducationLevel): number =>
  level === "primaria" ? missionsFor(topic).length : challengesFor(topic, level).length;

export const countLabel = (level: EducationLevel, count: number): string =>
  level === "primaria" ? `${count} ${count === 1 ? "misión" : "misiones"}` : `${count} ${count === 1 ? "reto" : "retos"}`;

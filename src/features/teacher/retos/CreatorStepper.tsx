import { Icon } from "../../../shared/ui/Icon";
import "./retos.css";

export const CREATOR_STEPS = ["Tópico y nivel", "Juego", "Publicar"] as const;
export type CreatorStep = 0 | 1 | 2;

/** "1 Tópico y nivel — 2 Juego — 3 Publicar": los pasos hechos llevan un check. */
export function CreatorStepper({ current, labels = CREATOR_STEPS }: { current: CreatorStep; labels?: readonly string[] }) {
  return (
    <ol className="stepper" aria-label="Pasos para crear el reto">
      {labels.map((label, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li key={label} className="stepper-step" data-state={state} aria-current={state === "current" ? "step" : undefined}>
            <span className="stepper-dot" aria-hidden="true">
              {state === "done" ? <Icon name="check" size={14} /> : i + 1}
            </span>
            <span className="stepper-label">
              {state === "done" && <span className="sr-only">Hecho: </span>}
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

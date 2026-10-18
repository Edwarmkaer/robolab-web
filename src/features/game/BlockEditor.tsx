import { type Dispatch, useId } from "react";
import type { EditorAction, EditorState } from "@robolab/backend/domain/game/editor";
import { COMMANDS, type BlockPath, MAX_REPEAT, MIN_REPEAT } from "@robolab/backend/domain/game/program";
import type { LevelPolicy } from "@robolab/backend/domain/game/levels";
import { Icon } from "../../shared/ui/Icon";
import { IconButton } from "../../shared/ui/IconButton";
import { speak } from "../student/speech";
import { BLOCK_LOOK, MIN_SLOTS, REPEAT_LOOK } from "./blocks";
import { PieceFrame } from "./PieceFrame";
import "./palette.css";

type Props = {
  readonly policy: LevelPolicy;
  readonly state: EditorState;
  readonly dispatch: Dispatch<EditorAction>;
  readonly disabled: boolean;
  /** Bloque que se ejecuta ahora o el que falló, para resaltarlo. */
  readonly active?: { path: BlockPath; tone: "active" | "error" } | null;
  /** Solo muestra el programa (retos de predecir): sin paleta y sin quitar bloques. */
  readonly readOnly?: boolean;
  /** Qué hacer al tocar la papelera además de vaciar la secuencia (por ejemplo, devolver al robot al inicio). */
  readonly onClear?: () => void;
  /** La cámara reemplaza la paleta, pero conserva la edición de la secuencia. */
  readonly hidePalette?: boolean;
};

const samePath = (a: BlockPath, b: BlockPath) => a.length === b.length && a.every((v, i) => v === b[i]);

/**
 * Paleta de piezas ("Pasos") y la secuencia que arma el alumno. La secuencia
 * es una lista real (`<ul>/<li>`) con un botón dentro de cada paso: el lector
 * de pantalla cuenta los pasos y sabe que cada uno se puede quitar.
 */
export function BlockEditor({ policy, state, dispatch, disabled: busy, active, readOnly = false, onClear, hidePalette = false }: Props) {
  const disabled = busy || readOnly;
  const commands = COMMANDS.filter((c) => policy.palette.has(c));
  const toneOf = (path: BlockPath) => (active && samePath(active.path, path) ? active.tone : undefined);
  // Número de paso visible de cada bloque raíz (los bucles no cuentan como paso).
  const stepNumbers = state.blocks.reduce<number[]>((acc, block) => {
    const last = acc.length === 0 ? 0 : acc[acc.length - 1]!;
    acc.push(block.kind === "move" ? last + 1 : last);
    return acc;
  }, []);
  const emptySlots = readOnly ? 0 : Math.max(1, MIN_SLOTS - state.blocks.length);
  const id = useId();
  const paletteLabel = `${id}-pasos`;
  const sequenceLabel = `${id}-secuencia`;

  const clear = () => {
    dispatch({ type: "clear" });
    onClear?.();
  };

  return (
    <div className="stack editor">
      {!readOnly && !hidePalette && (
        <div className="stack-sm">
          <span className="editor-label" id={paletteLabel}>
            Pasos
          </span>
          <div className="palette" role="group" aria-labelledby={paletteLabel}>
            {commands.map((command) => (
              <PieceFrame key={command} label={BLOCK_LOOK[command].label}>
                <button
                  type="button"
                  className="block-btn"
                  data-piece={command}
                  disabled={disabled}
                  aria-label={BLOCK_LOOK[command].label}
                  onClick={() => {
                    dispatch({ type: "add", command });
                    speak(BLOCK_LOOK[command].label);
                  }}
                >
                  <img src={BLOCK_LOOK[command].icon} alt="" />
                </button>
              </PieceFrame>
            ))}
            {policy.palette.has("repeat") && (
              <PieceFrame label={REPEAT_LOOK.label}>
                <button
                  type="button"
                  className="block-btn"
                  data-piece="repeat"
                  disabled={disabled || state.openRepeat !== null}
                  aria-label={REPEAT_LOOK.label}
                  onClick={() => dispatch({ type: "addRepeat" })}
                >
                  <img src={REPEAT_LOOK.icon} alt="" />
                </button>
              </PieceFrame>
            )}
          </div>
        </div>
      )}

      <div className="stack-sm">
        <div className="row spread editor-head">
          <span className="editor-label" id={sequenceLabel}>
            {readOnly ? "Programa de Kusi" : "Tu secuencia"}
          </span>
          {!readOnly && <IconButton icon="trash" label="Borrar la secuencia" disabled={disabled || state.blocks.length === 0} onClick={clear} />}
        </div>
        <ul className="program" aria-labelledby={sequenceLabel} data-readonly={readOnly || undefined}>
          {state.blocks.map((block, i) => {
            if (block.kind === "move") {
              const stepNumber = stepNumbers[i];
              return (
                <PieceFrame key={i} as="li" label={BLOCK_LOOK[block.command].label}>
                  <button
                    type="button"
                    className="program-block"
                    data-piece={block.command}
                    data-state={toneOf([i])}
                    disabled={disabled}
                    aria-label={`Paso ${stepNumber}: ${BLOCK_LOOK[block.command].label}.${readOnly ? "" : " Toca para quitar."}`}
                    onClick={() => dispatch({ type: "remove", path: [i] })}
                  >
                    <span className="step-n" aria-hidden="true">
                      {stepNumber}
                    </span>
                    <img src={BLOCK_LOOK[block.command].icon} alt="" />
                  </button>
                </PieceFrame>
              );
            }
            const open = state.openRepeat === i;
            return (
              <li key={i} className="repeat-block" data-piece="repeat">
                <PieceFrame label={REPEAT_LOOK.label}>
                  <img className="repeat-icon" src={REPEAT_LOOK.icon} alt="" />
                  <span className="sr-only">Repetir</span>
                </PieceFrame>
                <select
                  className="select repeat-times"
                  value={block.times}
                  disabled={disabled}
                  aria-label="Veces"
                  onChange={(e) => dispatch({ type: "setTimes", index: i, times: Number(e.target.value) })}
                >
                  {Array.from({ length: MAX_REPEAT - MIN_REPEAT + 1 }, (_, k) => k + MIN_REPEAT).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <ul className="repeat-body" aria-label="Dentro de repetir">
                  {block.body.map((child, j) =>
                    child.kind === "move" ? (
                      <PieceFrame key={j} as="li" label={BLOCK_LOOK[child.command].label}>
                        <button
                          type="button"
                          className="program-block"
                          data-piece={child.command}
                          data-state={toneOf([i, j])}
                          disabled={disabled}
                          aria-label={`${BLOCK_LOOK[child.command].label} dentro de repetir.${readOnly ? "" : " Toca para quitar."}`}
                          onClick={() => dispatch({ type: "remove", path: [i, j] })}
                        >
                          <img src={BLOCK_LOOK[child.command].icon} alt="" />
                        </button>
                      </PieceFrame>
                    ) : null,
                  )}
                </ul>
                {readOnly ? null : open ? (
                  <button className="btn btn-sm" type="button" disabled={disabled} onClick={() => dispatch({ type: "closeRepeat" })}>
                    Cerrar
                  </button>
                ) : (
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    disabled={disabled}
                    aria-label="Quitar repetir"
                    onClick={() => dispatch({ type: "remove", path: [i] })}
                  >
                    <Icon name="x" />
                  </button>
                )}
              </li>
            );
          })}
          {Array.from({ length: emptySlots }, (_, k) => (
            <li key={`empty-${k}`} className="slot-empty" aria-hidden="true" />
          ))}
        </ul>
        {!readOnly && state.blocks.length === 0 && <span className="small muted">Toca las piezas para armar tu secuencia.</span>}
      </div>
    </div>
  );
}

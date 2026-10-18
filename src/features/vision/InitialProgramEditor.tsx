import { type ComponentProps, useState } from "react";
import { MAX_BLOCKS, type Command, countBlocks } from "@robolab/backend/domain/game/program";
import { type BlockEditor, PieceTray, Sequence } from "../game/BlockEditor";
import type { GestureHints } from "../game/BlockEditor";
import { GESTURES } from "./gestureGate";
import { VisionControls } from "./VisionControls";

/** El gesto de cada pieza (solo las de movimiento; el pulgar es «Ejecutar»). */
const GESTURE_HINTS: GestureHints = Object.fromEntries(
  GESTURES.flatMap((g) => (g.action === "confirm" ? [] : [[g.action, { emoji: g.emoji, prompt: g.prompt }]])),
);

type EditorProps = ComponentProps<typeof BlockEditor>;

/**
 * Programar en Inicial: la secuencia, la cámara (opcional) y la bandeja de
 * piezas en un mismo lugar. Las piezas siempre están a la vista: se tocan o se
 * piden con el gesto que llevan como insignia. `children` (las acciones de la
 * pantalla: «Ejecutar») va entre la secuencia y la bandeja.
 */
export function InitialProgramEditor({ onExecute, children, ...editor }: EditorProps & { onExecute: () => void; children?: React.ReactNode }) {
  const [seen, setSeen] = useState<Command | null>(null);
  return (
    <section className="program-workspace" aria-label="Programar el robot">
      <div className="workspace-canvas">
        <Sequence state={editor.state} dispatch={editor.dispatch} disabled={editor.disabled} active={editor.active} onClear={editor.onClear} />
        <VisionControls
          disabled={editor.disabled}
          canConfirm={editor.state.blocks.length > 0}
          full={countBlocks(editor.state.blocks) >= MAX_BLOCKS}
          onCommand={(command) => editor.dispatch({ type: "add", command })}
          onConfirm={onExecute}
          onCandidate={setSeen}
        />
      </div>
      {children}
      <PieceTray policy={editor.policy} state={editor.state} dispatch={editor.dispatch} disabled={editor.disabled} gestures={GESTURE_HINTS} currentCommand={seen} />
    </section>
  );
}

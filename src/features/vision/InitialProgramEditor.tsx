import { type ComponentProps, useState } from "react";
import { MAX_BLOCKS, countBlocks } from "@robolab/backend/domain/game/program";
import { Icon } from "../../shared/ui/Icon";
import { BlockEditor } from "../game/BlockEditor";
import { VisionControls } from "./VisionControls";

export function InitialProgramEditor({ onExecute, ...editor }: ComponentProps<typeof BlockEditor> & { onExecute: () => void }) {
  const [mode, setMode] = useState<"gestures" | "buttons">("gestures");
  return (
    <section className="stack-sm" aria-label="Programar el robot">
      <div className="row spread">
        <strong>Tu programa</strong>
        <div className="vision-modes" role="group" aria-label="Cómo programar">
          <button className="btn btn-sm" type="button" aria-pressed={mode === "gestures"} disabled={editor.disabled} onClick={() => setMode("gestures")}>Gestos</button>
          <button className="btn btn-sm" type="button" aria-pressed={mode === "buttons"} disabled={editor.disabled} onClick={() => setMode("buttons")}>Botones</button>
        </div>
      </div>
      <BlockEditor {...editor} hidePalette={mode === "gestures"} />
      {mode === "gestures" && <p className="small muted">Revisa tu programa. Toca un bloque para quitarlo.</p>}
      {mode === "gestures" && (
        <VisionControls
          disabled={editor.disabled}
          canConfirm={editor.state.blocks.length > 0}
          full={countBlocks(editor.state.blocks) >= MAX_BLOCKS}
          onCommand={(command) => editor.dispatch({ type: "add", command })}
          onConfirm={onExecute}
        />
      )}
      {mode === "buttons" && <button className="btn btn-primary" type="button" disabled={editor.disabled || editor.state.blocks.length === 0} onClick={onExecute}><Icon name="play" />Ejecutar</button>}
    </section>
  );
}

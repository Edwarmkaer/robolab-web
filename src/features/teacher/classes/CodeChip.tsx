import { copyText } from "../../../shared/format";
import { Icon } from "../../../shared/ui/Icon";
import { useToast } from "../../../shared/ui/Toast";
import "./classes.css";

/** Copia el código de la clase y lo avisa; si el navegador no deja, explica cómo hacerlo a mano. */
export function useCopyCode() {
  const toast = useToast();
  return async (code: string) => {
    if (await copyText(code)) toast(`Código ${code} copiado.`);
    else toast("No se pudo copiar. Selecciona el código y cópialo a mano.", { tone: "error" });
  };
}

/**
 * "Código TEC-482 · Copiar": el código de la clase, que se copia con un toque.
 * Las clases anteriores a los códigos lo reciben al abrir la pantalla (ver
 * `useEnsureJoinCodes`); mientras llega se muestra "Generando código…".
 */
export function CodeChip({ code }: { code: string | null }) {
  const copy = useCopyCode();
  if (code === null) return <span className="code-chip code-chip-wait">Generando código…</span>;
  return (
    <button type="button" className="code-chip" onClick={() => void copy(code)}>
      Código <span className="code-chip-code">{code}</span> · <span className="code-chip-action">Copiar</span>
      <Icon name="copy" size={16} />
    </button>
  );
}

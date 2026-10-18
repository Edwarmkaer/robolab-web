import { type ReactNode, useState } from "react";
import { Icon } from "../../shared/ui/Icon";

type Props = {
  /** Nombre de la pieza: aparece en la etiqueta del ícono de información. */
  readonly label: string;
  /** Segunda línea de la etiqueta (por ejemplo, qué hace el gesto). */
  readonly detail?: string;
  /** Etiqueta más ancha, para explicaciones de una frase. */
  readonly wide?: boolean;
  /** Muestra el ícono ⓘ. Las piezas no lo llevan (su nombre sale al pasar el mouse o enfocarlas); la cámara sí. */
  readonly info?: boolean;
  readonly children: ReactNode;
  /** `li` para las piezas de la secuencia (viven dentro de una lista). */
  readonly as?: "div" | "li";
};

/**
 * Marco de una pieza que se muestra solo con su ícono. Al pasar el mouse o al
 * recibir el foco el botón, aparece su nombre ("Avanzar", "Girar a la derecha"…);
 * con `info` además lleva arriba a la derecha un pequeño ícono ⓘ. El botón de
 * adentro conserva su `aria-label`: el ícono y la etiqueta son solo visuales,
 * para no repetirle el nombre al lector de pantalla ni sumar paradas de Tab.
 * Escape esconde la etiqueta sin mover el foco.
 */
export function PieceFrame({ label, detail, wide, info, children, as: Tag = "div" }: Props) {
  const [dismissed, setDismissed] = useState(false);
  return (
    <Tag
      className="piece"
      data-tip-dismissed={dismissed || undefined}
      data-wide={wide || undefined}
      onKeyDown={(e) => e.key === "Escape" && setDismissed(true)}
      onMouseLeave={() => setDismissed(false)}
      onBlur={() => setDismissed(false)}
    >
      {children}
      {info && (
        <span className="piece-info" aria-hidden="true">
          <Icon name="info" size={14} />
        </span>
      )}
      <span className="piece-tip" aria-hidden="true">
        {label}
        {detail && <span className="piece-tip-detail">{detail}</span>}
      </span>
    </Tag>
  );
}

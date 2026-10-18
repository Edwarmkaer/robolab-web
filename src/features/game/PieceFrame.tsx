import { type ReactNode, useState } from "react";
import { Icon } from "../../shared/ui/Icon";

type Props = {
  /** Nombre de la pieza: aparece en la etiqueta del ícono de información. */
  readonly label: string;
  readonly children: ReactNode;
  /** `li` para las piezas de la secuencia (viven dentro de una lista). */
  readonly as?: "div" | "li";
};

/**
 * Marco de una pieza que se muestra solo con su ícono: arriba a la derecha lleva
 * un pequeño ícono de información que, al pasar el mouse o al recibir el foco el
 * botón, muestra su nombre ("Avanzar", "Girar a la derecha"…). El botón de adentro
 * conserva su `aria-label`: el ícono y la etiqueta son solo visuales, para no
 * repetirle el nombre al lector de pantalla ni sumar paradas de Tab. Escape
 * esconde la etiqueta sin mover el foco.
 */
export function PieceFrame({ label, children, as: Tag = "div" }: Props) {
  const [dismissed, setDismissed] = useState(false);
  return (
    <Tag
      className="piece"
      data-tip-dismissed={dismissed || undefined}
      onKeyDown={(e) => e.key === "Escape" && setDismissed(true)}
      onMouseLeave={() => setDismissed(false)}
      onBlur={() => setDismissed(false)}
    >
      {children}
      <span className="piece-info" aria-hidden="true">
        <Icon name="info" size={14} />
      </span>
      <span className="piece-tip" aria-hidden="true">
        {label}
      </span>
    </Tag>
  );
}

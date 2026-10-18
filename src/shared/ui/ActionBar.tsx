import type { ReactNode } from "react";
import "./actionBar.css";

/**
 * Acciones del juego (Robot, Ejecutar, Comprobar). En pantalla ancha es una
 * fila normal; en el celular queda fija al pie, al alcance del pulgar. La
 * pantalla que la usa agrega `has-action-bar` a su contenedor para reservarle
 * el espacio y que no tape el final del contenido.
 */
export function ActionBar({ children }: { children: ReactNode }) {
  return <div className="action-bar">{children}</div>;
}

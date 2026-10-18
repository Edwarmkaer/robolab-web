import "./explore-topics.css";

/**
 * "n/m ✓": cuántos retos y misiones resolvió de los que hay. Lo leen las
 * tarjetas de tópico y de nivel; el lector de pantalla oye la frase completa.
 */
export function ProgressChip({ solved, total }: { solved: number; total: number }) {
  return (
    <span className="progress-chip" data-complete={(total > 0 && solved === total) || undefined}>
      <span className="sr-only">{`${solved} de ${total} ${total === 1 ? "reto resuelto" : "retos resueltos"}`}</span>
      <span aria-hidden="true">
        {solved}/{total} ✓
      </span>
    </span>
  );
}

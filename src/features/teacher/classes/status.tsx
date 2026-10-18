/** Estado de un alumno frente a un reto, como lo devuelve el servidor. */
export const STATUS = {
  solved: { text: "Logrado", className: "badge badge-ok" },
  in_progress: { text: "En curso", className: "badge badge-warn" },
  not_started: { text: "Sin empezar", className: "badge badge-muted" },
} as const;

export type Status = keyof typeof STATUS;

export function StatusBadge({ status }: { status: Status }) {
  return <span className={STATUS[status].className}>{STATUS[status].text}</span>;
}

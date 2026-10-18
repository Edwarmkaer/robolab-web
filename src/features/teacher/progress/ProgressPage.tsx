import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@robolab/backend/convex/_generated/api";
import type { Id } from "@robolab/backend/convex/_generated/dataModel";
import { Icon } from "../../../shared/ui/Icon";
import { usePageTitle } from "../../../shared/usePageTitle";
import { type ChartSeries, ProgressChart } from "./ProgressChart";
import { scaleFor } from "./chartLayout";

// Colores validados para daltonismo (azul y naranja), con línea punteada como segunda codificación.
const STUDENT_COLOR = "var(--c-series-student)";
const AVERAGE_COLOR = "var(--c-series-average)";

type Progress = FunctionReturnType<typeof api.analytics.classRetosProgress>;
type Reto = Progress["retos"][number];
type Cell = Progress["students"][number]["cells"][number];

const decimal = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 });
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

type Metric = {
  readonly label: string;
  readonly hint: string;
  /** Tope fijo del eje (el porcentaje siempre llega a 100). */
  readonly fixedTop?: number;
  readonly format: (value: number) => string;
  /** Lo que vale el reto para toda la clase; null si nadie lo jugó. */
  readonly average: (reto: Reto) => number | null;
  /** Lo que vale para un alumno; null si no jugó o si la medida es solo de la clase. */
  readonly student: (cell: Cell) => number | null;
};

/** Las medidas del progreso, una a la vez, cada una en su escala. Menos es mejor, salvo «Lo lograron». */
const METRICS = {
  tries: {
    label: "Intentos",
    hint: "Veces que tocó «Ejecutar» hasta lograr el reto. Menos es mejor: piensa antes de probar.",
    format: (v) => decimal.format(v),
    average: (r) => r.avgTries,
    student: (c) => c.tries,
  },
  hints: {
    label: "Pistas",
    hint: "Pistas que pidió en cada reto. Menos es mejor.",
    format: (v) => decimal.format(v),
    average: (r) => r.avgHints,
    student: (c) => c.hints,
  },
  time: {
    label: "Tiempo",
    hint: "Minutos que tardó en lograr cada reto. Menos es mejor.",
    format: (v) => `${decimal.format(v)} min`,
    average: (r) => (r.avgMs === null ? null : r.avgMs / 60_000),
    student: (c) => (c.ms === null ? null : c.ms / 60_000),
  },
  solved: {
    label: "Lo lograron (clase)",
    hint: "Porcentaje de la clase que logró cada reto. Más es mejor.",
    fixedTop: 100,
    format: (v) => `${Math.round(v)}%`,
    average: (r) => r.solvedPercent,
    student: () => null,
  },
} satisfies Record<string, Metric>;

type MetricKey = keyof typeof METRICS;
const METRIC_KEYS = Object.keys(METRICS) as MetricKey[];
/** Los títulos de la medida van en la gráfica: «Intentos por reto», «Lo lograron por reto». */
const chartName = (label: string) => label.replace(/ \(clase\)$/, "");

function cellText(cell: Cell) {
  if (cell.status === "solved") return <strong className="progress-solved">Logró · {cell.tries}</strong>;
  if (cell.status === "in_progress") return <strong className="progress-unsolved">Sin lograr</strong>;
  return <span className="muted">—</span>;
}

function attentionText(a: Progress["attention"][number]): string {
  return a.kind === "unsolved_streak"
    ? `${a.displayName}: ${a.count} retos jugados seguidos sin lograr.`
    : `${a.displayName}: aún no empieza ${plural(a.count, "reto", "retos")}.`;
}

function ClassProgress({ classroomId }: { classroomId: Id<"classrooms"> }) {
  const progress = useQuery(api.analytics.classRetosProgress, { classroomId });
  const [studentId, setStudentId] = useState("");
  const [metricKey, setMetricKey] = useState<MetricKey>("tries");

  if (progress === undefined) return <p className="muted">Cargando…</p>;
  if (progress.retos.length === 0) {
    return (
      <div className="empty">
        <Icon name="chart" size={32} />
        <p>Cuando esta clase juegue su primer reto, aquí verás cómo avanza.</p>
        <Link className="btn btn-primary" to="/docente/retos/nuevo">
          <Icon name="plus" /> Crear reto
        </Link>
      </div>
    );
  }

  const metric: Metric = METRICS[metricKey];
  const studentsOnly = metricKey !== "solved";
  const student = studentsOnly ? (progress.students.find((s) => s.studentId === studentId) ?? null) : null;
  const averageValues = progress.retos.map(metric.average);
  const series: ChartSeries[] = [
    { id: "average", label: "Promedio de la clase", shortLabel: "Promedio", color: AVERAGE_COLOR, dashed: true, values: averageValues },
  ];
  if (student) series.unshift({ id: student.studentId, label: student.displayName, color: STUDENT_COLOR, values: student.cells.map(metric.student) });
  const highest = Math.max(0, ...series.flatMap((s) => s.values.filter((v): v is number => v !== null)));
  const scale = scaleFor(highest, metric.fixedTop);

  return (
    <div className="stack">
      <section className="card stack">
        <div className="page-head" style={{ alignItems: "end" }}>
          <h3 style={{ margin: 0 }}>Evolución por reto</h3>
          <div className="row" style={{ alignItems: "end" }}>
            <div className="field" style={{ minWidth: 190 }}>
              <label htmlFor="metric">Medida</label>
              <select id="metric" className="select" value={metricKey} onChange={(e) => setMetricKey(e.target.value as MetricKey)}>
                {METRIC_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {METRICS[key].label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ minWidth: 190 }}>
              <label htmlFor="student">Comparar con</label>
              <select id="student" className="select" value={studentId} disabled={!studentsOnly} onChange={(e) => setStudentId(e.target.value)}>
                <option value="">Solo el promedio</option>
                {progress.students.map((s) => (
                  <option key={s.studentId} value={s.studentId}>
                    {s.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <ProgressChart
          title={`${chartName(metric.label)} por reto, ${progress.classroomLabel}`}
          xLabels={progress.retos.map((_, i) => `Reto ${i + 1}`)}
          xDetails={progress.retos.map((r, i) => `Reto ${i + 1} · ${r.title}`)}
          series={series}
          scale={scale}
          format={metric.format}
        />
        <p className="small muted">{metric.hint} Pasa el cursor sobre un reto para ver el detalle.</p>
      </section>

      <div className="progress-grid">
        <section className="card stack">
          <h3 style={{ margin: 0 }}>Detalle por alumno</h3>
          <p className="small muted">Toca un nombre para verlo en la gráfica.</p>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Alumno</th>
                  {progress.retos.map((r, i) => (
                    <th key={r.assignmentId} title={r.closed ? `${r.title} · cerrado` : r.title}>
                      Reto {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {progress.students.map((s) => (
                  <tr key={s.studentId}>
                    <td>
                      <button className="btn btn-ghost" type="button" style={{ padding: 0, minHeight: 0 }} onClick={() => setStudentId(s.studentId)}>
                        {s.displayName}
                      </button>
                    </td>
                    {s.cells.map((c) => (
                      <td key={c.challengeId}>{cellText(c)}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td>
                    <strong>Lo lograron</strong>
                  </td>
                  {progress.retos.map((r) => (
                    <td key={r.assignmentId}>
                      <strong>{r.solvedPercent} %</strong>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <aside className="card stack" aria-labelledby="attention-title">
          <h3 id="attention-title" style={{ margin: 0 }}>
            Para mirar de cerca
          </h3>
          {progress.attention.length === 0 ? (
            <p className="small">Por ahora nadie necesita una mirada especial.</p>
          ) : (
            <ul className="stack-sm" style={{ margin: 0, paddingLeft: 18 }}>
              {progress.attention.map((a) => (
                <li key={`${a.studentId}-${a.kind}`} className="small">
                  {attentionText(a)}
                </li>
              ))}
            </ul>
          )}
          <p className="small muted">Solo mostramos lo observable. No diagnosticamos.</p>
        </aside>
      </div>
    </div>
  );
}

export function ProgressPage() {
  usePageTitle("Progreso");
  const classes = useQuery(api.classrooms.listMine);
  const [classroomId, setClassroomId] = useState<string>("");

  if (classes === undefined) return <p className="muted">Cargando…</p>;
  if (classes.length === 0) {
    return (
      <div className="stack">
        <div className="page-head">
          <h1>Progreso</h1>
        </div>
        <div className="empty">
          <Icon name="users" size={32} />
          <p>Primero crea una clase: tus alumnos se unen con su código.</p>
          <Link className="btn btn-primary" to="/docente/clases">
            <Icon name="plus" /> Crear clase
          </Link>
        </div>
      </div>
    );
  }
  const selected = classroomId || classes[0]!._id;

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Progreso</h1>
        <select className="select" style={{ maxWidth: 360 }} value={selected} onChange={(e) => setClassroomId(e.target.value)} aria-label="Clase">
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <ClassProgress key={selected} classroomId={selected as Id<"classrooms">} />
    </div>
  );
}

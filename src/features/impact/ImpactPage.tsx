import { api } from "@robolab/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { APP_NAME } from "../../shared/brand";
import { ExploreLayout } from "../explore/ExploreLayout";
import { QrCode } from "./QrCode";

const whole = (n: number) => n.toLocaleString("es-PE");
const percent = (n: number | null) => (n === null ? "—" : `${n} %`);
const decimal = (n: number | null) => (n === null ? "—" : n.toLocaleString("es-PE", { maximumFractionDigits: 1 }));

/** Panel público: cuánto se usa RoboLab y cómo le va a quien juega. Se actualiza en vivo; solo cifras. */
export function ImpactPage() {
  const data = useQuery(api.impact.summary);
  const url = window.location.origin;

  return (
    <ExploreLayout title="Impacto en vivo" backTo="/">
      <div>
        <h1 style={{ margin: 0 }}>Impacto en vivo</h1>
        <p className="muted">Lo que pasa en {APP_NAME} ahora mismo. Solo cifras: nunca nombres.</p>
      </div>

      {data === undefined ? (
        <p className="muted">Cargando…</p>
      ) : (
        <>
          <section className="impact-grid" aria-label="Totales y cifras de hoy">
            <Stat label="Retos resueltos" total={data.total.solved} today={data.todayStats.solved} />
            <Stat label="Personas que jugaron" total={data.total.devices} today={data.todayStats.devices} note="dispositivos distintos" />
            <Stat label="Partidas" total={data.total.plays} today={data.todayStats.plays} />
            <Stat label="Evaluaciones terminadas en clase" total={data.total.attemptsFinished} today={data.todayStats.attemptsFinished} />
            <Stat label="Alumnos que terminaron" total={data.total.students} today={data.todayStats.students} />
          </section>

          <section className="card stack" aria-labelledby="how-title">
            <h2 id="how-title" style={{ margin: 0 }}>
              Cómo les va
            </h2>
            <div className="stat-row" style={{ justifyContent: "start" }}>
              <Rate label="Retos logrados" value={percent(data.total.successRate)} />
              <Rate label="Ejecuciones hasta lograrlo" value={decimal(data.total.avgRunsToSolve)} />
              <Rate label="Minutos por reto" value={decimal(data.total.avgMinutesToSolve)} />
              <Rate label="Pistas que ayudaron" value={percent(data.total.hintsHelped)} note="pidieron pista y lo lograron" />
            </div>
          </section>
        </>
      )}

      <section className="card impact-qr" aria-labelledby="qr-title">
        <QrCode text={url} label={`Código QR de ${url}`} />
        <div className="stack-sm">
          <h2 id="qr-title" style={{ margin: 0 }}>
            Juega desde tu celular
          </h2>
          <p className="muted">Escanea el código y resuelve un reto. Cada partida suma aquí.</p>
          <p className="small">
            <strong>{url.replace(/^https?:\/\//, "")}</strong>
          </p>
        </div>
      </section>
    </ExploreLayout>
  );
}

function Stat({ label, total, today, note }: { label: string; total: number; today: number; note?: string }) {
  return (
    <div className="impact-stat">
      <strong>{whole(total)}</strong>
      <span>{label}</span>
      <small>
        hoy: {whole(today)}
        {note ? ` · ${note}` : ""}
      </small>
    </div>
  );
}

function Rate({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
      {note && <span>{note}</span>}
    </div>
  );
}

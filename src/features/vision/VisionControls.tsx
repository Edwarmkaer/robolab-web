import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Command } from "@robolab/backend/domain/game/program";
import { Icon } from "../../shared/ui/Icon";
import { speak } from "../student/speech";
import { startCameraSession } from "./cameraSession";
import { GESTURES, GestureGate, type GestureFeedback } from "./gestureGate";

type Props = {
  disabled: boolean;
  canConfirm: boolean;
  full: boolean;
  onCommand: (command: Command) => void;
  onConfirm: () => void;
};
const idle: GestureFeedback = { action: null, candidate: null, progress: 0, releaseRequired: true };

export function VisionControls(props: Props) {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<"off" | "loading" | "ready" | "error">("off");
  const [message, setMessage] = useState("Activa la cámara y muestra una sola mano.");
  const [feedback, setFeedback] = useState(idle);
  const video = useRef<HTMLVideoElement>(null);
  const gate = useRef(new GestureGate());
  const latest = useRef(props);

  useLayoutEffect(() => {
    latest.current = props;
    if (props.disabled) gate.current.reset();
  }, [props]);

  useEffect(() => {
    if (!enabled || !video.current) return;
    gate.current.reset();
    const stop = startCameraSession(video.current, {
      isPaused: () => latest.current.disabled,
      onReady: () => { setStatus("ready"); setMessage("Retira la mano y luego elige un gesto."); },
      onError: (error) => { setStatus("error"); setMessage(error); setEnabled(false); },
      onSample: (sample, time) => {
        if (latest.current.disabled) return;
        const next = gate.current.update(sample, time);
        setFeedback(next);
        if (!next.action) return;
        if (next.action === "confirm") {
          if (latest.current.canConfirm) {
            // Cierra la entrada antes de que React pinte el estado de ejecución.
            latest.current = { ...latest.current, disabled: true };
            setMessage("Programa confirmado. Mira cómo se mueve Kusi.");
            latest.current.onConfirm();
          } else {
            setMessage("Primero agrega un bloque a tu programa.");
          }
        } else if (latest.current.full) {
          setMessage("Tu programa está lleno. Quita un bloque para agregar otro.");
        } else {
          latest.current.onCommand(next.action);
          const label = GESTURES.find((gesture) => gesture.action === next.action)!.label;
          setMessage(`${label}. ¡Bloque agregado!`);
          speak(label);
        }
      },
    });
    const hide = () => {
      if (document.hidden) {
        stop();
        setEnabled(false);
        setStatus("off");
        setMessage("Cámara apagada al salir de la pestaña. Actívala para continuar.");
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => { document.removeEventListener("visibilitychange", hide); stop(); };
  }, [enabled]);

  const currentGesture = GESTURES.find((gesture) => gesture.action === feedback.candidate);
  const instruction = props.disabled ? "Espera a que Kusi termine."
    : feedback.releaseRequired ? "Retira la mano entre cada gesto."
      : currentGesture ? `Mantén el gesto: ${currentGesture.label.toLowerCase()}.`
        : "Muestra un gesto con una sola mano.";

  return (
    <div className="vision-controls">
      <div className="vision-camera" data-ready={status === "ready" || undefined}>
        <video ref={video} className="vision-video" muted playsInline aria-label="Vista de tu cámara" hidden={status !== "ready"} />
        {status !== "ready" && <div className="vision-placeholder"><Icon name="camera" size={32} /><span>{status === "loading" ? "Preparando los gestos…" : "Programa con tus manos"}</span></div>}
        {status === "ready" && <span className="vision-camera-label">{props.disabled ? "En pausa" : "Cámara activa"}</span>}
      </div>
      <p className="small" role={status === "error" ? "alert" : "status"}>{message}</p>
      {status === "ready" && (
        <div className="vision-feedback">
          <span className="small">{instruction}</span>
          <progress aria-label="Gesto sostenido" max={1} value={props.disabled ? 0 : feedback.progress} />
        </div>
      )}
      <div className="vision-legend" aria-label="Guía de gestos">
        {GESTURES.map((gesture) => (
          <div key={gesture.name} className="vision-gesture" data-current={status === "ready" && !props.disabled && feedback.candidate === gesture.action || undefined}>
            <span className="vision-emoji" aria-hidden="true">{gesture.emoji}</span><span>{gesture.label}</span>
          </div>
        ))}
      </div>
      <p className="small muted">Mantén cada gesto hasta llenar la barra. Para confirmar, mantén 👍 un poco más.</p>
      <div className="row">
        {enabled ? (
          <button className="btn btn-sm" type="button" onClick={() => { setEnabled(false); setStatus("off"); setFeedback(idle); setMessage("Cámara apagada. Tu programa sigue aquí."); }}><Icon name="cameraOff" />{status === "loading" ? "Cancelar" : "Apagar cámara"}</button>
        ) : (
          <button className="btn btn-sm" type="button" disabled={props.disabled} onClick={() => { setStatus("loading"); setFeedback(idle); setMessage("Permite la cámara. La primera carga necesita internet."); setEnabled(true); }}><Icon name="camera" />Activar cámara</button>
        )}
      </div>
      <p className="small muted">La imagen se procesa en tu equipo. No se graba ni se envía.</p>
      <button className="btn btn-primary" type="button" disabled={props.disabled || !props.canConfirm} onClick={() => { gate.current.reset(); props.onConfirm(); }}><Icon name="check" />Confirmar y ejecutar</button>
    </div>
  );
}

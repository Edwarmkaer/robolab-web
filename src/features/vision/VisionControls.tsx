import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { Command } from "@robolab/backend/domain/game/program";
import { Icon } from "../../shared/ui/Icon";
import { PieceFrame } from "../game/PieceFrame";
import { speak } from "../student/speech";
import { startCameraSession } from "./cameraSession";
import { GESTURES, GestureGate, type GestureFeedback } from "./gestureGate";

type Props = {
  disabled: boolean;
  canConfirm: boolean;
  full: boolean;
  onCommand: (command: Command) => void;
  onConfirm: () => void;
  /** Qué pieza está pidiendo la cámara ahora (la mano que ve y sostiene), para resaltarla en la bandeja. */
  onCandidate?: (command: Command | null) => void;
  /** La cámara no se pudo encender (permiso negado, sin HTTPS…): la pantalla vuelve a los botones y lo avisa. */
  onUnavailable?: (reason: string) => void;
};
/** Lo que explica el ⓘ de la cámara; el lector de pantalla lo oye una vez, junto al botón. */
const CAMERA_HOW = "Apunta con el índice y recoge los otros dedos.";
const CAMERA_PRIVACY = "La imagen se procesa en tu equipo. No se graba ni se envía.";
const idle: GestureFeedback = { action: null, candidate: null, progress: 0, releaseRequired: true };

/**
 * La cámara de Gestos: se enciende sola al montarse (la pantalla la monta solo
 * mientras Gestos está elegido) y se apaga al desmontarse o al salir de la pestaña.
 */
export function VisionControls(props: Props) {
  const [enabled, setEnabled] = useState(true);
  const [status, setStatus] = useState<"off" | "loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("Permite la cámara. La primera carga necesita internet.");
  const [feedback, setFeedback] = useState(idle);
  const helpId = useId();
  const video = useRef<HTMLVideoElement>(null);
  const gate = useRef(new GestureGate());
  const latest = useRef(props);
  const failed = useRef(false);

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
      onError: (error) => { failed.current = true; setStatus("error"); setMessage(error); setEnabled(false); latest.current.onUnavailable?.(error); },
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
    return stop;
  }, [enabled]);

  // Al salir de la pestaña la cámara se apaga; al volver se enciende otra vez (salvo que haya fallado).
  useEffect(() => {
    const change = () => {
      if (document.hidden) {
        setEnabled(false);
        setStatus("off");
        setFeedback(idle);
        setMessage("Cámara apagada al salir de la pestaña.");
      } else if (!failed.current) {
        setStatus("loading");
        setMessage("Permite la cámara. La primera carga necesita internet.");
        setEnabled(true);
      }
    };
    document.addEventListener("visibilitychange", change);
    return () => document.removeEventListener("visibilitychange", change);
  }, []);

  const seen = status === "ready" && !props.disabled && feedback.candidate !== "confirm" ? feedback.candidate : null;
  const { onCandidate } = props;
  useEffect(() => onCandidate?.(seen), [seen, onCandidate]);

  const currentGesture = GESTURES.find((gesture) => gesture.action === feedback.candidate);
  const instruction = props.disabled ? "Espera a que Kusi termine."
    : feedback.releaseRequired ? "Retira la mano entre cada gesto."
      : currentGesture ? `${currentGesture.prompt} y espera a llenar la barra.`
        : "Apunta con el índice en una dirección.";

  return (
    <PieceFrame label={CAMERA_HOW} detail={CAMERA_PRIVACY} wide info>
      <div className="vision-controls">
        <div className="vision-head">
          <span className="vision-title">Cámara</span>
          {status === "ready" && props.disabled && <span className="vision-state">En pausa</span>}
        </div>
        <div className="vision-camera" data-ready={status === "ready" || undefined}>
          <video ref={video} className="vision-video" muted playsInline aria-label="Vista de tu cámara" aria-describedby={helpId} hidden={status !== "ready"} />
          {status !== "ready" && <div className="vision-placeholder"><Icon name="camera" size={32} /><span>{status === "loading" ? "Preparando los gestos…" : "Programa con tus manos"}</span></div>}
        </div>
        <p className="small" role={status === "error" ? "alert" : "status"}>{message}</p>
        {status === "ready" && (
          <div className="vision-feedback">
            <span className="small">{instruction}</span>
            <progress aria-label="Gesto sostenido" max={1} value={props.disabled ? 0 : feedback.progress} />
          </div>
        )}
        <span id={helpId} className="sr-only">{CAMERA_HOW} {CAMERA_PRIVACY}</span>
      </div>
    </PieceFrame>
  );
}

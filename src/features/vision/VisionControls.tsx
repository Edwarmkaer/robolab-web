import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { Command } from "@robolab/backend/domain/game/program";
import { Icon } from "../../shared/ui/Icon";
import { BLOCK_LOOK } from "../game/blocks";
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
};
/** Lo que explica el ⓘ de la cámara; el lector de pantalla lo oye una vez, junto al botón. */
const CAMERA_HOW = "Apunta con el índice y recoge los otros dedos.";
const CAMERA_PRIVACY = "La imagen se procesa en tu equipo. No se graba ni se envía.";
const idle: GestureFeedback = { action: null, candidate: null, progress: 0, releaseRequired: true };

export function VisionControls(props: Props) {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<"off" | "loading" | "ready" | "error">("off");
  const [message, setMessage] = useState("Activa la cámara y muestra una sola mano.");
  const [feedback, setFeedback] = useState(idle);
  // Ficha de gesto con su información abierta por un toque (en tablet no hay mouse).
  const [openTip, setOpenTip] = useState<string | null>(null);
  const helpId = useId();
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

  useEffect(() => {
    if (openTip === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenTip(null);
    const onPointer = (e: Event) => !(e.target as Element | null)?.closest?.(".vision-legend") && setOpenTip(null);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [openTip]);

  const currentGesture = GESTURES.find((gesture) => gesture.action === feedback.candidate);
  const instruction = props.disabled ? "Espera a que Kusi termine."
    : feedback.releaseRequired ? "Retira la mano entre cada gesto."
      : currentGesture ? `${currentGesture.prompt} y espera a llenar la barra.`
        : "Apunta con el índice en una dirección.";

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
      <ul className="vision-legend" aria-label="Guía de gestos">
        {GESTURES.map((gesture) => (
          <PieceFrame
            key={gesture.name}
            as="li"
            label={gesture.prompt}
            detail={gesture.label}
            open={openTip === gesture.name}
            onClick={() => setOpenTip(openTip === gesture.name ? null : gesture.name)}
          >
            <span className="gesture-tile" data-current={(status === "ready" && !props.disabled && feedback.candidate === gesture.action) || undefined}>
              <span className="gesture-emoji" aria-hidden="true">{gesture.emoji}</span>
              {gesture.action === "confirm" ? <Icon name="play" size={20} /> : <img className="gesture-piece" src={BLOCK_LOOK[gesture.action].icon} alt="" />}
              <span className="sr-only">{gesture.prompt}: {gesture.label}</span>
            </span>
          </PieceFrame>
        ))}
      </ul>
      <div className="row">
        <PieceFrame label={CAMERA_HOW} detail={CAMERA_PRIVACY} wide>
          {enabled ? (
            <button className="btn btn-sm" type="button" aria-describedby={helpId} onClick={() => { setEnabled(false); setStatus("off"); setFeedback(idle); setMessage("Cámara apagada. Tu programa sigue aquí."); }}><Icon name="cameraOff" />{status === "loading" ? "Cancelar" : "Apagar cámara"}</button>
          ) : (
            <button className="btn btn-sm" type="button" aria-describedby={helpId} disabled={props.disabled} onClick={() => { setStatus("loading"); setFeedback(idle); setMessage("Permite la cámara. La primera carga necesita internet."); setEnabled(true); }}><Icon name="camera" />Activar cámara</button>
          )}
        </PieceFrame>
        <span id={helpId} className="sr-only">{CAMERA_HOW} {CAMERA_PRIVACY}</span>
      </div>
    </div>
  );
}

/** Lo que el reconocedor de gestos descarga la primera vez (~12 MB): el motor wasm y el modelo. */
export const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm";
export const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";

const ASSETS = [`${WASM_BASE}/vision_wasm_internal.js`, `${WASM_BASE}/vision_wasm_internal.wasm`, MODEL_URL];

/**
 * Pide al navegador que vaya bajando el motor y el modelo mientras el niño lee la
 * ficha del reto, para que al empezar y encender la cámara ya estén en la caché.
 * No hace nada con el ahorro de datos activado ni si ya se pidió.
 */
export function prefetchGestureAssets(): void {
  if (typeof document === "undefined") return;
  if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return;
  for (const href of ASSETS) {
    if (document.head.querySelector(`link[rel="prefetch"][href="${href}"]`)) continue;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "fetch";
    link.crossOrigin = "anonymous";
    link.href = href;
    document.head.appendChild(link);
  }
}

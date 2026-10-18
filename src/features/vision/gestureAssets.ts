/**
 * Lo que el reconocedor de gestos descarga la primera vez (~12 MB comprimidos):
 * el motor wasm (~3,5 MB) y el modelo (~8 MB). Lo baja y lo prepara una sola vez
 * `recognizer.ts`; aquí solo están las direcciones.
 */
export const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm";
export const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";

import type { GestureSample } from "./gestureGate";

export type RecognitionMessage =
  | { type: "ready" }
  | { type: "sample"; sample: GestureSample; time: number }
  | { type: "error" };

type Callbacks = {
  onSample: (sample: GestureSample, time: number) => void;
  onReady: () => void;
  onError: (message: string) => void;
  isPaused: () => boolean;
};

/** Una sesión posee cámara, worker y fotogramas. stop también cancela permisos pendientes. */
export function startCameraSession(video: HTMLVideoElement, callbacks: Callbacks): () => void {
  let stopped = false;
  let stream: MediaStream | null = null;
  let worker: Worker | null = null;
  let animation = 0;
  let pending = false;
  let previousFrame = -Infinity;
  let previousVideoTime = -1;
  // La primera vez baja ~12 MB: con internet lento puede pasar de 30 s.
  const timeout = window.setTimeout(() => fail("La cámara tardó demasiado. Intenta otra vez o usa los botones."), 60000);

  function stop() {
    if (stopped) return;
    stopped = true;
    window.clearTimeout(timeout);
    window.cancelAnimationFrame(animation);
    worker?.terminate();
    stream?.getTracks().forEach((track) => {
      track.removeEventListener("ended", ended);
      track.stop();
    });
    video.pause();
    video.srcObject = null;
  }

  function fail(message: string) {
    if (stopped) return;
    stop();
    callbacks.onError(message);
  }

  function ended() {
    fail("La cámara se desconectó. Conéctala e intenta otra vez.");
  }

  function frame(time: number) {
    if (stopped) return;
    animation = window.requestAnimationFrame(frame);
    if (pending || callbacks.isPaused() || video.readyState < 2 || time - previousFrame < 100 || video.currentTime === previousVideoTime) return;
    pending = true;
    previousFrame = time;
    previousVideoTime = video.currentTime;
    void createImageBitmap(video).then((bitmap) => {
      if (stopped || callbacks.isPaused()) {
        bitmap.close();
        pending = false;
        return;
      }
      try {
        worker!.postMessage({ type: "frame", bitmap, time }, [bitmap]);
      } catch {
        bitmap.close();
        fail("No pudimos leer la cámara. Intenta otra vez o usa los botones.");
      }
    }).catch(() => fail("No pudimos leer la cámara. Intenta otra vez o usa los botones."));
  }

  async function start() {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      fail("La cámara necesita HTTPS o localhost. Puedes usar los botones.");
      return;
    }
    if (typeof Worker === "undefined" || typeof createImageBitmap === "undefined") {
      fail("Este navegador no permite usar los gestos. Prueba Chrome o Edge, o usa los botones.");
      return;
    }
    // El modelo se baja mientras el navegador pide el permiso de la cámara: las dos esperas se suman en vez de encadenarse.
    let modelReady = false;
    let cameraReady = false;
    function begin() {
      if (stopped || !modelReady || !cameraReady) return;
      void video.play().then(() => {
        if (stopped) return;
        window.clearTimeout(timeout);
        callbacks.onReady();
        animation = window.requestAnimationFrame(frame);
      }).catch(() => fail("No pudimos iniciar la cámara. Intenta otra vez o usa los botones."));
    }
    worker = new Worker(new URL("./recognizer.worker.ts", import.meta.url), { type: "module" });
    worker.onerror = () => fail("No pudimos cargar los gestos. Revisa tu conexión e intenta otra vez.");
    worker.onmessage = (event: MessageEvent<RecognitionMessage>) => {
      if (stopped) return;
      const message = event.data;
      if (message.type === "error") {
        fail("No pudimos cargar los gestos. Revisa tu conexión e intenta otra vez.");
      } else if (message.type === "ready") {
        modelReady = true;
        begin();
      } else {
        pending = false;
        if (!callbacks.isPaused()) callbacks.onSample(message.sample, message.time);
      }
    };
    worker.postMessage({ type: "init" });
    try {
      const acquired = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (stopped) {
        acquired.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = acquired;
      stream.getTracks().forEach((track) => track.addEventListener("ended", ended));
      video.srcObject = stream;
      cameraReady = true;
      begin();
    } catch (error) {
      const name = error instanceof Error || error instanceof DOMException ? error.name : "";
      fail(name === "NotAllowedError" || name === "SecurityError"
        ? "La cámara necesita tu permiso. Permítela en el navegador o usa los botones."
        : name === "NotFoundError"
          ? "No encontramos una cámara. Conecta una o usa los botones."
          : "No pudimos abrir la cámara. Cierra otras apps que la usen e intenta otra vez.");
    }
  }
  void start();
  return stop;
}

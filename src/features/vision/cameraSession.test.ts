// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { startCameraSession } from "./cameraSession";

class CameraWorker {
  static latest: CameraWorker;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  terminate = vi.fn();
  postMessage = vi.fn();
  constructor() { CameraWorker.latest = this; }
  send(data: unknown) { this.onmessage?.({ data } as MessageEvent); }
}

const stops: (() => void)[] = [];
afterEach(() => {
  stops.splice(0).forEach((stop) => stop());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function setup(getUserMedia?: () => Promise<MediaStream>) {
  const stopTrack = vi.fn();
  const track = { stop: stopTrack, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  const stream = { getTracks: () => [track] } as unknown as MediaStream;
  vi.stubGlobal("Worker", CameraWorker);
  vi.stubGlobal("isSecureContext", true);
  vi.stubGlobal("createImageBitmap", vi.fn());
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true, value: { getUserMedia: getUserMedia ?? vi.fn().mockResolvedValue(stream) },
  });
  const video = document.createElement("video");
  vi.spyOn(video, "play").mockResolvedValue();
  vi.spyOn(video, "pause").mockImplementation(() => undefined);
  const onError = vi.fn();
  const onReady = vi.fn();
  const onSample = vi.fn();
  const stop = startCameraSession(video, { onError, onReady, onSample, isPaused: () => false });
  stops.push(stop);
  return { stop, stopTrack, stream, video, onError, onReady, onSample };
}

describe("ciclo de vida de la cámara", () => {
  it("libera la cámara y el worker al salir", async () => {
    const camera = setup();
    await vi.waitFor(() => expect(camera.video.srcObject).toBe(camera.stream));
    CameraWorker.latest.send({ type: "ready" });
    await vi.waitFor(() => expect(camera.onReady).toHaveBeenCalledOnce());
    camera.stop();
    expect(camera.stopTrack).toHaveBeenCalledOnce();
    expect(CameraWorker.latest.terminate).toHaveBeenCalledOnce();
    expect(camera.video.srcObject).toBeNull();
  });

  it("detiene una cámara cuyo permiso llega después de salir", async () => {
    let grant!: (stream: MediaStream) => void;
    const permission = new Promise<MediaStream>((resolve) => { grant = resolve; });
    const camera = setup(() => permission);
    camera.stop();
    grant(camera.stream);
    await vi.waitFor(() => expect(camera.stopTrack).toHaveBeenCalledOnce());
    expect(camera.video.srcObject).not.toBe(camera.stream);
  });

  it("explica un permiso denegado y permite seguir con botones", async () => {
    const camera = setup(() => Promise.reject(new DOMException("Denied", "NotAllowedError")));
    await vi.waitFor(() => expect(camera.onError).toHaveBeenCalledWith(expect.stringContaining("permiso")));
    expect(camera.onReady).not.toHaveBeenCalled();
  });

  it("un error del modelo apaga la cámara y descarta resultados tardíos", async () => {
    const camera = setup();
    await vi.waitFor(() => expect(camera.video.srcObject).toBe(camera.stream));
    CameraWorker.latest.send({ type: "error" });
    expect(camera.stopTrack).toHaveBeenCalledOnce();
    expect(camera.onError).toHaveBeenCalledOnce();
    CameraWorker.latest.send({ type: "sample", sample: { name: "Thumb_Up", score: 1, hands: 1 }, time: 500 });
    expect(camera.onSample).not.toHaveBeenCalled();
  });
});

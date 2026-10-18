import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
import type { RecognitionMessage } from "./cameraSession";

type Request = { type: "init" } | { type: "frame"; bitmap: ImageBitmap; time: number };
let recognizer: GestureRecognizer | null = null;
const reply = (message: RecognitionMessage) => self.postMessage(message);

self.onmessage = async (event: MessageEvent<Request>) => {
  const request = event.data;
  try {
    if (request.type === "init") {
      const files = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm", true);
      recognizer = await GestureRecognizer.createFromOptions(files, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.6,
        minHandPresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });
      reply({ type: "ready" });
    } else if (recognizer) {
      const result = recognizer.recognizeForVideo(request.bitmap, request.time);
      const gesture = result.gestures[0]?.[0];
      reply({ type: "sample", sample: { name: gesture?.categoryName ?? "", score: gesture?.score ?? 0, hands: result.landmarks.length }, time: request.time });
    }
  } catch {
    reply({ type: "error" });
  } finally {
    if (request.type === "frame") request.bitmap.close();
  }
};

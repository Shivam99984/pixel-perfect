import type { Landmarks } from "./regions";

// Browser-only. MediaPipe is imported dynamically so it never runs during server rendering.
const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const FACE_MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const POSE_MODEL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

type Detectors = { face: import("@mediapipe/tasks-vision").FaceLandmarker; pose: import("@mediapipe/tasks-vision").PoseLandmarker };
let loading: Promise<Detectors> | null = null;

function load(): Promise<Detectors> {
  loading ??= (async () => {
    const { FilesetResolver, FaceLandmarker, PoseLandmarker } = await import("@mediapipe/tasks-vision");
    const fs = await FilesetResolver.forVisionTasks(WASM);
    const [face, pose] = await Promise.all([
      FaceLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: FACE_MODEL, delegate: "CPU" }, runningMode: "IMAGE", numFaces: 2, minFaceDetectionConfidence: 0.6 }),
      PoseLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: POSE_MODEL, delegate: "CPU" }, runningMode: "IMAGE", numPoses: 2, minPoseDetectionConfidence: 0.6 }),
    ]);
    return { face, pose };
  })().catch((e) => { loading = null; throw e; });
  return loading;
}

export async function detectLandmarks(src: string): Promise<Landmarks> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await img.decode();
  const d = await load();
  const f = d.face.detect(img);
  const p = d.pose.detect(img);
  return { faces: f.faceLandmarks, poses: p.landmarks };
}

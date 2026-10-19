import type { VisualFinding } from "@/features/analysis/contracts";

/** Regions we can locate reliably from face/body landmarks. Anything else stays text-only. */
export type Region = "eyes" | "mouth" | "nose" | "forehead" | "cheeks" | "chin" | "face" | "hands";

export interface Box { x: number; y: number; w: number; h: number } // normalized 0-1
export interface Point { x: number; y: number; visibility?: number | undefined }
export interface Landmarks { faces: Point[][]; poses: Point[][] }

const RULES: [Region, RegExp][] = [
  ["eyes", /\b(eyes?|iris(es)?|pupils?|eyelash(es)?|eyelids?|catchlights?|sclera)\b/],
  ["mouth", /\b(lips?|teeth|tooth|mouth|smile|gums?)\b/],
  ["nose", /\b(nose|nostrils?)\b/],
  ["forehead", /\bforehead\b/],
  ["cheeks", /\bcheeks?\b/],
  ["chin", /\b(chin|jaw|jawline)\b/],
  ["hands", /\b(hands?|fingers?|wrists?|knuckles?|thumbs?|fingernails?)\b/],
  ["face", /\b(face|facial)\b/],
];

/** Decide which region a finding refers to, or null if it can't be pinned down. */
export function resolveRegion(f: Pick<VisualFinding, "title" | "evidence" | "dimension">): Region | null {
  // "face" is too generic in evidence text ("strands across the face"), so it only counts in the title.
  for (const [text, inTitle] of [[f.title, true], [f.evidence, false]] as const) {
    const t = text.toLowerCase();
    for (const [region, re] of RULES) if ((inTitle || region !== "face") && re.test(t)) return region;
  }
  if (f.dimension === "eyes") return "eyes";
  if (f.dimension === "mouth") return "mouth";
  return null;
}

const FACE_IDX: Record<Exclude<Region, "hands" | "face">, number[]> = {
  eyes: [33, 133, 159, 145, 160, 144, 158, 153, 362, 263, 386, 374, 385, 380, 387, 373, 70, 300],
  mouth: [61, 291, 0, 17, 13, 14, 78, 308, 40, 270, 91, 321],
  nose: [1, 4, 5, 195, 98, 327, 2, 48, 278],
  forehead: [10, 67, 297, 109, 338, 151, 9, 104, 333],
  cheeks: [50, 101, 118, 205, 123, 147, 280, 330, 347, 425, 352, 376],
  chin: [152, 175, 199, 200, 148, 377, 176, 400],
};
const HAND_IDX = [15, 17, 19, 21, 16, 18, 20, 22];
export const MIN_HAND_VISIBILITY = 0.6;

function bbox(pts: Point[], pad = 0.18): Box | null {
  if (pts.length < 2) return null;
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const px = (x1 - x0) * pad + 0.01, py = (y1 - y0) * pad + 0.01;
  x0 = Math.max(0, x0 - px); y0 = Math.max(0, y0 - py); x1 = Math.min(1, x1 + px); y1 = Math.min(1, y1 + py);
  if (x1 - x0 <= 0 || y1 - y0 <= 0) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** Box for a region — null when landmarks are missing or ambiguous (e.g. several faces). */
export function boxForRegion(region: Region, lm: Landmarks): Box | null {
  if (region === "hands") {
    if (lm.poses.length !== 1) return null;
    const pts = HAND_IDX.map((i) => lm.poses[0]![i]).filter((p): p is Point => !!p && (p.visibility ?? 0) >= MIN_HAND_VISIBILITY);
    return bbox(pts, 0.6);
  }
  if (lm.faces.length !== 1) return null;
  const face = lm.faces[0]!;
  if (region === "face") return bbox(face, 0.05);
  return bbox(FACE_IDX[region].map((i) => face[i]).filter((p): p is Point => !!p));
}

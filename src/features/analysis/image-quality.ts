/** Deterministic, browser-side image-quality signals. Supporting evidence only — not a realism score. */
export const QUALITY_VERSION = "rl-iq-1.0";

export type QualityLevel = "good" | "fair" | "poor";
export interface QualityMetric { key: "sharpness" | "exposure" | "highlights" | "shadows" | "noise"; label: string; value: number; level: QualityLevel; note: string }
export interface ImageQuality { version: string; sampleSize: { w: number; h: number }; metrics: QualityMetric[] }

/** lum: grayscale 0-255, row-major, w*h. */
export function computeQuality(lum: Float32Array | number[], w: number, h: number): ImageQuality {
  const n = w * h;
  let sum = 0, hi = 0, lo = 0;
  for (let i = 0; i < n; i++) {
    const v = lum[i]!;
    sum += v;
    if (v >= 250) hi++;
    if (v <= 5) lo++;
  }
  const mean = sum / n;

  // Laplacian variance (sharpness) and median absolute Laplacian on flat areas (noise proxy).
  const lap: number[] = [];
  let lsum = 0, lsq = 0;
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const l = 4 * lum[i]! - lum[i - 1]! - lum[i + 1]! - lum[i - w]! - lum[i + w]!;
      lap.push(Math.abs(l));
      lsum += l;
      lsq += l * l;
    }
  const m = lap.length || 1;
  const sharp = lsq / m - (lsum / m) ** 2;
  lap.sort((a, b) => a - b);
  const noise = lap[Math.floor(lap.length * 0.5)] ?? 0;

  const pct = (c: number) => Math.round((c / n) * 1000) / 10;
  const hiP = pct(hi), loP = pct(lo);
  const r1 = (v: number) => Math.round(v * 10) / 10;

  return {
    version: QUALITY_VERSION,
    sampleSize: { w, h },
    metrics: [
      { key: "sharpness", label: "Sharpness", value: Math.round(sharp), level: sharp >= 300 ? "good" : sharp >= 80 ? "fair" : "poor", note: sharp >= 300 ? "Fine detail is present." : sharp >= 80 ? "Somewhat soft overall." : "Very soft or blurry; fine detail may be missing." },
      { key: "exposure", label: "Mean brightness", value: Math.round(mean), level: mean >= 70 && mean <= 190 ? "good" : mean >= 45 && mean <= 215 ? "fair" : "poor", note: mean < 70 ? "Image is dark." : mean > 190 ? "Image is bright." : "Balanced exposure." },
      { key: "highlights", label: "Clipped highlights", value: hiP, level: hiP <= 1 ? "good" : hiP <= 5 ? "fair" : "poor", note: `${hiP}% of pixels are pure white.` },
      { key: "shadows", label: "Crushed shadows", value: loP, level: loP <= 2 ? "good" : loP <= 8 ? "fair" : "poor", note: `${loP}% of pixels are pure black.` },
      { key: "noise", label: "Fine-grain level", value: r1(noise), level: noise <= 6 ? "good" : noise <= 14 ? "fair" : "poor", note: noise < 1.5 ? "Almost no grain — can read as over-smoothed." : noise <= 6 ? "Light, natural grain." : "Noticeable noise or compression artifacts." },
    ],
  };
}

/** Browser-only: sample an image at max 512px and compute metrics. */
export function measureImage(img: HTMLImageElement): ImageQuality {
  const scale = Math.min(1, 512 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(3, Math.round(img.naturalWidth * scale));
  const h = Math.max(3, Math.round(img.naturalHeight * scale));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) lum[i] = 0.299 * d[i * 4]! + 0.587 * d[i * 4 + 1]! + 0.114 * d[i * 4 + 2]!;
  return computeQuality(lum, w, h);
}

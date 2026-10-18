import { sniffImageType, validateDimensions, validateFileMeta, type SupportedMime } from "@/features/analysis/image-signature";
import { measureImage, type ImageQuality } from "@/features/analysis/image-quality";

export interface PreparedImage {
  file: File;
  mime: SupportedMime;
  width: number;
  height: number;
  originalUrl: string; // object URL of the untouched original
  analysisDataUrl: string; // derived copy (max 1600px JPEG) sent for analysis
  displayDataUrl: string; // derived copy (max 1024px) kept with the saved report
  quality: ImageQuality | null;
}

export class ImageValidationError extends Error {}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ImageValidationError("The file could not be decoded as an image."));
    img.src = url;
  });
}

function derive(img: HTMLImageElement, max: number, quality: number) {
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * scale);
  c.height = Math.round(img.naturalHeight * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", quality);
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const mime = sniffImageType(head);
  const metaIssue = validateFileMeta(file.size, mime);
  if (metaIssue) throw new ImageValidationError(metaIssue.message);
  const originalUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(originalUrl);
    const dimIssue = validateDimensions(img.naturalWidth, img.naturalHeight);
    if (dimIssue) throw new ImageValidationError(dimIssue.message);
    return {
      file,
      mime: mime!,
      width: img.naturalWidth,
      height: img.naturalHeight,
      originalUrl,
      analysisDataUrl: derive(img, 1600, 0.92),
      displayDataUrl: derive(img, 1024, 0.85),
      quality: (() => { try { return measureImage(img); } catch { return null; } })(),
    };
  } catch (e) {
    URL.revokeObjectURL(originalUrl);
    throw e;
  }
}

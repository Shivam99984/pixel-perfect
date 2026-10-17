export type SupportedMime = "image/jpeg" | "image/png" | "image/webp";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MIN_DIMENSION = 256;
export const MAX_DIMENSION = 8000;

/** Detect the real format from magic bytes — never trust extension or declared MIME. */
export function sniffImageType(bytes: Uint8Array): SupportedMime | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  )
    return "image/png";
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  )
    return "image/webp";
  return null;
}

export type ValidationIssue = { code: "unsupported" | "too_large" | "too_small" | "too_big_dims" | "empty"; message: string };

export function validateFileMeta(size: number, sniffed: SupportedMime | null): ValidationIssue | null {
  if (size === 0) return { code: "empty", message: "This file is empty." };
  if (size > MAX_FILE_BYTES) return { code: "too_large", message: "File is larger than 10 MB." };
  if (!sniffed) return { code: "unsupported", message: "Only JPEG, PNG or WebP images are supported." };
  return null;
}

export function validateDimensions(w: number, h: number): ValidationIssue | null {
  if (w < MIN_DIMENSION || h < MIN_DIMENSION)
    return { code: "too_small", message: `Image must be at least ${MIN_DIMENSION}×${MIN_DIMENSION}px.` };
  if (w > MAX_DIMENSION || h > MAX_DIMENSION)
    return { code: "too_big_dims", message: `Image must be at most ${MAX_DIMENSION}px on each side.` };
  return null;
}

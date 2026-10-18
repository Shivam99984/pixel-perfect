import { describe, expect, it } from "vitest";
import { computeQuality } from "./image-quality";

const get = (q: ReturnType<typeof computeQuality>, k: string) => q.metrics.find((m) => m.key === k)!;

describe("image quality", () => {
  it("flat mid-grey image is blurry, balanced, unclipped", () => {
    const q = computeQuality(new Array(64 * 64).fill(128), 64, 64);
    expect(get(q, "sharpness").level).toBe("poor");
    expect(get(q, "exposure").level).toBe("good");
    expect(get(q, "highlights").value).toBe(0);
  });
  it("checkerboard is sharp; all-white is clipped", () => {
    const cb = Array.from({ length: 64 * 64 }, (_, i) => ((i % 64) + Math.floor(i / 64)) % 2 ? 255 : 0);
    expect(get(computeQuality(cb, 64, 64), "sharpness").level).toBe("good");
    const white = computeQuality(new Array(100).fill(255), 10, 10);
    expect(get(white, "highlights").value).toBe(100);
    expect(get(white, "highlights").level).toBe("poor");
  });
});

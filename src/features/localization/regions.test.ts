import { describe, expect, it } from "vitest";
import { boxForRegion, resolveRegion, type Point } from "./regions";

const face: Point[] = Array.from({ length: 478 }, (_, i) => ({ x: 0.3 + (i % 20) * 0.02, y: 0.2 + Math.floor(i / 20) * 0.02 }));
const f = (title: string, dimension: any = "skin", evidence = "") => ({ title, dimension, evidence });

describe("issue location", () => {
  it("maps keywords to regions", () => {
    expect(resolveRegion(f("Glassy iris texture"))).toBe("eyes");
    expect(resolveRegion(f("Fused fingers", "anatomy"))).toBe("hands");
    expect(resolveRegion(f("Teeth too uniform"))).toBe("mouth");
  });
  it("keeps vague findings text-only", () => {
    expect(resolveRegion(f("Inconsistent shadow direction", "lighting"))).toBeNull();
    expect(resolveRegion(f("Plastic skin overall"))).toBeNull();
  });
  it("marks only with exactly one detected face", () => {
    expect(boxForRegion("eyes", { faces: [face], poses: [] })).not.toBeNull();
    expect(boxForRegion("eyes", { faces: [], poses: [] })).toBeNull();
    expect(boxForRegion("eyes", { faces: [face, face], poses: [] })).toBeNull();
  });
  it("skips hands that aren't clearly visible", () => {
    const pose = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.3 }));
    expect(boxForRegion("hands", { faces: [], poses: [pose] })).toBeNull();
  });
});
describe("generic wording", () => {
  it("doesn't mark a hair issue as the face", () => expect(resolveRegion({ title: "Overly regular hair strands", dimension: "hair", evidence: "Loose strands across the face" })).toBeNull());
});

import { describe, expect, it } from "vitest";
import { scoreAnalysis } from "./scoring";
import { sniffImageType, validateDimensions, validateFileMeta } from "./image-signature";
import { providerOutputSchema, type ProviderOutput } from "./contracts";
import { compareReports } from "@/features/comparison/compare";
import { getDemoReport } from "./demo";

type D = ProviderOutput["dimensions"][number];
const dim = (key: D["key"], score: number | null, confidence = 1, evidence_state: D["evidence_state"] = "observed"): D => ({ key, score, confidence, evidence_state, observations: [], strengths: [] });

describe("scoring", () => {
  it("excludes not-visible dimensions instead of scoring them", () => {
    const { score } = scoreAnalysis([dim("skin", 80), dim("eyes", 80), dim("lighting", 80), dim("mouth", null, 1, "not_visible")], "high");
    expect(score.excluded.map((e) => e.key)).toContain("mouth");
    expect(score.overall).toBe(80);
  });
  it("returns no score when coverage is below 40%", () => {
    const { score } = scoreAnalysis([dim("skin", 90), dim("mouth", 90)], "high"); // 0.30 coverage
    expect(score.overall).toBeNull();
  });
  it("drops dimensions with confidence under 0.3", () => {
    const { score } = scoreAnalysis([dim("skin", 90), dim("eyes", 90), dim("anatomy", 90), dim("hair", 10, 0.2)], "high");
    expect(score.overall).toBe(90);
  });
  it("lowers reliability for low-resolution images", () => {
    const dims = [dim("skin", 80, 0.8), dim("eyes", 80, 0.8), dim("lighting", 80, 0.8)];
    expect(scoreAnalysis(dims, "low").score.confidence).toBeLessThan(scoreAnalysis(dims, "high").score.confidence);
  });
});

describe("image validation", () => {
  it("detects real formats by content", () => {
    expect(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffImageType(new TextEncoder().encode("GIF89a........"))).toBeNull();
  });
  it("rejects files over 10 MB", () => {
    expect(validateFileMeta(10 * 1024 * 1024 + 1, "image/png")?.code).toBe("too_large");
  });
  it("rejects images smaller than 256px", () => {
    expect(validateDimensions(255, 800)?.code).toBe("too_small");
  });
});

describe("provider output validation", () => {
  it("rejects malformed provider responses", () => {
    expect(providerOutputSchema.safeParse({ summary: "x" }).success).toBe(false);
  });
});

describe("comparison", () => {
  it("is inconclusive when scores are within 5 points", () => {
    const a = getDemoReport();
    const b = { ...getDemoReport(), id: "b" };
    expect(compareReports([a, b], "photorealistic").verdict.kind).toBe("inconclusive");
  });
  it("is inconclusive across different methods", () => {
    const a = getDemoReport();
    const b = { ...getDemoReport(), id: "b", promptVersion: "other", score: { ...a.score, overall: 20 } };
    expect(compareReports([a, b], "photorealistic").verdict).toMatchObject({ kind: "inconclusive" });
  });
  it("picks a winner when same method and gap ≥ 5", () => {
    const a = getDemoReport();
    const b = { ...getDemoReport(), id: "b", score: { ...a.score, overall: (a.score.overall ?? 0) - 10 } };
    expect(compareReports([a, b], "photorealistic").verdict).toMatchObject({ kind: "winner", index: 0 });
  });
});

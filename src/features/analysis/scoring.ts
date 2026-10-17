import type { DimensionKey, ProviderOutput, RealismDimension, RealismScore } from "./contracts";

export const SCORING_VERSION = "rl-score-1.0";

/** Heuristic base weights. Not calibrated against human ratings. */
export const BASE_WEIGHTS: Record<DimensionKey, number> = {
  skin: 0.2,
  eyes: 0.18,
  mouth: 0.1,
  hair: 0.12,
  anatomy: 0.14,
  lighting: 0.13,
  coherence: 0.13,
};

export const MIN_DIMENSION_CONFIDENCE = 0.3;
export const MIN_COVERAGE = 0.4;
export const MIN_DIMENSIONS = 2;
const RESOLUTION_FACTOR = { low: 0.7, medium: 0.9, high: 1 } as const;

export function interpret(score: number | null): string {
  if (score === null) return "Not enough visible evidence to score responsibly.";
  if (score >= 85) return "Highly believable as a photograph — remaining issues are refinements.";
  if (score >= 70) return "Mostly convincing, with a few details that give it away on close inspection.";
  if (score >= 50) return "Mixed — several visible cues read as rendered rather than photographed.";
  return "Reads as clearly synthetic; core surfaces or structures need work.";
}

export function scoreAnalysis(
  dims: ProviderOutput["dimensions"],
  resolution: ProviderOutput["resolution_quality"],
): { score: RealismScore; dimensions: RealismDimension[] } {
  // De-duplicate: keep the first entry per dimension key.
  const seen = new Set<DimensionKey>();
  const unique = dims.filter((d) => (seen.has(d.key) ? false : (seen.add(d.key), true)));

  const excluded: RealismScore["excluded"] = [];
  const breakdown: RealismScore["breakdown"] = [];
  let coveredBase = 0;
  let weighted = 0;
  let effTotal = 0;
  let confSum = 0;

  const dimensions: RealismDimension[] = unique.map((d) => {
    const weight = BASE_WEIGHTS[d.key];
    let reason: string | null = null;
    if (d.evidence_state !== "observed") reason = `Evidence: ${d.evidence_state.replace("_", " ")}`;
    else if (d.score === null) reason = "No score provided";
    else if (d.confidence < MIN_DIMENSION_CONFIDENCE) reason = "Confidence too low";
    if (reason) {
      excluded.push({ key: d.key, reason });
      return { ...d, included: false, weight };
    }
    const eff = weight * (0.5 + 0.5 * d.confidence);
    coveredBase += weight;
    weighted += (d.score as number) * eff;
    effTotal += eff;
    confSum += d.confidence;
    breakdown.push({ key: d.key, score: d.score as number, effectiveWeight: eff });
    return { ...d, included: true, weight };
  });

  const totalBase = Object.values(BASE_WEIGHTS).reduce((a, b) => a + b, 0);
  const coverage = coveredBase / totalBase;
  const enough = breakdown.length >= MIN_DIMENSIONS && coverage >= MIN_COVERAGE;
  const overall = enough ? Math.round(weighted / effTotal) : null;
  const avgConf = breakdown.length ? confSum / breakdown.length : 0;
  const confidence = enough ? round2(avgConf * Math.min(1, 0.4 + coverage) * RESOLUTION_FACTOR[resolution]) : 0;

  // Normalize effective weights to sum to 1 for transparent display.
  const normalized = breakdown.map((b) => ({ ...b, effectiveWeight: round2(b.effectiveWeight / (effTotal || 1)) }));

  return {
    dimensions,
    score: { overall, interpretation: interpret(overall), coverage: round2(coverage), confidence, breakdown: normalized, excluded, version: SCORING_VERSION },
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

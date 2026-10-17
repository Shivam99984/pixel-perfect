import type { CharacterAnalysisResult, DimensionKey } from "@/features/analysis/contracts";

export const COMPARISON_GOALS = {
  photorealistic: { label: "Most photorealistic", dims: null },
  skin: { label: "Most natural-looking skin", dims: ["skin"] },
  facial: { label: "Best facial details", dims: ["skin", "eyes", "mouth", "hair"] },
  portrait: { label: "Best portrait photography", dims: ["skin", "eyes", "lighting", "coherence"] },
  full_body: { label: "Best full-body realism", dims: ["anatomy", "lighting", "coherence"] },
  balance: { label: "Best balance of realism and style", dims: null },
} as const satisfies Record<string, { label: string; dims: DimensionKey[] | null }>;
export type ComparisonGoal = keyof typeof COMPARISON_GOALS;

/** Score differences smaller than this are treated as indistinguishable. */
export const MIN_MEANINGFUL_DIFF = 5;
export const MAX_COVERAGE_GAP = 0.3;

export interface ComparisonResult {
  goalScores: (number | null)[];
  comparable: boolean;
  caveats: string[];
  verdict: { kind: "winner"; index: number; margin: number } | { kind: "inconclusive"; reason: string };
  perDimension: { key: DimensionKey; scores: (number | null)[] }[];
}

function goalScore(r: CharacterAnalysisResult, goal: ComparisonGoal): number | null {
  const dims = COMPARISON_GOALS[goal].dims as readonly DimensionKey[] | null;
  if (!dims) return r.score.overall;
  const parts = r.score.breakdown.filter((b) => dims.includes(b.key));
  if (!parts.length) return null;
  const w = parts.reduce((a, b) => a + b.effectiveWeight, 0);
  return Math.round(parts.reduce((a, b) => a + b.score * b.effectiveWeight, 0) / (w || 1));
}

export function compareReports(reports: CharacterAnalysisResult[], goal: ComparisonGoal): ComparisonResult {
  const caveats: string[] = [];
  const first = reports[0]!;
  const sameMethod = reports.every(
    (r) => r.score.version === first.score.version && r.promptVersion === first.promptVersion && r.model === first.model && r.demo === first.demo,
  );
  if (!sameMethod) caveats.push("These reports were produced with different methods or versions, so scores are not directly comparable.");
  const covs = reports.map((r) => r.score.coverage);
  const coverageGap = Math.max(...covs) - Math.min(...covs);
  if (coverageGap > MAX_COVERAGE_GAP) caveats.push("Evidence coverage differs a lot between images (e.g. different framing), which weakens the comparison.");
  const res = new Set(reports.map((r) => r.overview.resolution_quality));
  if (res.size > 1) caveats.push("The images have different effective resolution.");
  if (goal === "balance") caveats.push("Artistic preference is yours to judge — this view only ranks photographic realism.");

  const goalScores = reports.map((r) => goalScore(r, goal));
  const keys = Array.from(new Set(reports.flatMap((r) => r.dimensions.map((d) => d.key))));
  const perDimension = keys.map((key) => ({
    key,
    scores: reports.map((r) => r.score.breakdown.find((b) => b.key === key)?.score ?? null),
  }));

  const comparable = sameMethod && coverageGap <= MAX_COVERAGE_GAP;
  let verdict: ComparisonResult["verdict"];
  if (!sameMethod) verdict = { kind: "inconclusive", reason: "Different analysis methods." };
  else if (goalScores.some((s) => s === null)) verdict = { kind: "inconclusive", reason: "At least one image lacks enough evidence for this goal." };
  else {
    const ranked = goalScores.map((s, i) => ({ s: s as number, i })).sort((a, b) => b.s - a.s);
    const margin = ranked[0]!.s - ranked[1]!.s;
    if (margin < MIN_MEANINGFUL_DIFF) verdict = { kind: "inconclusive", reason: `Scores are within ${MIN_MEANINGFUL_DIFF} points — too close to call.` };
    else if (!comparable) verdict = { kind: "inconclusive", reason: "Evidence coverage is too different to rank fairly." };
    else verdict = { kind: "winner", index: ranked[0]!.i, margin };
  }
  return { goalScores, comparable, caveats, verdict, perDimension };
}

/** Findings whose dimension appears flagged in every report vs. only one. */
export function sharedAndUniqueFindings(reports: CharacterAnalysisResult[]) {
  const sets = reports.map((r) => new Set(r.findings.map((f) => f.dimension)));
  const shared = [...sets[0]!].filter((d) => sets.every((s) => s.has(d)));
  const unique = reports.map((r) => r.findings.filter((f) => !shared.includes(f.dimension)));
  return { shared, unique };
}

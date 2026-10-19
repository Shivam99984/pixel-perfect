import type { AnalysisGoal, CharacterAnalysisResult, ProviderOutput, Severity } from "./contracts";
import { scoreAnalysis } from "./scoring";

const SEVERITY_ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

export function buildReport(args: {
  id: string;
  demo: boolean;
  label: string;
  goal: AnalysisGoal;
  provider: string;
  model: string;
  promptVersion: string;
  image: CharacterAnalysisResult["image"];
  output: ProviderOutput;
  quality?: CharacterAnalysisResult["quality"];
}): CharacterAnalysisResult {
  const { output } = args;
  const { score, dimensions } = scoreAnalysis(output.dimensions, output.resolution_quality);
  // Drop findings attached to dimensions the provider itself said were not visible.
  const hidden = new Set(dimensions.filter((d) => d.evidence_state === "not_visible").map((d) => d.key));
  const findings = output.findings
    .filter((f) => !hidden.has(f.dimension))
    .map((f, i) => ({ ...f, id: `f${i + 1}` }))
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.confidence - a.confidence);
  return {
    id: args.id,
    demo: args.demo,
    label: args.label,
    goal: args.goal,
    createdAt: new Date().toISOString(),
    provider: args.provider,
    model: args.model,
    promptVersion: args.promptVersion,
    image: args.image,
    overview: {
      is_human_character: output.is_human_character,
      framing: output.framing,
      resolution_quality: output.resolution_quality,
      style: output.style,
      summary: output.summary,
    },
    dimensions,
    findings,
    preserve: output.preserve_traits,
    score,
    quality: args.quality ?? null,
  };
}

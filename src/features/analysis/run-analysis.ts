import type { AnalysisGoal, CharacterAnalysisResult } from "./contracts";
import { analyzeCharacter } from "./analyze.functions";
import { buildReport } from "./report-builder";
import type { PreparedImage } from "@/features/upload/prepare-image";

export class AnalysisFailure extends Error {
  constructor(message: string, public retryable: boolean, public code: string) {
    super(message);
  }
}

export async function runAnalysis(img: PreparedImage, goal: AnalysisGoal, label: string): Promise<CharacterAnalysisResult> {
  let res;
  try {
    res = await analyzeCharacter({ data: { imageDataUrl: img.analysisDataUrl, goal } });
  } catch {
    throw new AnalysisFailure("The analysis request failed. Check your connection and retry.", true, "network");
  }
  if (!res.ok) throw new AnalysisFailure(res.message, res.retryable, res.code);
  return buildReport({
    id: crypto.randomUUID(),
    demo: false,
    label: label.trim() || img.file.name.replace(/\.[^.]+$/, ""),
    goal,
    provider: res.provider,
    model: res.model,
    promptVersion: res.promptVersion,
    image: { displayUrl: img.displayDataUrl, width: img.width, height: img.height, filename: img.file.name, mime: img.mime, size: img.file.size },
    output: res.output,
    quality: img.quality,
  });
}

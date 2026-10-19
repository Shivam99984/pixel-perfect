import { z } from "zod";
import type { ImageQuality } from "./image-quality";

export const DIMENSION_KEYS = ["skin", "eyes", "mouth", "hair", "anatomy", "lighting", "coherence"] as const;
export type DimensionKey = (typeof DIMENSION_KEYS)[number];

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  skin: "Skin realism",
  eyes: "Eyes",
  mouth: "Mouth, lips & teeth",
  hair: "Hair",
  anatomy: "Anatomy & proportions",
  lighting: "Lighting & shadows",
  coherence: "Photographic coherence",
};

export const EVIDENCE_STATES = ["observed", "not_observed", "not_visible", "insufficient", "uncertain"] as const;
export type EvidenceState = (typeof EVIDENCE_STATES)[number];

export const SEVERITIES = ["high", "medium", "low"] as const;
/** Map legacy four-level severities (saved reports) to the three-level scale. */
export function normalizeSeverity(s: string): Severity {
  if (s === "critical" || s === "high") return "high";
  if (s === "moderate" || s === "medium") return "medium";
  return "low";
}
export type Severity = (typeof SEVERITIES)[number];

export const ANALYSIS_GOALS = {
  max_photorealism: "Maximum photorealism",
  skin_detail: "Natural skin and facial detail",
  portrait: "Professional portrait realism",
  full_body: "Full-body realism",
  reference_sheet: "Character reference-sheet review",
  general: "General visual believability",
} as const;
export type AnalysisGoal = keyof typeof ANALYSIS_GOALS;

/** Raw provider output — validated before anything else touches it. */
export const providerDimensionSchema = z.object({
  key: z.enum(DIMENSION_KEYS),
  evidence_state: z.enum(EVIDENCE_STATES),
  score: z.number().min(0).max(100).nullable(),
  confidence: z.number().min(0).max(1),
  observations: z.array(z.string()).max(8),
  strengths: z.array(z.string()).max(6),
});

export const providerFindingSchema = z.object({
  title: z.string().min(1),
  dimension: z.enum(DIMENSION_KEYS),
  severity: z.enum(SEVERITIES),
  evidence: z.string().min(1),
  correction: z.string().min(1),
  why_artificial: z.string(),
  what_to_preserve: z.string(),
  editing_approach: z.string(),
  confidence: z.number().min(0).max(1),
});

export const providerOutputSchema = z.object({
  is_human_character: z.boolean(),
  framing: z.enum(["close_up", "portrait", "half_body", "full_body", "group", "other"]),
  resolution_quality: z.enum(["low", "medium", "high"]),
  style: z.enum(["photographic", "stylized", "illustration", "mixed"]),
  summary: z.string(),
  dimensions: z.array(providerDimensionSchema),
  findings: z.array(providerFindingSchema).max(14),
  preserve_traits: z.object({
    identity: z.string(),
    skin_tone: z.string(),
    eye_color: z.string(),
    hair: z.string(),
    age_appearance: z.string(),
    clothing: z.string(),
    pose_and_camera: z.string(),
    background: z.string(),
  }),
});
export type ProviderOutput = z.infer<typeof providerOutputSchema>;

export type RealismDimension = z.infer<typeof providerDimensionSchema> & { included: boolean; weight: number };
export type VisualFinding = z.infer<typeof providerFindingSchema> & { id: string };
export type PreserveTraits = ProviderOutput["preserve_traits"];

export interface RealismScore {
  overall: number | null;
  interpretation: string;
  coverage: number; // 0-1, share of base weight that had usable evidence
  confidence: number; // 0-1, reliability of the overall score (not the score itself)
  breakdown: { key: DimensionKey; score: number; effectiveWeight: number }[];
  excluded: { key: DimensionKey; reason: string }[];
  version: string;
}

export interface CharacterAnalysisResult {
  id: string;
  demo: boolean;
  label: string;
  goal: AnalysisGoal;
  createdAt: string;
  provider: string;
  model: string;
  promptVersion: string;
  image: { displayUrl: string; width: number; height: number; filename: string; mime: string; size: number };
  overview: Pick<ProviderOutput, "is_human_character" | "framing" | "resolution_quality" | "style" | "summary">;
  dimensions: RealismDimension[];
  findings: VisualFinding[];
  preserve: PreserveTraits;
  score: RealismScore;
  quality?: ImageQuality | null;
}

export type AnalysisErrorCode =
  | "invalid_image"
  | "not_configured"
  | "rate_limited"
  | "credits"
  | "denied"
  | "provider_error"
  | "malformed_response"
  | "cancelled";

export type AnalyzeResponse =
  | { ok: true; output: ProviderOutput; provider: string; model: string; promptVersion: string }
  | { ok: false; code: AnalysisErrorCode; message: string; retryable: boolean };

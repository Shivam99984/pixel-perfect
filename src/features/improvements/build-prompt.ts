import type { PreserveTraits, VisualFinding } from "@/features/analysis/contracts";

export const TARGET_TOOLS = {
  generic: "Any image editor",
  photoshop: "Photoshop Generative Fill",
  sd: "Stable Diffusion / ComfyUI img2img",
  flux: "Flux Kontext",
  midjourney: "Midjourney (Vary Region)",
} as const;
export type TargetTool = keyof typeof TARGET_TOOLS;
export type Strength = "subtle" | "moderate" | "strong";

export const PRESERVE_KEYS: { key: keyof PreserveTraits; label: string }[] = [
  { key: "identity", label: "Identity & facial features" },
  { key: "skin_tone", label: "Skin tone" },
  { key: "eye_color", label: "Eye color" },
  { key: "hair", label: "Hair color & style" },
  { key: "age_appearance", label: "Age appearance" },
  { key: "clothing", label: "Clothing" },
  { key: "pose_and_camera", label: "Pose & camera angle" },
  { key: "background", label: "Background & composition" },
];

const STRENGTH_TEXT: Record<Strength, string> = {
  subtle: "Make subtle, minimal adjustments only",
  moderate: "Make clear but restrained adjustments",
  strong: "Make thorough corrections",
};
const DENOISE: Record<Strength, string> = { subtle: "0.2–0.3", moderate: "0.35–0.45", strong: "0.5–0.6" };

export function buildImprovementPrompt(opts: {
  findings: VisualFinding[];
  preserve: PreserveTraits;
  tool: TargetTool;
  strength: Strength;
  unlocked: Set<keyof PreserveTraits>; // traits the user allows to change
  avoid: string;
}): string {
  const { findings, preserve, tool, strength, unlocked, avoid } = opts;
  if (!findings.length) return "";
  const fixes = findings.map((f) => `- ${f.title}: ${f.correction}`).join("\n");
  const keep = PRESERVE_KEYS.filter((p) => !unlocked.has(p.key) && preserve[p.key] && !/^not visible$/i.test(preserve[p.key]))
    .map((p) => `- ${p.label}: ${preserve[p.key]}`)
    .join("\n");
  const lines = [
    `${STRENGTH_TEXT[strength]} to improve photographic realism of this exact character. Change only the following:`,
    fixes,
    "",
    "Keep everything else identical, including:",
    keep || "- The character's identity and overall composition",
  ];
  if (avoid.trim()) lines.push("", `Do not: ${avoid.trim()}`);
  lines.push("", "Result should read as an unretouched photograph from the same camera and lighting.");
  if (tool === "sd") lines.push("", `Suggested: img2img or inpaint the affected regions with denoise ${DENOISE[strength]}.`);
  if (tool === "photoshop" || tool === "midjourney") lines.push("", "Tip: select only the affected region before applying this prompt.");
  if (tool === "flux") lines.push("", "Tip: phrase as an edit instruction and keep the reference image attached.");
  return lines.join("\n");
}

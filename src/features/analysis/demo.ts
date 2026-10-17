import heroPortrait from "@/assets/hero-portrait.jpg";
import type { CharacterAnalysisResult, ProviderOutput } from "./contracts";
import { buildReport } from "./report-builder";

/** Illustrative fixture. Hand-written — NOT produced by analyzing any image. */
const DEMO_OUTPUT: ProviderOutput = {
  is_human_character: true,
  framing: "close_up",
  resolution_quality: "high",
  style: "photographic",
  summary:
    "Strong low-key lighting and visible skin microtexture sell the image as a photograph. The main giveaways are an overly uniform specular sheen on the cheek and slightly too-clean strand separation in the hair.",
  dimensions: [
    { key: "skin", evidence_state: "observed", score: 82, confidence: 0.8, observations: ["Pores and freckles visible across the cheek", "Highlight on the cheekbone is broad and evenly glossy"], strengths: ["Natural tonal variation"] },
    { key: "eyes", evidence_state: "observed", score: 78, confidence: 0.7, observations: ["Single catchlight consistent with window light", "Shadowed eye is too dark to judge"], strengths: ["Believable iris detail"] },
    { key: "mouth", evidence_state: "observed", score: 84, confidence: 0.65, observations: ["Lip texture present; teeth not visible"], strengths: [] },
    { key: "hair", evidence_state: "observed", score: 70, confidence: 0.7, observations: ["Loose strands are evenly spaced and uniformly sharp"], strengths: ["Natural flyaways"] },
    { key: "anatomy", evidence_state: "observed", score: 86, confidence: 0.6, observations: ["Proportions and ear placement plausible"], strengths: [] },
    { key: "lighting", evidence_state: "observed", score: 88, confidence: 0.8, observations: ["Key and rim light directions are consistent"], strengths: ["Convincing falloff into shadow"] },
    { key: "coherence", evidence_state: "observed", score: 80, confidence: 0.7, observations: ["Background noise is cleaner than skin noise"], strengths: [] },
  ],
  findings: [
    { title: "Uniform specular sheen on cheek", dimension: "skin", severity: "moderate", evidence: "The lit cheek has a broad, evenly glossy highlight without breakup from pores.", correction: "Break up the highlight with fine pore-level specular variation.", why_artificial: "Real skin scatters light unevenly; a smooth glossy patch reads as rendered.", what_to_preserve: "Freckles, skin tone and lighting direction.", editing_approach: "Inpaint the highlight area at low strength or use frequency separation.", confidence: 0.75 },
    { title: "Overly regular hair strands", dimension: "hair", severity: "minor", evidence: "Loose strands across the face are evenly spaced and uniformly in focus.", correction: "Vary strand thickness and focus; let some strands blur with depth.", why_artificial: "Real flyaways vary in thickness and fall in and out of focus.", what_to_preserve: "Hair color and overall shape.", editing_approach: "Inpaint the strands region with a hair-detail prompt.", confidence: 0.6 },
    { title: "Background cleaner than subject", dimension: "coherence", severity: "minor", evidence: "Shadow areas of the background lack the sensor noise visible on skin.", correction: "Add matching fine grain across the whole frame.", why_artificial: "A single camera produces consistent noise everywhere.", what_to_preserve: "Composition and tonality.", editing_approach: "Apply uniform film grain at export.", confidence: 0.55 },
  ],
  preserve_traits: {
    identity: "Oval face, defined brows, straight nose, full lower lip",
    skin_tone: "Light skin with warm undertone and freckles",
    eye_color: "Grey-green",
    hair: "Dark brown, loosely tied back with face-framing strands",
    age_appearance: "Late 20s",
    clothing: "Dark knit sweater",
    pose_and_camera: "Three-quarter turn, close-up, eye level",
    background: "Plain dark graphite",
  },
};

export function getDemoReport(): CharacterAnalysisResult {
  return buildReport({
    id: "demo",
    demo: true,
    label: "Demo — Window light portrait",
    goal: "portrait",
    provider: "demo-fixture",
    model: "none",
    promptVersion: "demo",
    image: { displayUrl: heroPortrait, width: 1024, height: 1280, filename: "demo.jpg", mime: "image/jpeg", size: 0 },
    output: DEMO_OUTPUT,
  });
}

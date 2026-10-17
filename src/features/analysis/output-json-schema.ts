import { DIMENSION_KEYS, EVIDENCE_STATES, SEVERITIES } from "./contracts";

const str = { type: "string" };
const num01 = { type: "number" };
const obj = (properties: Record<string, unknown>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

/** Strict JSON schema mirroring providerOutputSchema (strict mode: all required, no extras). */
export const OUTPUT_JSON_SCHEMA = obj({
  is_human_character: { type: "boolean" },
  framing: { type: "string", enum: ["close_up", "portrait", "half_body", "full_body", "group", "other"] },
  resolution_quality: { type: "string", enum: ["low", "medium", "high"] },
  style: { type: "string", enum: ["photographic", "stylized", "illustration", "mixed"] },
  summary: str,
  dimensions: {
    type: "array",
    items: obj({
      key: { type: "string", enum: [...DIMENSION_KEYS] },
      evidence_state: { type: "string", enum: [...EVIDENCE_STATES] },
      score: { type: ["number", "null"] },
      confidence: num01,
      observations: { type: "array", items: str },
      strengths: { type: "array", items: str },
    }),
  },
  findings: {
    type: "array",
    items: obj({
      title: str,
      dimension: { type: "string", enum: [...DIMENSION_KEYS] },
      severity: { type: "string", enum: [...SEVERITIES] },
      evidence: str,
      correction: str,
      why_artificial: str,
      what_to_preserve: str,
      editing_approach: str,
      confidence: num01,
    }),
  },
  preserve_traits: obj({
    identity: str,
    skin_tone: str,
    eye_color: str,
    hair: str,
    age_appearance: str,
    clothing: str,
    pose_and_camera: str,
    background: str,
  }),
});

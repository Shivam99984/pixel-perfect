import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ANALYSIS_GOALS, providerOutputSchema, type AnalyzeResponse } from "./contracts";
import { sniffImageType } from "./image-signature";
import { OUTPUT_JSON_SCHEMA } from "./output-json-schema";
import { buildSystemPrompt, PROMPT_VERSION } from "./prompts";

const MODEL = "openai/gpt-6-astra";
const PROVIDER = "lovable-ai-gateway";
const MAX_DATA_URL = 4_500_000; // derived analysis copy, ~3.3 MB of bytes

const inputSchema = z.object({
  imageDataUrl: z.string().max(MAX_DATA_URL).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/),
  goal: z.enum(Object.keys(ANALYSIS_GOALS) as [keyof typeof ANALYSIS_GOALS, ...(keyof typeof ANALYSIS_GOALS)[]]),
});

export const analyzeCharacter = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<AnalyzeResponse> => {
    // Server-side content check: decode the first bytes and verify the real format.
    const b64 = data.imageDataUrl.split(",")[1] ?? "";
    const head = Uint8Array.from(atob(b64.slice(0, 32)), (c) => c.charCodeAt(0));
    if (!sniffImageType(head)) return { ok: false, code: "invalid_image", message: "The image content is not a valid JPEG, PNG or WebP.", retryable: false };

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false, code: "not_configured", message: "The analysis provider is not configured.", retryable: false };

    let res: Response;
    try {
      res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
        body: JSON.stringify({
          model: MODEL,
          stream: true,
          store: false,
          reasoning: { effort: "low" },
          instructions: buildSystemPrompt(data.goal),
          input: [
            {
              role: "user",
              content: [
                { type: "input_text", text: "Analyze this character image for perceived photographic realism." },
                { type: "input_image", image_url: data.imageDataUrl },
              ],
            },
          ],
          text: { format: { type: "json_schema", name: "realism_analysis", strict: true, schema: OUTPUT_JSON_SCHEMA } },
        }),
      });
    } catch {
      return { ok: false, code: "provider_error", message: "Could not reach the analysis provider.", retryable: true };
    }

    if (!res.ok) {
      let message = "The analysis provider returned an error.";
      try {
        const j = (await res.json()) as { message?: string; error?: { message?: string } };
        message = j.message || j.error?.message || message;
      } catch { /* ignore */ }
      if (res.status === 429) return { ok: false, code: "rate_limited", message: "Too many analyses right now. Please wait a moment and retry.", retryable: true };
      if (res.status === 402) return { ok: false, code: "credits", message, retryable: false };
      if (res.status === 403) return { ok: false, code: "denied", message, retryable: false };
      if (res.status === 401) return { ok: false, code: "not_configured", message: "The analysis provider key is invalid.", retryable: false };
      return { ok: false, code: "provider_error", message: res.status >= 500 ? "The provider had a temporary problem." : message, retryable: res.status >= 500 };
    }

    // Consume the SSE stream server-side and collect the final text.
    let text = "";
    let failed: string | null = null;
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n\n")) !== -1) {
        const chunk = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const ev = JSON.parse(payload) as { type?: string; delta?: string; message?: string; response?: { error?: { message?: string } } };
            if (ev.type === "response.output_text.delta" && ev.delta) text += ev.delta;
            else if (ev.type === "response.failed" || ev.type === "error")
              failed = ev.response?.error?.message || ev.message || "Analysis failed.";
            else if (ev.type === "response.refusal.delta") failed = "The provider declined to analyze this image.";
          } catch { /* skip partial */ }
        }
      }
    }
    if (failed) return { ok: false, code: "provider_error", message: failed, retryable: false };

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ok: false, code: "malformed_response", message: "The provider returned an unreadable result. Try again.", retryable: true };
    }
    const result = providerOutputSchema.safeParse(parsed);
    if (!result.success) return { ok: false, code: "malformed_response", message: "The provider result failed validation. Try again.", retryable: true };

    return { ok: true, output: result.data, provider: PROVIDER, model: MODEL, promptVersion: PROMPT_VERSION };
  });

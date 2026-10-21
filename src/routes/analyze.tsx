import { useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageDropzone } from "@/components/image-dropzone";
import { AnalysisProgress } from "@/components/analysis-progress";
import { AnalysisFailure, runAnalysis } from "@/features/analysis/run-analysis";
import { saveReport } from "@/features/analysis/report-store";
import type { PreparedImage } from "@/features/upload/prepare-image";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "Analyze a character — RealismLab AI" },
      { name: "description", content: "Upload an AI-generated character and get a structured photographic-realism report." },
      { property: "og:title", content: "Analyze a character — RealismLab AI" },
      { property: "og:description", content: "Upload an AI character image and see what makes it look artificial." },
    ],
  }),
  component: AnalyzePage,
});

function AnalyzePage() {
  const navigate = useNavigate();
  const [img, setImg] = useState<PreparedImage | null>(null);
  const [label, setLabel] = useState("");
    const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AnalysisFailure | null>(null);
  const cancelled = useRef(false);

  async function start() {
    if (!img || busy) return;
    setBusy(true);
    setError(null);
    cancelled.current = false;
    try {
      const report = await runAnalysis(img, "max_photorealism", label);
      if (cancelled.current) return;
      try {
        saveReport(report);
      } catch {
        toast.error("Report created but couldn't be saved in this browser.");
      }
      navigate({ to: "/reports/$id", params: { id: report.id } });
    } catch (e) {
      if (!cancelled.current) setError(e instanceof AnalysisFailure ? e : new AnalysisFailure("Unexpected error.", true, "unknown"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="eyebrow">Single analysis</p>
      <h1 className="font-display mt-2 text-4xl">Analyze a character</h1>
      <p className="mt-2 text-muted-foreground">One clear image of your character works best. A close-up gives the most facial detail.</p>

      <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ImageDropzone value={img} onChange={(v) => { setImg(v); setError(null); }} disabled={busy} />
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="label" className="eyebrow">Character label (optional)</label>
            <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} placeholder="e.g. Mara v3" disabled={busy} />
          </div>
          <div className="flex gap-2">
            <Button size="lg" className="flex-1" disabled={!img || busy} onClick={start}>{busy ? "Analyzing…" : "Analyze realism"}</Button>
            {busy && <Button size="lg" variant="outline" onClick={() => { cancelled.current = true; setBusy(false); }}>Cancel</Button>}
          </div>
          {busy && <AnalysisProgress />}
          {error && (
            <div role="alert" className="flex gap-3 rounded-lg border border-bad/30 bg-bad/10 p-4 text-sm">
              <AlertCircle className="size-5 shrink-0 text-bad" />
              <div className="space-y-2">
                <p>{error.message}</p>
                {error.retryable && <Button size="sm" variant="outline" onClick={start}>Retry</Button>}
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            When you press Analyze, a resized copy of this image is sent to an external AI vision provider. Your original file stays on your device. Not used for training.
          </p>
          <p className="text-xs text-muted-foreground">
            Just exploring? <Link to="/reports/$id" params={{ id: "demo" }} className="text-primary hover:underline">Open the demo report</Link> (illustrative data).
          </p>
        </div>
      </div>
    </div>
  );
}

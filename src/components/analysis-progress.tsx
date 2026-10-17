import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const STAGES = ["Validating image", "Preparing image", "Inspecting visible regions", "Evaluating realism dimensions", "Generating improvement suggestions", "Preparing the report"];

/** Indeterminate: stage labels are illustrative pacing, the provider does not report real progress. */
export function AnalysisProgress() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => Math.min(x + 1, STAGES.length - 1)), 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <div role="status" aria-live="polite" className="panel flex items-center gap-3 p-4">
      <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
      <div>
        <div className="text-sm">{STAGES[i]}…</div>
        <div className="text-xs text-muted-foreground">Usually 20–60 seconds. Exact progress isn’t available from the provider.</div>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";
import type { ImageQuality, QualityLevel } from "@/features/analysis/image-quality";

const TONE: Record<QualityLevel, string> = { good: "text-good", fair: "text-warn", poor: "text-bad" };

export function QualityPanel({ q }: { q: ImageQuality }) {
  return (
    <section aria-labelledby="iq-h">
      <h2 id="iq-h" className="eyebrow mb-3">Image-quality checks</h2>
      <div className="panel divide-y divide-border">
        {q.metrics.map((m) => (
          <div key={m.key} className="flex items-center gap-3 px-4 py-2.5 text-sm">
            <span className="w-36 shrink-0 font-medium">{m.label}</span>
            <span className="flex-1 text-xs text-muted-foreground">{m.note}</span>
            <span className={cn("font-mono text-xs capitalize", TONE[m.level])}>{m.level}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Measured on your device from pixel data ({q.version}). Supporting evidence only — these do not change the realism score, and good photo quality does not by itself mean realism.
      </p>
    </section>
  );
}

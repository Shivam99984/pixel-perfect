import { cn } from "@/lib/utils";
import type { EvidenceState, Severity } from "@/features/analysis/contracts";

export function scoreTone(s: number | null) {
  if (s === null) return "text-muted-foreground";
  if (s >= 80) return "text-good";
  if (s >= 60) return "text-warn";
  return "text-bad";
}

export function ScoreRing({ score, size = 132 }: { score: number | null; size?: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = score === null ? 0 : score / 100;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} className={cn("transition-all duration-700", scoreTone(score))} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className={cn("font-mono text-3xl font-medium", scoreTone(score))}>{score ?? "—"}</div>
          <div className="eyebrow">{score === null ? "no score" : "/ 100"}</div>
        </div>
      </div>
    </div>
  );
}

const SEV: Record<Severity, { label: string; cls: string }> = {
  critical: { label: "Critical", cls: "bg-bad/15 text-bad border-bad/30" },
  high: { label: "High priority", cls: "bg-bad/10 text-bad border-bad/20" },
  moderate: { label: "Moderate", cls: "bg-warn/10 text-warn border-warn/25" },
  minor: { label: "Minor", cls: "bg-muted text-muted-foreground border-border" },
};

export function SeverityBadge({ s }: { s: Severity }) {
  return <span className={cn("rounded-md border px-1.5 py-0.5 text-[11px] font-medium", SEV[s].cls)}>{SEV[s].label}</span>;
}

const EV: Record<EvidenceState, string> = {
  observed: "Observed",
  not_observed: "Not observed",
  not_visible: "Not visible",
  insufficient: "Insufficient evidence",
  uncertain: "Uncertain",
};
export function EvidenceBadge({ e }: { e: EvidenceState }) {
  return <span className={cn("rounded-md border px-1.5 py-0.5 text-[11px]", e === "observed" ? "border-primary/30 text-primary" : e === "uncertain" ? "border-warn/30 text-warn" : "border-border text-muted-foreground")}>{EV[e]}</span>;
}

export function Meter({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

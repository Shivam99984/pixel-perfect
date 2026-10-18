import { useEffect, useState } from "react";
import { ChevronDown, Copy, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { buildFindingPrompt } from "@/features/improvements/build-prompt";
import { QualityPanel } from "./quality-panel";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ANALYSIS_GOALS, DIMENSION_LABELS, type CharacterAnalysisResult } from "@/features/analysis/contracts";
import { getDone, setDone } from "@/features/analysis/report-store";
import { cn } from "@/lib/utils";
import { ImageViewer } from "./image-viewer";
import { ImprovementCoach } from "./improvement-coach";
import { EvidenceBadge, Meter, ScoreRing, SeverityBadge, scoreTone } from "./score-bits";

export function DemoBanner() {
  return (
    <div role="note" className="flex items-center gap-2 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-xs font-medium text-warn">
      <FlaskConical className="size-4 shrink-0" /> DEMO DATA — Illustrative results, not an actual AI analysis.
    </div>
  );
}

export function ReportView({ report }: { report: CharacterAnalysisResult }) {
  const { score } = report;
  const [done, setDoneState] = useState<Set<string>>(new Set());
  useEffect(() => setDoneState(getDone(report.id)), [report.id]);
  const toggleDone = (id: string) => {
    const n = new Set(done);
    n.has(id) ? n.delete(id) : n.add(id);
    setDoneState(n);
    if (!report.demo) setDone(report.id, n);
  };
  const ranked = [...score.breakdown].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      {report.demo && <DemoBanner />}
      {!report.overview.is_human_character && (
        <div role="alert" className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-sm text-warn">This image does not appear to contain a human character, so realism dimensions could not be assessed.</div>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <ImageViewer src={report.image.displayUrl} alt={`Character: ${report.label}`} filename={report.demo ? undefined : `${report.label}.jpg`} />
          <p className="mt-2 text-xs text-muted-foreground">Display copy shown. Original: {report.image.width}×{report.image.height}px · {report.image.mime.replace("image/", "").toUpperCase()}</p>
        </div>

        <div className="space-y-6">
          <section className="panel p-5" aria-labelledby="score-h">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <ScoreRing score={score.overall} />
              <div className="space-y-2">
                <h2 id="score-h" className="eyebrow">Perceived realism</h2>
                <p className="text-lg leading-snug">{score.interpretation}</p>
                <p className="text-sm text-muted-foreground">{report.overview.summary}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
              <div><div className="eyebrow mb-1.5">Evidence coverage</div><Meter value={score.coverage} /><div className="mt-1 font-mono text-xs">{Math.round(score.coverage * 100)}%</div></div>
              <div><div className="eyebrow mb-1.5">Analysis confidence</div><Meter value={score.confidence} /><div className="mt-1 font-mono text-xs">{Math.round(score.confidence * 100)}%</div></div>
              <div className="text-xs text-muted-foreground"><div className="eyebrow mb-1.5">Method</div>{score.version} · {report.promptVersion}<br />{report.model}</div>
            </div>
            {ranked.length > 1 && (
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div><span className="eyebrow">Strongest · </span>{DIMENSION_LABELS[ranked[0]!.key]}</div>
                <div><span className="eyebrow">Weakest · </span>{DIMENSION_LABELS[ranked[ranked.length - 1]!.key]}</div>
              </div>
            )}
            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              Heuristic score for “{ANALYSIS_GOALS[report.goal]}”. Not calibrated against human ratings and not evidence that the character is or isn’t a real person.
            </p>
          </section>

          {report.quality && <QualityPanel q={report.quality} />}

          <section aria-labelledby="dims-h">
            <h2 id="dims-h" className="eyebrow mb-3">Dimensions</h2>
            <div className="grid gap-2">
              {report.dimensions.map((d) => (
                <Collapsible key={d.key} className="panel">
                  <CollapsibleTrigger className="group flex w-full items-center gap-3 px-4 py-3 text-left">
                    <span className="flex-1 text-sm font-medium">{DIMENSION_LABELS[d.key]}</span>
                    <EvidenceBadge e={d.evidence_state} />
                    <span className={cn("w-8 text-right font-mono text-sm", scoreTone(d.included ? d.score : null))}>{d.included ? d.score : "—"}</span>
                    <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 border-t border-border px-4 py-3 text-sm">
                    {!d.included && <p className="text-xs text-muted-foreground">Excluded from the overall score: {score.excluded.find((e) => e.key === d.key)?.reason}.</p>}
                    <p className="text-xs text-muted-foreground">Observation confidence {Math.round(d.confidence * 100)}%</p>
                    {d.observations.length > 0 && <ul className="list-disc space-y-1 pl-4 text-muted-foreground">{d.observations.map((o, i) => <li key={i}>{o}</li>)}</ul>}
                    {d.strengths.length > 0 && <ul className="space-y-1 text-good">{d.strengths.map((o, i) => <li key={i}>+ {o}</li>)}</ul>}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </section>

          <section aria-labelledby="find-h">
            <div className="mb-3 flex items-baseline gap-2">
              <h2 id="find-h" className="eyebrow">Findings & checklist</h2>
              {report.findings.length > 0 && <span className="font-mono text-xs text-muted-foreground">{done.size}/{report.findings.length} done</span>}
            </div>
            {report.findings.length === 0 ? (
              <p className="panel p-4 text-sm text-muted-foreground">No specific visible issues were identified.</p>
            ) : (
              <ol className="grid gap-2">
                {report.findings.map((f) => (
                  <li key={f.id} className={cn("panel p-4 transition-opacity", done.has(f.id) && "opacity-60")}>
                    <div className="flex items-start gap-3">
                      <Checkbox checked={done.has(f.id)} onCheckedChange={() => toggleDone(f.id)} aria-label={`Mark "${f.title}" as done`} className="mt-0.5" />
                      <div className="flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn("text-sm font-medium", done.has(f.id) && "line-through")}>{f.title}</span>
                          <SeverityBadge s={f.severity} />
                          <span className="text-[11px] text-muted-foreground">{DIMENSION_LABELS[f.dimension]} · {Math.round(f.confidence * 100)}% confident</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{f.evidence}</p>
                        <p className="text-sm"><span className="text-primary">Fix → </span>{f.correction}</p>
                        <Collapsible className="inline">
                          <CollapsibleTrigger className="text-xs text-muted-foreground underline-offset-2 hover:underline">Why & how</CollapsibleTrigger>
                          <CollapsibleContent className="mt-2 space-y-1 text-xs text-muted-foreground">
                            <p><b className="text-foreground/80">Why it looks artificial:</b> {f.why_artificial}</p>
                            <p><b className="text-foreground/80">Preserve:</b> {f.what_to_preserve}</p>
                            <p><b className="text-foreground/80">Approach:</b> {f.editing_approach}</p>
                          </CollapsibleContent>
                        </Collapsible>
                        <button type="button" className="ml-3 inline-flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline" onClick={() => { void navigator.clipboard.writeText(buildFindingPrompt(f, report.preserve)).then(() => toast.success("Fix prompt copied"), () => toast.error("Could not copy")); }}>
                          <Copy className="size-3" /> Copy fix prompt
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-2 text-[11px] text-muted-foreground">Findings are general observations; image regions are described in words rather than marked, since precise locations aren’t reliably available.</p>
          </section>
        </div>
      </div>

      <section className="panel p-5" aria-labelledby="coach-h">
        <h2 id="coach-h" className="mb-1 text-lg font-medium">Improvement coach</h2>
        <p className="mb-5 text-sm text-muted-foreground">Build a targeted edit prompt that fixes only what you choose and preserves the character’s identity.</p>
        <ImprovementCoach report={report} />
      </section>
    </div>
  );
}

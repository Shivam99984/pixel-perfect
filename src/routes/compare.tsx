import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, Plus, Scale, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageDropzone } from "@/components/image-dropzone";
import { AnalysisProgress } from "@/components/analysis-progress";
import { ImageViewer } from "@/components/report/image-viewer";
import { DemoBanner } from "@/components/report/report-view";
import { scoreTone } from "@/components/report/score-bits";
import { DIMENSION_LABELS, type CharacterAnalysisResult } from "@/features/analysis/contracts";
import { listReports, saveReport } from "@/features/analysis/report-store";
import { AnalysisFailure, runAnalysis } from "@/features/analysis/run-analysis";
import { COMPARISON_GOALS, compareReports, sharedAndUniqueFindings, type ComparisonGoal } from "@/features/comparison/compare";
import type { PreparedImage } from "@/features/upload/prepare-image";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare character versions — RealismLab AI" },
      { name: "description", content: "Compare two or three AI character versions side by side on photographic realism." },
      { property: "og:title", content: "Compare character versions — RealismLab AI" },
      { property: "og:description", content: "Side-by-side realism comparison with honest, inconclusive-when-close verdicts." },
    ],
  }),
  component: ComparePage,
});

const TAGS = ["A", "B", "C"];
type Slot = { img: PreparedImage | null; savedId: string | null };

function ComparePage() {
  const [slots, setSlots] = useState<Slot[]>([{ img: null, savedId: null }, { img: null, savedId: null }]);
  const [saved, setSaved] = useState<CharacterAnalysisResult[]>([]);
  const [goal, setGoal] = useState<ComparisonGoal>("photorealistic");
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CharacterAnalysisResult[] | null>(null);
  const [zoom, setZoom] = useState(1);
  useEffect(() => setSaved(listReports()), []);

  const ready = slots.every((s) => s.img || s.savedId);
  const update = (i: number, s: Partial<Slot>) => { setSlots(slots.map((x, j) => (j === i ? { ...x, ...s } : x))); setResults(null); };

  async function run() {
    setError(null);
    const out: CharacterAnalysisResult[] = [];
    try {
      for (let i = 0; i < slots.length; i++) {
        const s = slots[i]!;
        if (s.savedId) { out.push(saved.find((r) => r.id === s.savedId)!); continue; }
        setBusy(i);
        const r = await runAnalysis(s.img!, "max_photorealism", `${s.img!.file.name.replace(/\.[^.]+$/, "")} (${TAGS[i]})`);
        try { saveReport(r); } catch { /* storage full; still compare */ }
        out.push(r);
      }
      setResults(out);
      setSaved(listReports());
    } catch (e) {
      setError(e instanceof AnalysisFailure ? e.message : "Analysis failed.");
    } finally {
      setBusy(null);
    }
  }

  const cmp = results ? compareReports(results, goal) : null;
  const su = results ? sharedAndUniqueFindings(results) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="eyebrow">Comparison</p>
      <h1 className="font-display mt-2 text-4xl">Compare versions</h1>
      <p className="mt-2 text-muted-foreground">Upload two or three versions of a character, or pick earlier reports. All new images are analyzed with the same method.</p>

      <div className={cn("mt-8 grid gap-4", slots.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
        {slots.map((s, i) => (
          <div key={i} className="space-y-2">
            {s.savedId ? (
              <div className="panel overflow-hidden">
                <img src={saved.find((r) => r.id === s.savedId)?.image.displayUrl} alt={`Saved report ${TAGS[i]}`} className="aspect-[4/5] w-full object-contain" />
                <div className="flex items-center border-t border-border px-3 py-2 text-xs"><span className="eyebrow mr-2">{TAGS[i]}</span><span className="truncate">{saved.find((r) => r.id === s.savedId)?.label}</span>
                  <Button variant="ghost" size="sm" className="ml-auto h-7" onClick={() => update(i, { savedId: null })}>Change</Button></div>
              </div>
            ) : (
              <ImageDropzone tag={TAGS[i]} value={s.img} onChange={(img) => update(i, { img })} disabled={busy !== null} />
            )}
            {!s.img && !s.savedId && saved.length > 0 && (
              <Select onValueChange={(v) => update(i, { savedId: v })}>
                <SelectTrigger className="h-8 text-xs" aria-label={`Pick a saved report for ${TAGS[i]}`}><SelectValue placeholder="…or pick a saved report" /></SelectTrigger>
                <SelectContent>{saved.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {busy === i && <AnalysisProgress />}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {slots.length < 3 && <Button variant="outline" onClick={() => setSlots([...slots, { img: null, savedId: null }])} disabled={busy !== null}><Plus /> Add image C</Button>}
        {slots.length === 3 && <Button variant="ghost" onClick={() => { setSlots(slots.slice(0, 2)); setResults(null); }} disabled={busy !== null}>Remove C</Button>}
        <Select value={goal} onValueChange={(v) => setGoal(v as ComparisonGoal)}>
          <SelectTrigger className="w-72" aria-label="Compare by"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(COMPARISON_GOALS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
        </Select>
        <Button size="lg" className="ml-auto" disabled={!ready || busy !== null} onClick={run}>{busy !== null ? `Analyzing ${TAGS[busy]}…` : "Compare"}</Button>
      </div>
      {error && <p role="alert" className="mt-4 flex items-center gap-2 text-sm text-bad"><AlertCircle className="size-4" /> {error}</p>}

      {results && cmp && su && (
        <section className="mt-12 space-y-6" aria-live="polite">
          {results.some((r) => r.demo) && <DemoBanner />}
          <div className={cn("panel flex items-start gap-4 p-5", cmp.verdict.kind === "winner" ? "border-good/30" : "border-warn/30")}>
            {cmp.verdict.kind === "winner" ? <Trophy className="size-6 text-good" /> : <Scale className="size-6 text-warn" />}
            <div>
              <h2 className="text-lg font-medium">
                {cmp.verdict.kind === "winner" ? `${TAGS[cmp.verdict.index]} reads as more photorealistic (+${cmp.verdict.margin})` : "Inconclusive"}
              </h2>
              <p className="text-sm text-muted-foreground">{cmp.verdict.kind === "inconclusive" ? cmp.verdict.reason : `For “${COMPARISON_GOALS[goal].label}”. This ranks realism only, not attractiveness or style.`}</p>
              {cmp.caveats.length > 0 && <ul className="mt-2 list-disc pl-4 text-xs text-warn">{cmp.caveats.map((c) => <li key={c}>{c}</li>)}</ul>}
            </div>
          </div>

          <div className={cn("grid gap-4", results.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
            {results.map((r, i) => (
              <div key={r.id} className="space-y-2">
                <ImageViewer src={r.image.displayUrl} alt={`Version ${TAGS[i]}`} zoom={zoom} onZoom={setZoom} />
                <div className="flex items-center gap-2 text-sm">
                  <span className="eyebrow">{TAGS[i]}</span>
                  <span className={cn("font-mono text-2xl", scoreTone(cmp.goalScores[i] ?? null))}>{cmp.goalScores[i] != null ? `${cmp.goalScores[i]}%` : "—"}</span>
                  <span className="text-xs text-muted-foreground">overall {r.score.overall != null ? `${r.score.overall}%` : "—"}</span>
                  <Link to="/reports/$id" params={{ id: r.id }} className="ml-auto text-xs text-primary hover:underline">Full report →</Link>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Zoom is synchronized across images.</p>

          <div className="panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left"><th className="eyebrow p-3">Realism by part</th>{results.map((_, i) => <th key={i} className="eyebrow p-3 text-right">{TAGS[i]}</th>)}</tr></thead>
              <tbody>
                {cmp.perDimension.map((d) => {
                  const nums = d.scores.filter((s): s is number => s !== null);
                  const best = nums.length > 1 ? Math.max(...nums) : null;
                  return (
                    <tr key={d.key} className="border-b border-border last:border-0">
                      <td className="p-3">{DIMENSION_LABELS[d.key]}</td>
                      {d.scores.map((s, i) => <td key={i} className={cn("p-3 text-right font-mono", scoreTone(s), s !== null && s === best && "font-semibold")}>{s === null ? "n/a" : (
                        <div className="ml-auto flex w-28 items-center justify-end gap-2"><div className="h-1.5 flex-1 rounded bg-muted"><div className="h-full rounded bg-primary" style={{ width: `${s}%` }} /></div><span>{s}%</span></div>
                      )}</td>)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="panel p-5">
              <h3 className="eyebrow mb-3">Shared issues</h3>
              {su.shared.length ? <ul className="space-y-1 text-sm">{su.shared.map((d) => <li key={d}>{DIMENSION_LABELS[d]}</li>)}</ul> : <p className="text-sm text-muted-foreground">No issue area flagged in every version.</p>}
            </div>
            <div className="panel p-5">
              <h3 className="eyebrow mb-3">Unique issues</h3>
              <ul className="space-y-2 text-sm">
                {su.unique.map((fs, i) => <li key={i}><span className="eyebrow mr-2">{TAGS[i]}</span>{fs.length ? fs.map((f) => f.title).join(" · ") : <span className="text-muted-foreground">none</span>}</li>)}
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

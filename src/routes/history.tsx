import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { scoreTone } from "@/components/report/score-bits";
import type { CharacterAnalysisResult } from "@/features/analysis/contracts";
import { deleteReport, listReports } from "@/features/analysis/report-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — RealismLab AI" },
      { name: "description", content: "Your previous character realism analyses." },
      { property: "og:title", content: "History — RealismLab AI" },
      { property: "og:description", content: "Track how your AI character revisions improve." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const [items, setItems] = useState<CharacterAnalysisResult[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => setItems(listReports()), []);
  const shown = items.filter((r) => r.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="eyebrow">Saved in this browser</p>
      <h1 className="font-display mt-2 text-4xl">History</h1>
      <div className="relative mt-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by label" className="pl-9" aria-label="Search by label" />
      </div>
      {items.length === 0 ? (
        <div className="panel mt-8 p-10 text-center">
          <p className="text-muted-foreground">No analyses yet.</p>
          <Button asChild className="mt-4"><Link to="/analyze">Analyze your first character</Link></Button>
        </div>
      ) : shown.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No reports match “{q}”.</p>
      ) : (
        <ul className="mt-6 grid gap-2">
          {shown.map((r) => (
            <li key={r.id} className="panel flex items-center gap-4 p-3">
              <img src={r.image.displayUrl} alt="" loading="lazy" className="size-14 rounded-md object-cover" />
              <Link to="/reports/$id" params={{ id: r.id }} className="min-w-0 flex-1">
                <div className="truncate font-medium hover:text-primary">{r.label}</div>
                <div className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()} · {r.findings.length} findings · coverage {Math.round(r.score.coverage * 100)}%</div>
              </Link>
              <span className={cn("font-mono text-xl", scoreTone(r.score.overall))}>{r.score.overall ?? "—"}</span>
              <Button variant="ghost" size="icon" aria-label={`Delete ${r.label}`} onClick={() => { if (confirm("Delete this report?")) { deleteReport(r.id); setItems(listReports()); } }}>
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

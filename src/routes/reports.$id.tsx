import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportView } from "@/components/report/report-view";
import type { CharacterAnalysisResult } from "@/features/analysis/contracts";
import { getDemoReport } from "@/features/analysis/demo";
import { deleteReport, getReport } from "@/features/analysis/report-store";

export const Route = createFileRoute("/reports/$id")({
  head: ({ params }) => ({
    meta: [
      { title: params.id === "demo" ? "Example realism report — RealismLab AI" : "Realism report — RealismLab AI" },
      { name: "description", content: "A detailed perceived-realism report for an AI-generated character." },
      { property: "og:title", content: "Realism report — RealismLab AI" },
      { property: "og:description", content: "Scores, evidence-based findings and improvement prompts for an AI character." },
      ...(params.id === "demo" ? [] : [{ name: "robots", content: "noindex" }]),
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<CharacterAnalysisResult | null | undefined>(undefined);
  useEffect(() => setReport(id === "demo" ? getDemoReport() : getReport(id)), [id]);

  if (report === undefined)
    return <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2"><Skeleton className="aspect-[4/5]" /><Skeleton className="h-80" /></div>;
  if (report === null)
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-medium">Report not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">It may have been deleted, or it was saved in a different browser.</p>
        <Button asChild className="mt-6"><Link to="/analyze">Analyze a character</Link></Button>
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <p className="eyebrow">Report · {new Date(report.createdAt).toLocaleString()}</p>
          <h1 className="font-display mt-1 text-3xl">{report.label}</h1>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" asChild><Link to="/compare">Compare</Link></Button>
          {!report.demo && (
            <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this report and its image?")) { deleteReport(report.id); navigate({ to: "/history" }); } }}>
              <Trash2 /> Delete
            </Button>
          )}
        </div>
      </div>
      <ReportView report={report} />
    </div>
  );
}

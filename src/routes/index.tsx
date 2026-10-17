import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Columns3, Eye, History, Lock, ScanFace, Sparkles } from "lucide-react";
import heroPortrait from "@/assets/hero-portrait.jpg";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/report/score-bits";
import { getDemoReport } from "@/features/analysis/demo";
import { DIMENSION_LABELS } from "@/features/analysis/contracts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RealismLab AI — Your AI character, under the microscope" },
      { name: "description", content: "Analyze facial realism of AI-generated characters, compare versions, and get identity-preserving improvement prompts." },
      { property: "og:title", content: "RealismLab AI — Your AI character, under the microscope" },
      { property: "og:description", content: "Find what makes your AI character look artificial. Understand why. Improve it with confidence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: ScanFace, title: "Realism breakdown", text: "Seven dimensions — skin, eyes, mouth, hair, anatomy, lighting, coherence — each with evidence state and confidence." },
  { icon: Eye, title: "Facial detail inspection", text: "Findings describe what is actually visible. Hidden teeth or cropped hands are never scored." },
  { icon: Columns3, title: "Side-by-side comparison", text: "Compare two or three versions. Too-close or non-comparable results are called inconclusive." },
  { icon: Sparkles, title: "Improvement coach", text: "Copy-ready prompts that change only what you choose and preserve identity, skin tone, pose and more." },
  { icon: History, title: "Version history", text: "Every analysis is a new report, so you can track how revisions improve." },
  { icon: Lock, title: "Private by default", text: "Images go to the AI vision provider only when you press Analyze, and are never used for training." },
];

function Landing() {
  const navigate = useNavigate();
  const demo = getDemoReport();
  return (
    <>
      <section className="glow-bg relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div>
            <p className="eyebrow mb-5">Character realism analyzer</p>
            <h1 className="font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Your AI character.<br /><em className="text-primary">Under the microscope.</em>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Discover what makes your AI-generated characters look artificial. Analyze facial realism, compare versions, and get actionable improvements.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate({ to: "/analyze" })}>Analyze a character <ArrowRight /></Button>
              <Button size="lg" variant="outline" asChild><Link to="/compare">Compare versions</Link></Button>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <img src={heroPortrait} alt="Close-up photorealistic portrait of a woman lit by soft window light" width={1024} height={1280} className="aspect-[4/5] w-full rounded-2xl border border-border object-cover" />
            <Link to="/reports/$id" params={{ id: "demo" }} className="panel absolute -bottom-6 -left-4 flex items-center gap-4 p-3 pr-5 transition-transform hover:-translate-y-0.5 sm:-left-10">
              <ScoreRing score={demo.score.overall} size={72} />
              <div className="text-xs">
                <div className="eyebrow mb-1 text-warn">Demo data · illustrative</div>
                <div className="text-sm text-foreground">{demo.findings[0]?.title}</div>
                <div className="text-muted-foreground">{DIMENSION_LABELS[demo.findings[0]?.dimension ?? "skin"]} · view example →</div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6" aria-labelledby="how">
        <h2 id="how" className="eyebrow mb-8">How it works</h2>
        <ol className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-5">
          {["Upload one character or up to three versions", "Inspect skin, eyes, mouth, hair, anatomy and lighting", "Review findings with evidence and confidence", "Generate identity-preserving improvement prompts", "Compare revisions and track progress"].map((s, i) => (
            <li key={s} className="bg-surface p-5">
              <div className="font-mono text-xs text-primary">0{i + 1}</div>
              <p className="mt-3 text-sm">{s}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6" aria-labelledby="features">
        <h2 id="features" className="font-display mb-10 text-4xl">Built for creators who sweat the details.</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="panel p-6">
              <f.icon className="size-5 text-primary" aria-hidden />
              <h3 className="mt-4 font-medium">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-surface/50" aria-labelledby="trust">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3">
          <h2 id="trust" className="font-display text-3xl">Honest by design.</h2>
          <p className="text-sm text-muted-foreground">Scores are AI-assisted visual assessments of <b className="text-foreground">perceived photographic realism</b> — not scientific proof, and not a detector of AI origin. They’re heuristic and not yet calibrated against human ratings.</p>
          <p className="text-sm text-muted-foreground">Your image is sent to an external AI vision provider only when you start an analysis. Reports are currently kept in your browser, and you can delete them at any time. Images are never used to train models.</p>
        </div>
      </section>
    </>
  );
}

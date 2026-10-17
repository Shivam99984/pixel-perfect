import { useMemo, useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { CharacterAnalysisResult, PreserveTraits } from "@/features/analysis/contracts";
import { buildImprovementPrompt, PRESERVE_KEYS, TARGET_TOOLS, type Strength, type TargetTool } from "@/features/improvements/build-prompt";

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Couldn't access the clipboard");
  }
}

export function ImprovementCoach({ report }: { report: CharacterAnalysisResult }) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(report.findings.slice(0, 3).map((f) => f.id)));
  const [tool, setTool] = useState<TargetTool>("generic");
  const [strength, setStrength] = useState<Strength>("subtle");
  const [unlocked, setUnlocked] = useState<Set<keyof PreserveTraits>>(new Set());
  const [avoid, setAvoid] = useState("");
  const [nonce, setNonce] = useState(0);

  const prompt = useMemo(
    () => buildImprovementPrompt({ findings: report.findings.filter((f) => selected.has(f.id)), preserve: report.preserve, tool, strength, unlocked, avoid }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [report, selected, tool, strength, unlocked, avoid, nonce],
  );

  if (!report.findings.length) return <p className="text-sm text-muted-foreground">No issues were found that need an improvement prompt.</p>;

  const toggle = <T,>(set: Set<T>, v: T) => { const n = new Set(set); n.has(v) ? n.delete(v) : n.add(v); return n; };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-5">
        <fieldset className="space-y-2">
          <legend className="eyebrow mb-2">Fix these</legend>
          {report.findings.map((f) => (
            <label key={f.id} className="flex cursor-pointer items-start gap-2.5 text-sm">
              <Checkbox checked={selected.has(f.id)} onCheckedChange={() => setSelected(toggle(selected, f.id))} className="mt-0.5" />
              <span>{f.title}</span>
              <Button variant="ghost" size="icon" className="ml-auto size-6 shrink-0" aria-label={`Copy fix for ${f.title}`} onClick={(e) => { e.preventDefault(); copy(`${f.title}: ${f.correction}`); }}>
                <Copy className="size-3" />
              </Button>
            </label>
          ))}
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="eyebrow mb-2">Allow these to change (default: preserve all)</legend>
          <div className="grid grid-cols-2 gap-2">
            {PRESERVE_KEYS.map((p) => (
              <label key={p.key} className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <Checkbox checked={unlocked.has(p.key)} onCheckedChange={() => setUnlocked(toggle(unlocked, p.key))} />
                {p.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <span className="eyebrow">Target tool</span>
            <Select value={tool} onValueChange={(v) => setTool(v as TargetTool)}>
              <SelectTrigger aria-label="Target tool"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(TARGET_TOOLS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <span className="eyebrow">Edit strength</span>
            <ToggleGroup type="single" variant="outline" value={strength} onValueChange={(v) => v && setStrength(v as Strength)} className="w-full">
              {(["subtle", "moderate", "strong"] as const).map((s) => <ToggleGroupItem key={s} value={s} className="flex-1 capitalize text-xs">{s}</ToggleGroupItem>)}
            </ToggleGroup>
          </div>
        </div>
        <div className="space-y-1.5">
          <span className="eyebrow">Exclude unwanted changes</span>
          <Input value={avoid} onChange={(e) => setAvoid(e.target.value)} placeholder="e.g. add makeup, change expression" maxLength={200} />
        </div>
      </div>
      <div className="flex flex-col">
        <div className="mb-2 flex items-center gap-2">
          <span className="eyebrow">Copy-ready prompt</span>
          <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={() => setNonce(nonce + 1)}><RefreshCw className="size-3" /> Regenerate</Button>
          <Button size="sm" className="h-7 text-xs" disabled={!prompt} onClick={() => copy(prompt)}><Copy className="size-3" /> Copy</Button>
        </div>
        <pre className="min-h-64 flex-1 whitespace-pre-wrap rounded-lg border border-border bg-background p-4 font-mono text-xs leading-relaxed text-foreground/90">
          {prompt || "Select at least one issue to build a prompt."}
        </pre>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Check className="size-3" /> This creates a prompt only — no image is edited here.</p>
      </div>
    </div>
  );
}

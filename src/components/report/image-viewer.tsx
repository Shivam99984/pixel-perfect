import { useState } from "react";
import { Download, Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function ImageViewer({ src, alt, filename, zoom: extZoom, onZoom }: { src: string; alt: string; filename?: string | undefined; zoom?: number | undefined; onZoom?: ((z: number) => void) | undefined }) {
  const [own, setOwn] = useState(1);
  const zoom = extZoom ?? own;
  const setZoom = (z: number) => (onZoom ? onZoom(z) : setOwn(z));
  const [full, setFull] = useState(false);
  const clamp = (z: number) => Math.min(4, Math.max(1, Math.round(z * 4) / 4));
  return (
    <div className="panel overflow-hidden">
      <div className="relative aspect-[4/5] overflow-auto bg-muted/40">
        <img src={src} alt={alt} className="mx-auto h-full w-full origin-top-left object-contain transition-transform" style={{ transform: `scale(${zoom})` }} />
      </div>
      <div className="flex items-center gap-1 border-t border-border px-2 py-1.5">
        <Button variant="ghost" size="icon" className="size-8" aria-label="Zoom out" onClick={() => setZoom(clamp(zoom - 0.25))}><Minus className="size-4" /></Button>
        <span className="w-12 text-center font-mono text-xs text-muted-foreground" aria-live="polite">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="icon" className="size-8" aria-label="Zoom in" onClick={() => setZoom(clamp(zoom + 0.25))}><Plus className="size-4" /></Button>
        <Button variant="ghost" size="icon" className="size-8" aria-label="Reset zoom" onClick={() => setZoom(1)}><RotateCcw className="size-4" /></Button>
        <div className="ml-auto flex gap-1">
          {filename && (
            <Button variant="ghost" size="icon" className="size-8" asChild aria-label="Download image">
              <a href={src} download={filename}><Download className="size-4" /></a>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="size-8" aria-label="Full screen" onClick={() => setFull(true)}><Maximize2 className="size-4" /></Button>
        </div>
      </div>
      <Dialog open={full} onOpenChange={setFull}>
        <DialogContent className="max-w-[95vw] border-border bg-background p-2 sm:max-w-[95vw]">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <img src={src} alt={alt} className="max-h-[88vh] w-full object-contain" />
        </DialogContent>
      </Dialog>
    </div>
  );
}

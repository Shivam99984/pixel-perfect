import { useRef, useState } from "react";
import { ImagePlus, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImageValidationError, prepareImage, type PreparedImage } from "@/features/upload/prepare-image";

export function ImageDropzone({
  value,
  onChange,
  tag,
  disabled,
  className,
}: {
  value: PreparedImage | null;
  onChange: (img: PreparedImage | null) => void;
  tag?: string | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function accept(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const img = await prepareImage(file);
      if (value) URL.revokeObjectURL(value.originalUrl);
      onChange(img);
    } catch (e) {
      setError(e instanceof ImageValidationError ? e.message : "Could not read this image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label={tag ? `Upload image ${tag}` : "Upload image"}
        onChange={(e) => {
          accept(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {value ? (
        <div className="panel relative overflow-hidden">
          {tag && <span className="eyebrow absolute left-3 top-3 z-10 rounded bg-background/80 px-2 py-1 text-foreground">{tag}</span>}
          <img src={value.originalUrl} alt={`Preview of ${value.file.name}`} className="aspect-[4/5] w-full bg-muted object-contain" />
          <div className="flex items-center gap-2 border-t border-border px-3 py-2 text-xs text-muted-foreground">
            <span className="truncate">{value.file.name}</span>
            <span className="shrink-0 font-mono">{value.width}×{value.height}</span>
            <div className="ml-auto flex gap-1">
              <Button variant="ghost" size="icon" className="size-7" disabled={disabled} onClick={() => input.current?.click()} aria-label="Replace image">
                <RefreshCw className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7" disabled={disabled} onClick={() => { URL.revokeObjectURL(value.originalUrl); onChange(null); }} aria-label="Remove image">
                <X className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); accept(e.dataTransfer.files?.[0]); }}
          className={cn(
            "flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-input bg-surface px-6 text-center transition-colors hover:border-primary/60 hover:bg-accent/40",
            over && "border-primary bg-accent/50",
          )}
        >
          {tag && <span className="eyebrow">Image {tag}</span>}
          <ImagePlus className="size-7 text-primary" aria-hidden />
          <span className="text-sm">{busy ? "Checking image…" : "Drop a character image or click to browse"}</span>
          <span className="text-xs text-muted-foreground">JPEG, PNG or WebP · up to 10 MB · 256–8000 px</span>
        </button>
      )}
      {error && <p role="alert" className="text-xs text-bad">{error}</p>}
    </div>
  );
}

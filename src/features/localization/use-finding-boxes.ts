import { useEffect, useState } from "react";
import type { VisualFinding } from "@/features/analysis/contracts";
import { boxForRegion, resolveRegion, type Box } from "./regions";

export type LocateStatus = "idle" | "loading" | "done" | "failed";

/** Locates findings on the image via face/body points. Unlocatable findings are simply absent from the map. */
export function useFindingBoxes(src: string, findings: VisualFinding[]) {
  const [state, setState] = useState<{ status: LocateStatus; boxes: Map<string, Box> }>({ status: "idle", boxes: new Map() });
  useEffect(() => {
    const wanted = findings.map((f) => [f.id, resolveRegion(f)] as const).filter(([, r]) => r);
    if (!wanted.length) { setState({ status: "done", boxes: new Map() }); return; }
    let live = true;
    setState({ status: "loading", boxes: new Map() });
    import("./detect")
      .then((m) => m.detectLandmarks(src))
      .then((lm) => {
        if (!live) return;
        const boxes = new Map<string, Box>();
        for (const [id, r] of wanted) { const b = boxForRegion(r!, lm); if (b) boxes.set(id, b); }
        setState({ status: "done", boxes });
      })
      .catch(() => live && setState({ status: "failed", boxes: new Map() }));
    return () => { live = false; };
  }, [src, findings]);
  return state;
}

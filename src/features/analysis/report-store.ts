import type { CharacterAnalysisResult } from "./contracts";

/** Reports are kept only in this browser (localStorage) until accounts are added. */
const KEY = "realismlab.reports.v1";
const PROGRESS_KEY = "realismlab.progress.v1";

function readAll(): CharacterAnalysisResult[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function listReports() {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getReport(id: string) {
  return readAll().find((r) => r.id === id) ?? null;
}

export function saveReport(r: CharacterAnalysisResult) {
  let all = [r, ...readAll().filter((x) => x.id !== r.id)];
  // Keep within storage quota by trimming oldest.
  for (;;) {
    try {
      localStorage.setItem(KEY, JSON.stringify(all));
      return;
    } catch {
      if (all.length <= 1) throw new Error("Not enough browser storage to save this report.");
      all = all.slice(0, -1);
    }
  }
}

export function deleteReport(id: string) {
  localStorage.setItem(KEY, JSON.stringify(readAll().filter((r) => r.id !== id)));
  const p = readProgress();
  delete p[id];
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

function readProgress(): Record<string, string[]> {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
  } catch {
    return {};
  }
}

export function getDone(id: string) {
  return new Set(readProgress()[id] ?? []);
}

export function setDone(id: string, done: Set<string>) {
  const p = readProgress();
  p[id] = [...done];
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

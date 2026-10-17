import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-medium tracking-tight">
          <span aria-hidden className="grid size-6 place-items-center rounded-md border border-primary/40 bg-primary/10">
            <span className="size-2 rounded-full bg-primary" />
          </span>
          RealismLab <span className="text-muted-foreground">AI</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
          <Link to="/analyze" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>Analyze</Link>
          <Link to="/compare" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>Compare</Link>
          <Link to="/history" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>History</Link>
          <Link to="/reports/$id" params={{ id: "demo" }} className="hover:text-foreground">Example</Link>
        </nav>
        <div className="ml-auto">
          <Button asChild size="sm">
            <Link to="/analyze">Analyze my character</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:px-6">
        <span>RealismLab AI — AI-assisted visual assessment, not proof of authenticity or AI origin.</span>
        <span className="sm:ml-auto">Images are sent to an AI vision provider only when you start an analysis.</span>
      </div>
    </footer>
  );
}

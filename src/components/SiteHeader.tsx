import { ArrowUpRight, Rss } from "lucide-react";
import { site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-ink/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="/" className="flex items-center gap-3 font-semibold tracking-tight">
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-lg border border-accent/40 bg-panel font-mono text-sm text-accent"
          >
            KK
          </span>
          <span className="flex items-baseline gap-2">
            {site.name}
            <span className="font-mono text-xs font-normal text-accent">/blog</span>
          </span>
        </a>
        <nav aria-label="Primary" className="flex items-center gap-1 text-sm">
          <a href="/" className="rounded-md px-3 py-2 text-muted transition hover:text-fg">
            Posts
          </a>
          <a
            href={site.home}
            className="hidden items-center gap-1 rounded-md px-3 py-2 text-muted transition hover:text-fg sm:inline-flex"
          >
            Portfolio
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
          <a
            href="/feed.xml"
            className="ml-1 grid size-9 place-items-center rounded-md border border-line text-muted transition hover:border-accent/50 hover:text-accent"
            aria-label="RSS feed"
            title="RSS feed"
          >
            <Rss className="size-4" aria-hidden="true" />
          </a>
        </nav>
      </div>
    </header>
  );
}

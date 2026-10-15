import { site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-grounds/70 bg-espresso/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <a href="/" className="group flex items-baseline gap-2.5">
          <span className="font-serif text-[1.35rem] font-semibold tracking-tight text-milk">Kerem Kurban</span>
          <span className="text-sm text-mocha transition group-hover:text-crema">notes</span>
        </a>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-1 text-sm">
            <li><a href="/" className="rounded px-3 py-2 text-latte transition hover:text-crema">All posts</a></li>
            <li className="hidden sm:block">
              <a href={site.home} className="rounded px-3 py-2 text-latte transition hover:text-crema">Portfolio</a>
            </li>
            <li><a href="/feed.xml" className="rounded px-3 py-2 text-latte transition hover:text-crema">RSS</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

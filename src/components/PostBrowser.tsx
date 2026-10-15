"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { PostMeta } from "@/lib/posts";
import { PostCard } from "./PostCard";

export function PostBrowser({ posts, tags }: { posts: PostMeta[]; tags: { tag: string; count: number }[] }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter(
      (p) =>
        (!tag || p.tags.includes(tag)) &&
        (!q || `${p.title} ${p.summary} ${p.tags.join(" ")}`.toLowerCase().includes(q)),
    );
  }, [posts, query, tag]);

  const filtering = Boolean(query.trim() || tag);
  const [first, ...rest] = filtered;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Filter by topic" className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTag(null)}
            aria-pressed={tag === null}
            className={`rounded-full border px-3 py-1 font-mono text-xs transition ${
              tag === null ? "border-accent/60 bg-accent/10 text-accent" : "border-line text-muted hover:text-fg"
            }`}
          >
            All <span className="opacity-60">{posts.length}</span>
          </button>
          {tags.map(({ tag: t, count }) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag(tag === t ? null : t)}
              aria-pressed={tag === t}
              className={`rounded-full border px-3 py-1 font-mono text-xs transition ${
                tag === t ? "border-accent/60 bg-accent/10 text-accent" : "border-line text-muted hover:text-fg"
              }`}
            >
              {t} <span className="opacity-60">{count}</span>
            </button>
          ))}
        </div>
        <label className="relative block sm:w-64">
          <span className="sr-only">Search posts</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts"
            className="w-full rounded-lg border border-line bg-panel/60 py-2 pl-9 pr-9 text-sm text-fg placeholder:text-muted focus:border-accent/50 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-fg"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </label>
      </div>

      <p className="sr-only" aria-live="polite">{filtered.length} posts shown</p>

      {filtered.length === 0 ? (
        <p className="mt-12 rounded-2xl border border-dashed border-line p-10 text-center text-muted">
          No posts match that yet.
        </p>
      ) : filtering ? (
        <ul className="mt-8 grid gap-5">
          {filtered.map((p) => (
            <li key={p.slug}><PostCard post={p} /></li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 grid gap-5">
          <PostCard post={first} featured />
          {rest.length ? (
            <ul className="grid gap-5 md:grid-cols-2">
              {rest.map((p) => (
                <li key={p.slug}><PostCard post={p} /></li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}

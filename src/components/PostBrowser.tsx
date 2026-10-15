"use client";

import { useMemo, useState } from "react";
import type { PostMeta } from "@/lib/posts";
import { PostEntry } from "./PostEntry";

type Props = { posts: PostMeta[]; tags: { tag: string; count: number }[] };

export function PostBrowser({ posts, tags }: Props) {
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
  const topic = (t: string | null, label: string, count: number) => {
    const on = tag === t;
    return (
      <button
        key={label}
        type="button"
        onClick={() => setTag(on && t ? null : t)}
        aria-pressed={on}
        className={`rounded-sm px-2.5 py-1 text-sm transition ${
          on ? "bg-crema text-espresso" : "bg-roast text-latte hover:bg-roast-2 hover:text-milk"
        }`}
      >
        {label} <span className={on ? "text-espresso/70" : "text-mocha"}>{count}</span>
      </button>
    );
  };

  return (
    <div>
      <div className="flex flex-col gap-5 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p id="topics-label" className="mb-2.5 text-sm text-mocha">Filter by topic</p>
          <div role="group" aria-labelledby="topics-label" className="flex flex-wrap gap-2">
            {topic(null, "Everything", posts.length)}
            {tags.map(({ tag: t, count }) => topic(t, t, count))}
          </div>
        </div>
        <label className="block md:w-72">
          <span className="mb-2.5 block text-sm text-mocha">Search titles and summaries</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. LangGraph"
            className="w-full rounded-sm border border-grounds bg-roast px-3 py-2 text-sm text-milk placeholder:text-mocha/70 focus:border-crema/70 focus:outline-none"
          />
        </label>
      </div>

      <p className="sr-only" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "post" : "posts"} shown
      </p>

      {filtered.length === 0 ? (
        <div className="border-t border-grounds py-14">
          <p className="font-serif text-xl text-milk">Nothing here matches that.</p>
          <p className="mt-2 text-sm text-mocha">
            Try a shorter search, or{" "}
            <button
              type="button"
              onClick={() => { setQuery(""); setTag(null); }}
              className="text-crema underline underline-offset-4"
            >
              show every post
            </button>
            .
          </p>
        </div>
      ) : (
        <div className="border-b border-grounds">
          {filtered.map((p, i) => (
            <PostEntry key={p.slug} post={p} lead={!filtering && i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}

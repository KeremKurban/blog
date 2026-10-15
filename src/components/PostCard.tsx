import { ArrowRight } from "lucide-react";
import type { PostMeta } from "@/lib/posts";
import { TagChip } from "./TagChip";

const fmt = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function PostCard({ post, featured = false }: { post: PostMeta; featured?: boolean }) {
  return (
    <article
      className={`group relative rounded-2xl border border-line bg-panel/40 transition hover:border-accent/40 hover:bg-panel/70 ${
        featured ? "p-7 sm:p-9" : "p-6"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted">
        {featured ? <span className="rounded-full bg-accent/10 px-2 py-0.5 text-accent">Latest</span> : null}
        <time dateTime={post.date}>{fmt(post.date)}</time>
        <span aria-hidden="true">·</span>
        <span>{post.readingMinutes} min read</span>
      </div>
      <h2 className={`mt-3 font-semibold tracking-tight text-fg ${featured ? "text-2xl sm:text-3xl" : "text-xl"}`}>
        <a href={`/posts/${post.slug}/`} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
          {post.title}
        </a>
      </h2>
      <p className={`mt-3 text-soft/90 ${featured ? "max-w-3xl text-base sm:text-lg" : "text-[0.95rem]"}`}>{post.summary}</p>
      <div className="relative z-10 mt-5 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <li key={t}><TagChip tag={t} /></li>
          ))}
        </ul>
        <span className="inline-flex items-center gap-1 text-sm text-accent opacity-80 transition group-hover:opacity-100">
          Read
          <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

import type { PostMeta } from "@/lib/posts";
import { TagChip } from "./TagChip";

const day = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** One line of the contents page: date in the margin, the post on the right. */
export function PostEntry({ post, lead = false }: { post: PostMeta; lead?: boolean }) {
  return (
    <article className="group relative grid gap-x-10 gap-y-2 border-t border-rule py-9 sm:grid-cols-[9.5rem_minmax(0,1fr)]">
      <div className="text-sm text-muted sm:pt-2">
        <time dateTime={post.date} className="block">{day(post.date)}</time>
        <span className="mt-0.5 inline-block sm:block">{post.readingMinutes} minute read</span>
      </div>
      <div className="max-w-3xl">
        <h2
          className={`font-serif font-medium leading-[1.15] tracking-tight text-ink ${
            lead ? "text-[2rem] sm:text-[2.6rem]" : "text-[1.6rem] sm:text-[1.85rem]"
          }`}
        >
          <a
            href={`/posts/${post.slug}/`}
            className="decoration-accent/60 decoration-1 underline-offset-[6px] after:absolute after:inset-0 group-hover:underline focus-visible:outline-none"
          >
            {post.title}
          </a>
        </h2>
        <p className={`mt-3 font-serif text-body/90 ${lead ? "text-[1.2rem] leading-relaxed" : "text-[1.08rem] leading-relaxed"}`}>
          {post.summary}
        </p>
        <ul className="relative z-10 mt-4 flex flex-wrap gap-2" aria-label="Topics">
          {post.tags.map((t) => (
            <li key={t}><TagChip tag={t} /></li>
          ))}
        </ul>
      </div>
    </article>
  );
}

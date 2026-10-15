import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { formatDate, getAllPosts, getPost } from "@/lib/posts";
import { site } from "@/lib/site";
import { TagChip } from "@/components/TagChip";
import { TableOfContents } from "@/components/TableOfContents";
import { ReadingProgress } from "@/components/ReadingProgress";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: `${site.url}/posts/${slug}/` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.summary,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [site.name],
      tags: post.tags,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  const all = getAllPosts();
  const i = all.findIndex((p) => p.slug === slug);
  const newer = i > 0 ? all.at(i - 1) : undefined;
  const older = i < all.length - 1 ? all.at(i + 1) : undefined;

  return (
    <>
      <ReadingProgress />
      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
        <a href="/" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-accent">
          <ArrowLeft className="size-4" aria-hidden="true" />
          All posts
        </a>

        <header className="mt-8 max-w-3xl">
          <ul className="flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <li key={t}><TagChip tag={t} /></li>
            ))}
          </ul>
          <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-fg sm:text-[2.6rem]">{post.title}</h1>
          <p className="mt-5 text-lg text-soft/85">{post.summary}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted">
            <span className="text-soft">{site.name}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            {post.updated ? (
              <>
                <span aria-hidden="true">·</span>
                <span>Updated <time dateTime={post.updated}>{formatDate(post.updated)}</time></span>
              </>
            ) : null}
            <span aria-hidden="true">·</span>
            <span>{post.readingMinutes} min read</span>
          </div>
        </header>

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_15rem]">
          <article
            id="article-body"
            className="article prose prose-invert max-w-3xl min-w-0"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto pr-2">
              <TableOfContents items={post.toc} />
            </div>
          </aside>
        </div>

        {newer || older ? (
          <nav aria-label="More posts" className="mt-20 grid max-w-3xl gap-4 border-t border-line pt-8 sm:grid-cols-2">
            {older ? (
              <a href={`/posts/${older.slug}/`} className="rounded-xl border border-line p-5 transition hover:border-accent/40">
                <span className="flex items-center gap-1 font-mono text-xs text-muted"><ArrowLeft className="size-3.5" aria-hidden="true" />Older</span>
                <span className="mt-2 block font-medium text-fg">{older.title}</span>
              </a>
            ) : <span />}
            {newer ? (
              <a href={`/posts/${newer.slug}/`} className="rounded-xl border border-line p-5 text-right transition hover:border-accent/40">
                <span className="flex items-center justify-end gap-1 font-mono text-xs text-muted">Newer<ArrowRight className="size-3.5" aria-hidden="true" /></span>
                <span className="mt-2 block font-medium text-fg">{newer.title}</span>
              </a>
            ) : null}
          </nav>
        ) : null}
      </div>
    </>
  );
}

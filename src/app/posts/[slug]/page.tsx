import type { Metadata } from "next";
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
      <div className="mx-auto max-w-6xl px-5 pt-12 sm:px-8 sm:pt-16">
        <header className="max-w-[46rem]">
          <a href="/" className="text-sm text-mocha transition hover:text-crema">
            All posts
          </a>
          <h1 className="mt-6 font-serif text-[2.3rem] font-medium leading-[1.08] tracking-[-0.015em] text-milk sm:text-[3.2rem]">
            {post.title}
          </h1>
          <p className="mt-6 font-serif text-[1.25rem] italic leading-relaxed text-latte">{post.summary}</p>
          <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4 border-t border-grounds pt-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-mocha">Written by</dt>
              <dd className="mt-0.5 text-milk">{site.name}</dd>
            </div>
            <div>
              <dt className="text-mocha">Published</dt>
              <dd className="mt-0.5 text-milk"><time dateTime={post.date}>{formatDate(post.date)}</time></dd>
            </div>
            <div>
              <dt className="text-mocha">{post.updated ? "Updated" : "Reading time"}</dt>
              <dd className="mt-0.5 text-milk">
                {post.updated ? <time dateTime={post.updated}>{formatDate(post.updated)}</time> : `${post.readingMinutes} minutes`}
              </dd>
            </div>
          </dl>
          <ul className="mt-4 flex flex-wrap gap-2 border-b border-grounds pb-4" aria-label="Topics">
            {post.tags.map((t) => (
              <li key={t}><TagChip tag={t} /></li>
            ))}
          </ul>
        </header>

        <div className="mt-12 grid gap-14 lg:grid-cols-[minmax(0,46rem)_15rem] lg:justify-between">
          <article
            id="article-body"
            className="article prose prose-invert max-w-none min-w-0"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto pr-2">
              <TableOfContents items={post.toc} />
            </div>
          </aside>
        </div>

        {newer || older ? (
          <nav aria-label="More posts" className="mt-24 grid max-w-[46rem] gap-6 border-t border-grounds pt-8 sm:grid-cols-2">
            {older ? (
              <a href={`/posts/${older.slug}/`} className="group">
                <span className="text-sm text-mocha">Previous post</span>
                <span className="mt-1 block font-serif text-xl text-milk group-hover:text-crema">{older.title}</span>
              </a>
            ) : <span />}
            {newer ? (
              <a href={`/posts/${newer.slug}/`} className="group sm:text-right">
                <span className="text-sm text-mocha">Next post</span>
                <span className="mt-1 block font-serif text-xl text-milk group-hover:text-crema">{newer.title}</span>
              </a>
            ) : null}
          </nav>
        ) : null}
      </div>
    </>
  );
}

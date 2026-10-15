import type { Metadata } from "next";
import { getAllPosts, getAllTags, tagSlug } from "@/lib/posts";
import { PostEntry } from "@/components/PostEntry";

type Params = { tag: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getAllTags().map(({ tag }) => ({ tag: tagSlug(tag) }));
}

const nameOf = (slug: string) => getAllTags().find(({ tag }) => tagSlug(tag) === slug)?.tag ?? slug;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { tag } = await params;
  return { title: `Posts on ${nameOf(tag)}` };
}

export default async function TagPage({ params }: { params: Promise<Params> }) {
  const { tag } = await params;
  const name = nameOf(tag);
  const posts = getAllPosts().filter((p) => p.tags.some((t) => tagSlug(t) === tag));
  return (
    <div className="mx-auto max-w-6xl px-5 pt-12 sm:px-8 sm:pt-16">
      <a href="/" className="text-sm text-muted transition hover:text-accent">All posts</a>
      <h1 className="mt-6 font-serif text-[2.4rem] font-medium tracking-tight text-ink">Posts on {name}</h1>
      <p className="mt-2 text-muted">{posts.length} {posts.length === 1 ? "post" : "posts"} so far</p>
      <div className="mt-10 border-b border-rule">
        {posts.map((p) => (
          <PostEntry key={p.slug} post={p} />
        ))}
      </div>
    </div>
  );
}

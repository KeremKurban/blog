import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getAllPosts, getAllTags, tagSlug } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";

type Params = { tag: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getAllTags().map(({ tag }) => ({ tag: tagSlug(tag) }));
}

const nameOf = (slug: string) => getAllTags().find(({ tag }) => tagSlug(tag) === slug)?.tag ?? slug;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { tag } = await params;
  return { title: `Posts tagged ${nameOf(tag)}` };
}

export default async function TagPage({ params }: { params: Promise<Params> }) {
  const { tag } = await params;
  const name = nameOf(tag);
  const posts = getAllPosts().filter((p) => p.tags.some((t) => tagSlug(t) === tag));
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
      <a href="/" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-accent">
        <ArrowLeft className="size-4" aria-hidden="true" />
        All posts
      </a>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight">
        <span className="font-mono text-accent">#</span>{name}
      </h1>
      <p className="mt-2 text-muted">{posts.length} {posts.length === 1 ? "post" : "posts"}</p>
      <ul className="mt-8 grid gap-5">
        {posts.map((p) => (
          <li key={p.slug}><PostCard post={p} /></li>
        ))}
      </ul>
    </div>
  );
}

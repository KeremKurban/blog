import { getAllPosts, getAllTags } from "@/lib/posts";
import { site } from "@/lib/site";
import { PostBrowser } from "@/components/PostBrowser";

export default function Home() {
  const posts = getAllPosts();
  const tags = getAllTags();

  return (
    <>
      <section className="relative overflow-hidden border-b border-line/60">
        <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-16 sm:px-6 sm:pt-24">
          <p className="font-mono text-sm text-accent">~/blog</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-fg sm:text-5xl">{site.tagline}</h1>
          <p className="mt-5 max-w-2xl text-lg text-soft/85">
            Long-form notes from building agentic systems in regulated industry, evaluating them, and studying how models
            reach their outputs. Each post is written to make sense on its own, even if you arrive cold.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6" aria-label="Posts">
        <PostBrowser posts={posts} tags={tags} />
      </section>
    </>
  );
}

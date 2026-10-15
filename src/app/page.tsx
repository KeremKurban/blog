import { getAllPosts, getAllTags } from "@/lib/posts";
import { site } from "@/lib/site";
import { PostBrowser } from "@/components/PostBrowser";
import { CoffeeRing } from "@/components/CoffeeRing";

export default function Home() {
  const posts = getAllPosts();
  const tags = getAllTags();

  return (
    <>
      <section className="relative overflow-hidden">
        <CoffeeRing className="pointer-events-none absolute -right-28 -top-20 w-[24rem] opacity-50 sm:opacity-100 sm:-right-10 sm:top-0 sm:w-[34rem] lg:right-[6%]" />
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-20 sm:px-8 sm:pb-20 sm:pt-28">
          <h1 className="max-w-[18ch] font-serif text-[2.9rem] font-medium leading-[1.04] tracking-[-0.02em] text-ink sm:text-[4.4rem]">
            {site.tagline}
          </h1>
          <p className="mt-7 max-w-[60ch] font-serif text-[1.2rem] leading-relaxed text-body sm:text-[1.3rem]">
            Long-form writing by an ML engineer in Geneva. Some posts are about machine learning and the systems
            around it, others wander further. Every post opens with a short summary and an introduction, so it reads
            well even if you arrive cold.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 sm:px-8" aria-label="Posts">
        <PostBrowser posts={posts} tags={tags} />
      </section>
    </>
  );
}

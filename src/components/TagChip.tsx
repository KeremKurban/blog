import { tagSlug } from "@/lib/tags";

export function TagChip({ tag }: { tag: string }) {
  return (
    <a
      href={`/tags/${tagSlug(tag)}/`}
      className="inline-block rounded-sm bg-roast px-2 py-0.5 text-[0.8rem] text-mocha transition hover:bg-roast-2 hover:text-crema"
    >
      {tag}
    </a>
  );
}
